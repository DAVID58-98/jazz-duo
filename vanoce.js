/* =========================================================
   vanoce.js — vánoční výzdoba webů souborů (verze 1)
   Načítá ho jen malý skript v <head>, a to pouze od 1. 12. do 15. 1.
   (nebo při testu s ?vanoce=1). Mimo sezónu se soubor vůbec nestahuje.

   Obsahuje:
     04  jemné sněžení + vítr od prstu / kurzoru
     05  sníh si sedá na tlačítka a karty a po chvíli roztaje
     15  logo s čepicí a baňkami (lišta a patička; úvod řeší index.html)
     32  odeslaná poptávka vystřelí vločky, zlaté hvězdy a tečky loga
   + tlačítko pro návštěvníka „Sníh: zapnuto / vypnuto“ (pamatuje si volbu)
   Při „omezit pohyb“ v systému se nic nehýbe, zůstane jen vánoční logo.
   ========================================================= */
(function(){
'use strict';
var root=document.documentElement;
if(!root.classList.contains('xmas'))return;

var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var TAU=Math.PI*2;
var LANG=(root.lang||'cs').slice(0,2);
var LAB={cs:['Sníh: zapnuto','Sníh: vypnuto'],en:['Snow: on','Snow: off'],de:['Schnee: an','Schnee: aus']}[LANG]||['Sníh: zapnuto','Sníh: vypnuto'];
var HOST=location.hostname,ENSK=/quartet/.test(HOST)?'quartet':/trio/.test(HOST)?'trio':'duo';
var DOTS={duo:[[36,36,14.5],[64,64,14.5]],trio:[[50,30,13],[31,64,13],[69,64,13]],quartet:[[50,25,13],[25,50,13],[75,50,13],[50,75,13]]}[ENSK];
var BAUBLE=['#e0a93c','#c8323c','#7fb5a8','#e0a93c'];
var NS='http://www.w3.org/2000/svg';

/* ---------- styly ---------- */
var css=''+
'#xmSnow{position:fixed;left:0;top:0;width:100%;height:100vh;height:100lvh;pointer-events:none;z-index:55}'+
'.snowbtn{position:fixed;right:14px;bottom:14px;z-index:70;display:none;align-items:center;gap:8px;font:600 12.5px var(--font-body,Poppins,sans-serif);color:var(--petrol,#14302f);background:rgba(244,240,228,.95);border:1px solid rgba(15,82,87,.14);border-radius:100px;padding:10px 14px;cursor:pointer;box-shadow:0 10px 30px -18px rgba(15,82,87,.32);min-height:44px}'+
'body.xm-on .snowbtn{display:inline-flex}'+
'.snowbtn[aria-pressed="false"]{opacity:.7}'+
'@media (max-width:600px){.snowbtn{width:46px;height:46px;padding:0;justify-content:center;font-size:18px;right:12px;bottom:12px}.snowbtn .t{display:none}}'+
/* logo: tečky jako baňky, čepice na dlaždici */
'.brand-mark .xm-cap{fill:#d9c58a}'+
'.foot-row .brand-mark .xm-cap{fill:#14302f;opacity:.55}'+
'.brand-mark .xm-hat path{fill:#c8323c}.brand-mark .xm-hat .xm-fur{fill:#fff}'+
'.brand-mark .xm-cap{transform-box:view-box}'+
'.brand-mark.hop .xm-cap{animation:xmCapHop .62s cubic-bezier(.34,1.56,.64,1) both;animation-delay:var(--d)}'+
'@keyframes xmCapHop{0%{transform:none}30%{transform:translateY(calc(var(--h) * -.22px))}55%{transform:translateY(calc(var(--h) * .04px))}100%{transform:none}}';
var st=document.createElement('style');st.id='xm-css';st.textContent=css;document.head.appendChild(st);

/* ---------- 15 Logo s čepicí a baňkami ---------- */
function dressLogo(svg,id){
  if(svg.getAttribute('data-xm'))return;svg.setAttribute('data-xm','1');
  var defs=document.createElementNS(NS,'defs'),cs=svg.querySelectorAll('circle');
  for(var i=0;i<cs.length;i++){
    var c=cs[i],col=BAUBLE[i%BAUBLE.length],gid='xmB'+id+'_'+i;
    var g=document.createElementNS(NS,'radialGradient');g.setAttribute('id',gid);g.setAttribute('cx','.34');g.setAttribute('cy','.3');g.setAttribute('r','.75');
    g.innerHTML='<stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".28" stop-color="'+col+'"/><stop offset="1" stop-color="'+col+'"/>';
    defs.appendChild(g);c.style.fill='url(#'+gid+')';
    var cx=+c.getAttribute('cx'),cy=+c.getAttribute('cy'),r=+c.getAttribute('r'),w=r*.42,hh=r*.36;
    var cap=document.createElementNS(NS,'path');cap.setAttribute('class','xm-cap');
    cap.setAttribute('d','M'+(cx-w/2)+' '+(cy-r+1)+'v'+(-hh)+'h'+w+'v'+hh+'z');
    cap.style.setProperty('--d',c.style.getPropertyValue('--d')||'0s');cap.style.setProperty('--h',String(r*2));
    svg.appendChild(cap);
  }
  svg.insertBefore(defs,svg.firstChild);
  var hat=document.createElementNS(NS,'g');hat.setAttribute('class','xm-hat');
  hat.setAttribute('transform','translate(-12,-21) rotate(-14 30 22)');
  hat.innerHTML='<path d="M6 24C10 4 24-8 38-5 50-2 56 8 60 18 52 13 46 14 44 24Z"/><rect class="xm-fur" y="20" width="50" height="11" rx="5.5"/><circle class="xm-fur" cx="61" cy="19" r="6.5" style="fill:#fff"/>';
  svg.appendChild(hat);
}
function logos(){
  var ms=document.querySelectorAll('.topbar .brand-mark svg, .foot-row .brand-mark svg, .drawer .brand-mark svg');
  for(var i=0;i<ms.length;i++)dressLogo(ms[i],i);
}

/* ---------- tlačítko pro návštěvníka ---------- */
var on=true;try{on=localStorage.getItem('jt-snow')!=='off';}catch(e){}
var btn=null;
function makeBtn(){
  btn=document.createElement('button');btn.type='button';btn.className='snowbtn';
  btn.innerHTML='<span aria-hidden="true">&#10052;</span><span class="t"></span>';
  btn.addEventListener('click',function(){on=!on;try{localStorage.setItem('jt-snow',on?'on':'off');}catch(e){}label();if(on)reseed();wake();});
  document.body.appendChild(btn);document.body.classList.add('xm-on');label();
}
function label(){var t=on?LAB[0]:LAB[1];btn.setAttribute('aria-pressed',String(on));btn.setAttribute('aria-label',t);btn.querySelector('.t').textContent=t;}

/* ---------- plátno ---------- */
var cv,g,W=0,H=0,DPR=1,raf=0,last=0;
function size(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=Math.max(cv.getBoundingClientRect().height,innerHeight);cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);g.setTransform(DPR,0,0,DPR,0,0);}

/* ---------- 04 Sněžení stejně jemné jako na stránce Vánoční swing + vítr ---------- */
var F=[];
function flakeNew(f,top){f.x=Math.random()*W;f.y=top?-6:Math.random()*H;f.r=.8+Math.random()*2.6;f.v=.35+Math.random()*1.1;f.a=Math.random()*TAU;f.w=.008+Math.random()*.02;f.o=.35+Math.random()*.6;f.vx=0;f.vy=0;return f;}
function reseed(){F=[];var n=W<700?46:110;for(var i=0;i<n;i++)F.push(flakeNew({},false));}
var P={x:-999,y:-999,t:-99};
function ptr(x,y){P.x=x;P.y=y;P.t=performance.now();}
var WIND_R=90;

/* ---------- 05 Sníh na tlačítkách a kartách ---------- */
var SEL='.btn, .lineup-card, .sn-card, .ref-card, .tile-dark, .ticket';
var T=[],vis=new Set(),COL=6,MAXH=10;
function targets(){
  var els=document.querySelectorAll(SEL),io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)vis.add(e.target._xm);else vis.delete(e.target._xm);});}):null;
  for(var i=0;i<els.length;i++){var el=els[i];if(el.closest('#jzIntro,.drawer,.toast-overlay,.mk,.bio-modal,.jt-cookie-overlay,.rev-stage'))continue;
    var o={el:el,h:null,melt:false,ok:false,chk:0,clip:clipOf(el)};el._xm=o;T.push(o);if(io)io.observe(el);else vis.add(o);}
}
function clipOf(el){var p=el.parentElement;while(p&&p!==document.body){var s=getComputedStyle(p);if(s.overflowX!=='visible'||s.overflowY!=='visible')return p;p=p.parentElement;}return null;}
function radius(o,r){if(o.rad==null){var v=parseFloat(getComputedStyle(o.el).borderTopLeftRadius)||0;o.rad=v;}return Math.min(o.rad,r.height/2,r.width/2);}
function edgeY(o,dx){var r=o.r,w=o.w,e=dx<r?r-dx:dx>w-r?dx-(w-r):0;return r-Math.sqrt(Math.max(0,r*r-e*e));}
function visibleTop(o,r,now){
  if(now<o.chk)return o.ok;o.chk=now+400;
  var x=r.left+r.width/2,y=r.top+Math.min(4,r.height/2);
  if(x<0||x>W||y<0||y>innerHeight){o.ok=false;return false;}
  var hit=document.elementFromPoint(x,y);o.ok=!!hit&&(hit===o.el||o.el.contains(hit));
  if(o.ok){var s=getComputedStyle(o.el);o.ok=s.visibility!=='hidden'&&+s.opacity>.5;}
  return o.ok;
}
function prepare(now){
  vis.forEach(function(o){
    var r=o.el.getBoundingClientRect();o.vis=false;
    if(r.width<30||r.height<20)return;
    if(!visibleTop(o,r,now)){if(o.h)for(var i=0;i<o.h.length;i++)o.h[i]*=.9;return;}
    o.vis=true;o.x=r.left;o.y=r.top;o.w=r.width;o.r=radius(o,r);
    var n=Math.max(4,Math.round(o.w/COL));if(!o.h||o.h.length!==n)o.h=new Float32Array(n);
    if(o.clip){var c=o.clip.getBoundingClientRect();o.cl=c.left;o.cr=c.right;o.ct=c.top;}else{o.cl=-1e4;o.cr=1e4;o.ct=-1e4;}
  });
}
function catchFlake(f){
  var hitAny=false;
  vis.forEach(function(o){
    if(hitAny||!o.vis||o.melt)return;
    if(f.x<o.x+3||f.x>o.x+o.w-3||f.x<o.cl||f.x>o.cr)return;
    var n=o.h.length,i=Math.min(n-1,Math.floor((f.x-o.x)/o.w*n)),top=o.y+edgeY(o,f.x-o.x)-o.h[i];
    if(f.y>=top&&f.y<top+f.v*2+4){
      var k=f.r*.9;for(var j=-2;j<=2;j++){var q=i+j;if(q<0||q>=n)continue;o.h[q]=Math.min(MAXH,o.h[q]+k*(j===0?1:Math.abs(j)===1?.7:.35));}
      hitAny=true;
    }
  });
  return hitAny;
}
function drawCaps(dt){
  vis.forEach(function(o){
    if(!o.h)return;var n=o.h.length,sum=0;for(var i=0;i<n;i++)sum+=o.h[i];var avg=sum/n;
    if(!o.melt&&avg>5.2)o.melt=true;else if(o.melt&&avg<.3)o.melt=false;
    if(o.melt)for(var j=0;j<n;j++)o.h[j]*=1-Math.min(1,dt*.55);
    if(!o.vis||avg<.05)return;
    g.save();if(o.clip){g.beginPath();g.rect(o.cl,o.ct,o.cr-o.cl,1e4);g.clip();}
    g.beginPath();
    for(var k=0;k<=n;k++){var dx=k/n*o.w,hh=(o.h[Math.min(n-1,k)]+o.h[Math.max(0,k-1)])/2*Math.pow(Math.sin(Math.PI*k/n),.35),x=o.x+dx,y=o.y+edgeY(o,dx)-hh;if(k)g.lineTo(x,y);else g.moveTo(x,y);}
    for(var m=n;m>=0;m--){var dx2=m/n*o.w;g.lineTo(o.x+dx2,o.y+edgeY(o,dx2)+1.5);}
    g.closePath();g.fillStyle='#fff';g.shadowColor='rgba(120,160,170,.9)';g.shadowBlur=3;g.fill();
    g.restore();
  });
}

/* ---------- 32 Odeslaná poptávka ---------- */
var B=[];
function star4(x,y,r,col,a,rot){g.save();g.translate(x,y);g.rotate(rot);g.globalAlpha=Math.max(0,Math.min(1,a));g.fillStyle=col;g.beginPath();for(var i=0;i<8;i++){var q=i%2?r*.24:r,an=i*Math.PI/4;g.lineTo(Math.cos(an)*q,Math.sin(an)*q);}g.closePath();g.fill();g.restore();}
function dots(x,y,s,rot){var c=Math.cos(rot),sn=Math.sin(rot);g.beginPath();for(var i=0;i<DOTS.length;i++){var d=DOTS[i],dx=(d[0]-50)/50*s,dy=(d[1]-50)/50*s,px=x+dx*c-dy*sn,py=y+dx*sn+dy*c,r=Math.max(.8,d[2]/50*s);g.moveTo(px+r,py);g.arc(px,py,r,0,TAU);}g.fill();}
function burst(el){
  if(RM)return;var r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  for(var i=0;i<54;i++){var a=Math.random()*TAU,v=90+Math.random()*260;B.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-90,l:1,k:i%3,s:2+Math.random()*3.2,r:Math.random()*TAU});}
  wake();
}
function drawBurst(dt,t){
  for(var i=B.length-1;i>=0;i--){var p=B[i];p.l-=dt*.55;if(p.l<=0){B.splice(i,1);continue;}
    p.vy+=230*dt;p.vx*=.985;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.k===0){g.globalAlpha=p.l;g.fillStyle='#fff';g.shadowColor='rgba(120,160,170,.9)';g.shadowBlur=3;g.beginPath();g.arc(p.x,p.y,p.s*.8,0,TAU);g.fill();g.shadowBlur=0;}
    else if(p.k===1)star4(p.x,p.y,p.s*1.8,'#e0a93c',p.l,p.r+t*3);
    else{g.globalAlpha=p.l;g.fillStyle='#7fb5a8';dots(p.x,p.y,p.s*1.7,p.r+t*2);}
  }
  g.globalAlpha=1;
}
function watchSubmit(){
  var b=document.getElementById('submitBtn');if(!b||!('MutationObserver' in window))return;
  var was=false;new MutationObserver(function(){var s=b.classList.contains('sent');if(s&&!was)burst(b);was=s;}).observe(b,{attributes:true,attributeFilter:['class']});
}

/* ---------- smyčka ---------- */
function frame(ms){
  raf=0;var t=ms/1000,dt=Math.min(.05,Math.max(.001,t-(last||t)));last=t;
  var running=(on&&!RM)||B.length;
  if(document.hidden||!running){g.clearRect(0,0,W,H);last=0;return;}
  g.clearRect(0,0,W,H);
  if(on&&!RM){
    var now=performance.now();prepare(now);
    var wind=now-P.t<1400,k60=dt*60;
    g.fillStyle='#fff';g.shadowColor='rgba(120,160,170,.9)';g.shadowBlur=3;
    for(var i=0;i<F.length;i++){var f=F[i];
      if(wind){var dx=f.x-P.x,dy=f.y-P.y,d=Math.hypot(dx,dy);if(d<WIND_R&&d>.1){var p=(1-d/WIND_R)*14*k60;f.vx+=dx/d*p;f.vy+=dy/d*p;}}
      f.a+=f.w*k60;f.y+=(f.v+f.vy*.05)*k60;f.x+=(Math.sin(f.a)*.6+f.vx*.05)*k60;f.vx*=Math.pow(.93,k60);f.vy*=Math.pow(.9,k60);
      if(f.y>H+6||f.y<-30||f.x<-30||f.x>W+30){flakeNew(f,true);continue;}
      if(catchFlake(f)){flakeNew(f,true);continue;}
      g.globalAlpha=f.o;g.beginPath();g.arc(f.x,f.y,f.r,0,TAU);g.fill();
    }
    g.globalAlpha=1;g.shadowBlur=0;
    drawCaps(dt);
  }
  if(B.length)drawBurst(dt,t);
  g.shadowBlur=0;
  raf=requestAnimationFrame(frame);
}
function wake(){if(!raf&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}

/* ---------- start ---------- */
function start(){
  logos();
  if(RM)return;
  cv=document.createElement('canvas');cv.id='xmSnow';cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);g=cv.getContext('2d');
  size();reseed();makeBtn();targets();watchSubmit();
  addEventListener('pointermove',function(e){if(e.pointerType==='mouse'||e.pressure>0)ptr(e.clientX,e.clientY);},{passive:true});
  addEventListener('pointerdown',function(e){ptr(e.clientX,e.clientY);},{passive:true});
  addEventListener('touchmove',function(e){var q=e.touches&&e.touches[0];if(q)ptr(q.clientX,q.clientY);},{passive:true});
  var lw=innerWidth;addEventListener('resize',function(){size();if(innerWidth!==lw){lw=innerWidth;reseed();}T.forEach(function(o){o.rad=null;});});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)wake();});
  /* sníh se rozjede až po úvodní animaci */
  if(root.classList.contains('jz-lock'))document.addEventListener('jz-intro-done',wake,{once:true});else wake();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
