/* =========================================================
   motion.js — pohybové efekty a vylepšení webů souborů (verze 7)
   Načítá se s defer. Vše je nadstavba nad hotovým HTML:
   když skript chybí, web funguje a vypadá jako dřív.
   ========================================================= */
(function(){
'use strict';
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var NS='http://www.w3.org/2000/svg';
var LANG=(document.documentElement.lang||'cs').slice(0,2);
var TX={
  cs:{thanks:'Děkujeme!',next:'Další recenze',prev:'Předchozí recenze',songs:function(n){return n+(n>=5||n===0?' skladeb':n>1?' skladby':' skladba')},
      kTitle:'Termíny koncertů',kAll:'Všechny termíny',kLoad:'Načítám termíny…',kErr:'Termíny se teď nepodařilo načíst.',kNone:'Momentálně nejsou vypsané žádné veřejné termíny.',kOurs:'tato sestava',close:'Zavřít',kCount:function(n){return n+(n===1?' nadcházející termín':n>1&&n<5?' nadcházející termíny':' nadcházejících termínů')}},
  en:{thanks:'Thank you!',next:'Next review',prev:'Previous review',songs:function(n){return n+(n===1?' song':' songs')},
      kTitle:'Concert dates',kAll:'All dates',kLoad:'Loading dates…',kErr:'The dates could not be loaded right now.',kNone:'No public dates are listed at the moment.',kOurs:'this line-up',close:'Close',kCount:function(n){return n+(n===1?' upcoming date':' upcoming dates')}},
  de:{thanks:'Vielen Dank!',next:'Nächste Bewertung',prev:'Vorherige Bewertung',songs:function(n){return n+' Titel'},
      kTitle:'Konzerttermine',kAll:'Alle Termine',kLoad:'Termine werden geladen…',kErr:'Die Termine konnten gerade nicht geladen werden.',kNone:'Derzeit sind keine öffentlichen Termine eingetragen.',kOurs:'diese Besetzung',close:'Schließen',kCount:function(n){return n+(n===1?' anstehender Termin':' anstehende Termine')}}
}[LANG]||null;
if(!TX)TX={thanks:'Děkujeme!',next:'Další recenze',prev:'Předchozí recenze',songs:function(n){return n+' skladeb'},kTitle:'Termíny koncertů',kAll:'Všechny termíny',kLoad:'…',kErr:'Termíny se nepodařilo načíst.',kNone:'Žádné termíny.',kOurs:'tato sestava',close:'Zavřít',kCount:function(n){return n+''}};
/* počet teček loga podle sestavy */
var HOST=location.hostname,ENSK=/quintet/.test(HOST)?'quintet':/quartet/.test(HOST)?'quartet':/trio/.test(HOST)?'trio':'duo',DOTS={duo:2,trio:3,quartet:4,quintet:5}[ENSK];
var ENSNAME='Jazz '+ENSK.charAt(0).toUpperCase()+ENSK.slice(1);

function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function reflow(n){void n.offsetWidth}
function spring(t,k,w){k=k||6;w=w||13;return t>=1?1:1-Math.exp(-k*t)*Math.cos(w*t)}
function eInOut(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function bounce(t){var n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d)return n*(t-=1.5/d)*t+.75;if(t<2.5/d)return n*(t-=2.25/d)*t+.9375;return n*(t-=2.625/d)*t+.984375}
function frames(n,f){var a=[];for(var i=0;i<=n;i++){var fr=f(i/n);fr.offset=i/n;a.push(fr)}return a}
function A(node,kf,o){if(!node.animate)return null;var opt={fill:'none',easing:'linear'};for(var k in o)opt[k]=o[k];return node.animate(kf,opt)}
function onView(node,fn,th){if(!node)return;if(!('IntersectionObserver' in window)){fn();return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.disconnect();fn()}})},{threshold:th||.3});io.observe(node)}
function fontsReady(){return (document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve()}
function safe(name,fn){try{fn()}catch(e){if(window.console)console.warn('motion: '+name,e)}}
/* inicializace až po načtení, po kouscích ve volných chvílích prohlížeče (nezvyšuje TBT) */
var Q=[],started=false;function later(name,fn){Q.push([name,fn]);if(started&&Q.length===1)pump()}
var idle=window.requestIdleCallback?function(cb){requestIdleCallback(cb,{timeout:1200})}:function(cb){setTimeout(cb,40)};
function pump(){var it=Q[0];if(!it)return;idle(function(){Q.shift();safe(it[0],it[1]);pump()})}
function start(){if(started)return;started=true;pump()}
if(document.readyState==='complete')setTimeout(start,0);else window.addEventListener('load',function(){setTimeout(start,0)});
function inView(n){var r=n.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}

/* ---------- sdílený tekutý ukazatel ---------- */
var gooAdded=false;
function addGoo(){if(gooAdded)return;gooAdded=true;
  var d=document.createElement('div');d.className='mo-goo-defs';d.setAttribute('aria-hidden','true');
  d.innerHTML='<svg width="0" height="0"><filter id="mo-goo" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="5"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7"/></filter></svg>';
  document.body.appendChild(d)}
function liquid(host,getActive,geo){
  addGoo();
  var lq=document.createElement('div'),b1=document.createElement('span'),b2=document.createElement('span');
  lq.className='lq off';lq.setAttribute('aria-hidden','true');b1.className='b1';b2.className='b2';lq.appendChild(b2);lq.appendChild(b1);
  host.classList.add('lq-host');host.insertBefore(lq,host.firstChild);
  var first=true,raf=0;
  function place(){raf=0;var a=getActive();
    if(!a||!a.offsetParent){lq.classList.add('off');return}
    var g=geo?geo(a):[a.offsetLeft,a.offsetTop,a.offsetWidth,a.offsetHeight];
    if(first||lq.classList.contains('off')){b1.style.transition=b2.style.transition='none'}
    [b1,b2].forEach(function(s){s.style.transform='translate('+g[0]+'px,'+g[1]+'px)';s.style.width=g[2]+'px';s.style.height=g[3]+'px'});
    if(first||lq.classList.contains('off')){reflow(b1);b1.style.transition=b2.style.transition='';first=false}
    lq.classList.remove('off')}
  function sync(){if(!raf)raf=requestAnimationFrame(place)}
  new MutationObserver(sync).observe(host,{subtree:true,attributes:true,attributeFilter:['class','aria-selected']});
  window.addEventListener('resize',sync,{passive:true});fontsReady().then(sync);sync();
  return {sync:sync};
}

/* ================= 02 Nadpisy z masky (swing) ================= */
later('titles',function(){
  if(RM)return;
  $$('.section-title').forEach(function(h){
    if(inView(h))return;
    var i=0;
    (function walk(n){Array.prototype.slice.call(n.childNodes).forEach(function(c){
      if(c.nodeType===3){
        var parts=c.nodeValue.split(/([ \t\n\r]+)/);if(parts.length===1&&!parts[0])return;
        var frag=document.createDocumentFragment();
        parts.forEach(function(p){if(!p)return;
          if(/^[ \t\n\r]+$/.test(p)){frag.appendChild(document.createTextNode(' '));return}
          var o=document.createElement('span'),w=document.createElement('span');o.className='mw';w.textContent=p;
          w.style.setProperty('--d',(Math.floor(i/2)*.26+(i%2)*.17+.1).toFixed(2)+'s');i++;o.appendChild(w);frag.appendChild(o)});
        n.replaceChild(frag,c);
      }else if(c.nodeType===1&&c.tagName!=='BR'){walk(c)}
    })})(h);
    if(!i)return;
    h.classList.add('mo-title');
    var eb=h.previousElementSibling&&h.previousElementSibling.classList.contains('eyebrow')?h.previousElementSibling:null;
    if(eb)eb.classList.add('mo-eb');
    var lead=h.nextElementSibling&&(h.nextElementSibling.classList.contains('section-lead')||h.nextElementSibling.classList.contains('rep-hint'))?h.nextElementSibling:null;
    if(lead){lead.classList.add('mo-lead');lead.style.setProperty('--d',(Math.floor((i-1)/2)*.26+.55).toFixed(2)+'s')}
    onView(h,function(){h.classList.add('mo-in');if(eb)eb.classList.add('mo-in');if(lead)lead.classList.add('mo-in')},.5);
  });
});

/* ================= 23 Tekutý ukazatel v menu ================= */
later('nav',function(){
  var nav=$('.topnav');if(!nav)return;
  var links=$$(':scope > a[href^="#"]',nav).filter(function(a){return a.getAttribute('href').length>1&&!a.classList.contains('cta')});
  var secs=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
  var dLinks=$$('.drawer nav a[href^="#"]');
  liquid(nav,function(){return $(':scope > a.mo-active',nav)},function(a){return [a.offsetLeft-12,a.offsetTop-7,a.offsetWidth+24,a.offsetHeight+14]});
  var dnav=$('.drawer nav');
  if(dnav)liquid(dnav,function(){return $('a.mo-active',dnav)},function(a){return [a.offsetLeft-10,a.offsetTop+3,a.offsetWidth+20,a.offsetHeight-6]});
  var cur=null,tick=0,lock=0;
  function setActive(id){if(id===cur)return;cur=id;
    links.forEach(function(a){a.classList.toggle('mo-active',a.getAttribute('href')==='#'+id)});
    dLinks.forEach(function(a){a.classList.toggle('mo-active',a.getAttribute('href')==='#'+id)})}
  function spy(){tick=0;if(Date.now()<lock)return;var y=innerHeight*.35,id=null;
    secs.forEach(function(s){if(s&&s.getBoundingClientRect().top<=y)id=s.id});setActive(id)}
  window.addEventListener('scroll',function(){if(!tick){tick=1;requestAnimationFrame(spy)}},{passive:true});
  links.concat(dLinks).forEach(function(a){a.addEventListener('click',function(){var id=a.getAttribute('href').slice(1);if(document.getElementById(id)){setActive(id);lock=Date.now()+900}})});
  spy();
});

/* ================= 08 Logo, které žije ================= */
later('logo',function(){
  var marks=$$('.brand-mark');if(!marks.length||RM)return;
  function hop(m){m.classList.remove('hop');reflow(m);m.classList.add('hop')}
  marks.forEach(function(m){var p=m.parentNode;p.addEventListener('pointerdown',function(){hop(m)})});
  var top=$('.topbar .brand-mark');if(!top)return;
  function greet(){setTimeout(function(){hop(top)},350)}
  if(document.body.classList.contains('intro-done')||!document.documentElement.classList.contains('jz-lock'))greet();
  else document.addEventListener('jz-intro-done',greet,{once:true});
});

/* ================= 13 Tvary „Proč právě my“ ================= */
later('benefits',function(){
  var tiles=$$('#benefits .benefit');if(!tiles.length||RM)return;
  var grid=tiles[0].parentNode,busy=[];
  tiles.forEach(function(t){$$('.bshape [fill="none"]',t).forEach(function(s){s.setAttribute('pathLength','1');s.setAttribute('stroke-dasharray','1')})});
  function draw(){tiles.forEach(function(t,i){var d=i*160;
    $$('.bshape [fill="none"]',t).forEach(function(s){if(s.getAttribute('opacity')==='0')return;A(s,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:900,delay:d,easing:'cubic-bezier(.6,0,.3,1)',fill:'backwards'})});
    $$('.bshape :not([fill="none"]):not(g)',t).forEach(function(f,j){if(f.getAttribute('opacity')==='0')return;
      A(f,frames(30,function(x){return {transform:'scale('+spring(x,6,13)+')'}}),{duration:650,delay:d+520+j*60,fill:'backwards'})})})}
  onView(grid,draw,.3);
  /* v6: ikony podle obsahu – mikrofon, knoflík hlasitosti, gramofon */
  function q(sel,svg){return $(sel,svg)}
  function pivot(n,x,y){n.style.transformBox='view-box';n.style.transformOrigin=x+'px '+y+'px'}
  var knobLvl={};   // aktuální úhel ručičky podle dlaždice
  function knob(svg,i,down){var p=q('.ptr',svg);if(!p)return;pivot(p,26,28);
    var from=knobLvl[i]||0,to=down?-135:0;if(from===to)return;knobLvl[i]=to;
    if(p._a)p._a.cancel();p.style.transform='rotate('+to+'deg)';
    p._a=A(p,[{transform:'rotate('+from+'deg)'},{transform:'rotate('+to+'deg)'}],{duration:down?950:700,easing:down?'cubic-bezier(.45,0,.2,1)':'cubic-bezier(.3,1.25,.5,1)'});
    /* dílky stupnice zhasínají, jak hlasitost klesá (0 = minimum, 4 = půlka) */
    $$('.ticks circle',svg).forEach(function(c,k){if(k<1||k>4)return;var off=down,del=down?(4-k)*170:(k-1)*90;
      if(c._a)c._a.cancel();c.style.opacity=off?.28:1;c._a=A(c,[{opacity:off?1:.28},{opacity:off?.28:1}],{duration:260,delay:del,fill:'backwards'})})}
  function react(t,i){var svg=$('.bshape',t),ic=svg&&svg.getAttribute('data-ic');
    if(ic==='knob')return;                       // knoflík řeší najetí/odjetí zvlášť
    if(busy[i])return;busy[i]=1;setTimeout(function(){busy[i]=0},1000);
    var s=$('[fill="none"]',svg),f=$$(':not([fill="none"]):not(g)',svg);
    if(ic==='mic'){var cap=q('.cap',svg);pivot(cap,26,30);
      A(cap,[{transform:'rotate(0)'},{transform:'rotate(-9deg)',offset:.3},{transform:'rotate(7deg)',offset:.6},{transform:'rotate(0)'}],{duration:800,easing:'ease-in-out'});
      ['.sl','.sr'].forEach(function(c,k){A(q(c,svg),[{opacity:0,transform:'translateX(0)'},{opacity:1,offset:.3},{opacity:0,transform:'translateX('+(k?4:-4)+'px)'}],{duration:700,delay:150,iterations:2})});return}
    if(ic==='vinyl'){var disc=q('.disc',svg),arm=q('.arm',svg);pivot(disc,23,28);pivot(arm,45,8);
      A(arm,[{transform:'rotate(0)'},{transform:'rotate(-16deg)',offset:.22},{transform:'rotate(-16deg)',offset:.4},{transform:'rotate(0)',offset:.62},{transform:'rotate(0)'}],{duration:1500,easing:'ease-in-out'});
      A(disc,[{transform:'rotate(0)'},{transform:'rotate(0)',offset:.3},{transform:'rotate(540deg)'}],{duration:2000,easing:'cubic-bezier(.3,0,.2,1)'});return}
    if(i===0){var c=document.createElementNS(NS,'circle');c.setAttribute('cx',26);c.setAttribute('cy',26);c.setAttribute('r',22);c.setAttribute('fill','none');c.setAttribute('stroke','#7fb5a8');c.setAttribute('stroke-width','2');svg.insertBefore(c,svg.firstChild);
      var a=A(c,[{transform:'scale(1)',opacity:1},{transform:'scale(1.55)',opacity:0}],{duration:800,easing:'cubic-bezier(.2,.8,.2,1)'});if(a)a.onfinish=function(){c.remove()};
      A(f[0],[{transform:'scale(1)'},{transform:'scale(.6)',offset:.3},{transform:'scale(1.2)',offset:.65},{transform:'scale(1)'}],{duration:560})}
    if(i===1){A(s,[{transform:'rotate(0)'},{transform:'rotate(90deg)'}],{duration:700,easing:'cubic-bezier(.3,1.4,.5,1)'});A(f[0],[{transform:'rotate(0)'},{transform:'rotate(-90deg)'}],{duration:700,easing:'cubic-bezier(.3,1.4,.5,1)'})}
    if(i===2){f.forEach(function(d,j){A(d,frames(40,function(x){return {transform:'translateY('+(-7*(1-bounce(x)))+'px)'}}),{duration:700,delay:j*110})})}
    if(i===3&&f.length>1){var B=function(t,r){var P0=[8,32],P1=[26,2],P2=[44,32];if(r)t=1-t;return [(1-t)*(1-t)*P0[0]+2*(1-t)*t*P1[0]+t*t*P2[0],(1-t)*(1-t)*P0[1]+2*(1-t)*t*P1[1]+t*t*P2[1]]};
      A(f[0],frames(30,function(x){var e=eInOut(x),p=B(e,0);return {transform:'translate('+(p[0]-8)+'px,'+(p[1]+4-36-Math.sin(e*Math.PI)*6)+'px)'}}),{duration:820});
      A(f[1],frames(30,function(x){var e=eInOut(x),p=B(e,1);return {transform:'translate('+(p[0]-44)+'px,'+(p[1]+4-36+Math.sin(e*Math.PI)*8)+'px)'}}),{duration:820})}
  }
  tiles.forEach(function(t,i){if(i>3)return;var svg=$('.bshape',t),isKnob=svg&&svg.getAttribute('data-ic')==='knob',tt=0;
    t.addEventListener('pointerenter',function(e){if(e.pointerType!=='mouse')return;if(isKnob)knob(svg,i,true);else react(t,i)});
    t.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse'&&isKnob)knob(svg,i,false)});
    t.addEventListener('click',function(e){if(isKnob){if(e.pointerType==='mouse')return;clearTimeout(tt);knob(svg,i,true);tt=setTimeout(function(){knob(svg,i,false)},1600)}else react(t,i)})});
});

/* ================= 22 Repertoár jako jukebox ================= */
later('jukebox',function(){
  var jb=$('#jukebox');if(!jb)return;
  var rows=$$('.jb-row',jb),tabs=$$('.jb-tabs button',jb),list=$('.jb-list',jb),cnt=$('.jb-count',jb);
  var vinyl=$('.jb-vinyl',jb),arm=$('.jb-arm',jb),lab=$('.jb-label',jb),cat=tabs[0].dataset.cat,sel=null,t0=0;
  function setLabel(r){lab.dataset.g=r.dataset.cat;$('.g',lab).textContent=($('.jb-tabs button[data-cat="'+r.dataset.cat+'"]',jb)||tabs[0]).textContent.toUpperCase();
    $('strong',lab).textContent=$('.c strong',r).textContent;$('.a',lab).textContent=$('.c span',r).textContent}
  function spin(r){clearTimeout(t0);if(RM||!vinyl.animate){setLabel(r);return}
    A(vinyl,[{transform:'rotate(-8deg) scale(.95)'},{transform:'rotate(300deg) scale(1)',offset:.55},{transform:'rotate(352deg) scale(1)'}],{duration:1500,easing:'cubic-bezier(.14,.68,.3,1)'});
    A(arm,[{transform:'rotate(18deg)'},{transform:'rotate(-6deg)',offset:.2},{transform:'rotate(-6deg)',offset:.5},{transform:'rotate(21deg)',offset:.82},{transform:'rotate(18deg)'}],{duration:1500,easing:'cubic-bezier(.2,.8,.3,1)'});
    $$('.g,strong,.a',lab).forEach(function(n){A(n,[{opacity:1},{opacity:0,offset:.3},{opacity:0,offset:.45},{opacity:1}],{duration:1100})});
    t0=setTimeout(function(){setLabel(r)},420)}
  function pick(r,anim){if(!r||r===sel)return;if(sel)sel.setAttribute('aria-selected','false');sel=r;r.setAttribute('aria-selected','true');if(anim)spin(r);else setLabel(r)}
  function show(c,anim){cat=c;var vis=[];rows.forEach(function(r){var on=r.dataset.cat===c;r.hidden=!on;if(on)vis.push(r)});
    list.scrollTop=0;if(cnt)cnt.textContent=TX.songs(vis.length);
    tabs.forEach(function(b){b.setAttribute('aria-selected',b.dataset.cat===c?'true':'false');b.tabIndex=b.dataset.cat===c?0:-1});
    if(anim&&!RM)vis.slice(0,7).forEach(function(r,k){A(r,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:420,delay:k*45,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'})});
    return vis}
  rows.forEach(function(r){r.setAttribute('aria-selected','false')});
  pick(show(cat,false)[0],false);
  tabs.forEach(function(b){b.addEventListener('click',function(){if(b.dataset.cat===cat)return;var v=show(b.dataset.cat,true);sel&&sel.setAttribute('aria-selected','false');sel=null;pick(v[0],true)})});
  list.addEventListener('click',function(e){var r=e.target.closest('.jb-row');if(r)pick(r,true)});
  liquid($('.jb-tabs',jb),function(){return $('.jb-tabs button[aria-selected="true"]',jb)});
  onView(jb,function(){if(sel)spin(sel)},.45);
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){jb.classList.toggle('mo-vis',es[0].isIntersecting)}).observe(jb);else jb.classList.add('mo-vis');
});

/* ================= 15 Mapa: trasy z Prahy ================= */
later('map',function(){
  var svg=$('.cz-map');if(!svg||RM)return;
  var sp=$$('.spider',svg),cities=$$('.city',svg);if(!sp.length)return;
  svg.classList.add('mo');
  var g=document.createElementNS(NS,'g'),R=[],dom=0,fo=0,max=0;g.setAttribute('class','routes');
  sp.forEach(function(l){var fr=l.classList.contains('spider-foreign'),p=document.createElementNS(NS,'path');
    var x1=l.getAttribute('x1'),y1=l.getAttribute('y1'),x2=l.getAttribute('x2'),y2=l.getAttribute('y2');
    p.setAttribute('d','M'+x1+' '+y1+'L'+x2+' '+y2);p.setAttribute('pathLength','1');p.setAttribute('class','route'+(fr?' fr':''));
    var d=fr?1.45+(fo++)*.16:(dom++)*.12;p.style.setProperty('--d',d+'s');g.appendChild(p);max=Math.max(max,d+.7);
    var c=cities.filter(function(ci){var cc=$('circle',ci);return cc&&cc.getAttribute('cx')===x2&&cc.getAttribute('cy')===y2})[0];
    R.push([c,(d+.62)*1000])});
  $$('.route',g).forEach(function(p){p.style.setProperty('--e',(max+.9).toFixed(2)+'s')});
  var cg=$('.cities',svg);svg.insertBefore(g,cg||null);
  onView(svg,function(){svg.classList.add('play');R.forEach(function(r){if(r[0])setTimeout(function(){r[0].classList.add('lit')},r[1])});
    setTimeout(function(){svg.classList.add('done');cities.forEach(function(c){c.classList.add('lit')})},(max+1)*1000)},.35);
});

/* ================= 16 Poptávka: ukazatel + odeslání ================= */
later('form',function(){
  var seg=$('#segType'),blk=$('#blkChoice');
  if(seg){seg.classList.add('lq-on');liquid(seg,function(){return $('.opt.sel',seg)})}
  if(blk){blk.classList.add('lq-on');liquid(blk,function(){return $('.blk.sel',blk)})}
  var btn=$('#submitBtn');if(!btn)return;
  var label=btn.textContent.trim(),dots='';for(var i=0;i<DOTS;i++)dots+='<i style="--i:'+i+'"></i>';
  btn.innerHTML='<span class="mo-lb">'+label+'</span><span class="mo-dots" aria-hidden="true">'+dots+'</span><svg class="mo-chk" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M5 12.5 10 17 19 7"/></svg>';
  btn.classList.add('mo-btn');
  var lb=$('.mo-lb',btn),state='',tm=[];
  function clear(){tm.forEach(clearTimeout);tm=[]}
  function widthTo(fn){var w=btn.offsetWidth;btn.style.transition='none';fn();btn.style.width='';var full=btn.offsetWidth;btn.style.width=w+'px';reflow(btn);btn.style.transition='';reflow(btn);btn.style.width=full+'px'}
  function reset(){clear();state='';btn.classList.remove('sending','sent','thanks');btn.style.width='';lb.textContent=label}
  window.jtSend=function(s,cb){
    if(s==='sending'){clear();state='sending';var w=btn.offsetWidth;btn.style.width=w+'px';reflow(btn);btn.classList.add('sending');btn.style.width=Math.max(56,DOTS*12+32)+'px'}
    else if(s==='ok'){state='ok';btn.classList.add('sent');btn.style.width='56px';
      tm.push(setTimeout(function(){if(cb)cb()},RM?0:700));
      tm.push(setTimeout(function(){btn.classList.remove('sending','sent');widthTo(function(){lb.textContent=TX.thanks;btn.classList.add('thanks')})},RM?0:900));
      tm.push(setTimeout(reset,4200))}
    else if(s==='done'){if(state!=='ok')reset()}
  };
});

/* ================= 17 Balíček recenzí ================= */
later('reviews',function(){
  var st=$('#revStack');if(!st)return;
  var cards=$$('.review',st);if(!cards.length)return;
  cards.forEach(function(c){var s=$('.stars',c);if(s){var h='';for(var i=0;i<5;i++)h+='<span aria-hidden="true">★</span>';s.innerHTML=h}
    var p=$('p',c);if(p&&!RM){var txt=p.textContent;p.textContent='';txt.split(/(\s+)/).forEach(function(w){var sp=document.createElement('span');sp.textContent=w;p.appendChild(sp)})}});
  var order=cards.slice();
  function measure(){var m=0;cards.forEach(function(c){c.style.height='';m=Math.max(m,c.offsetHeight)});cards.forEach(function(c){c.style.height=m+'px'});st.style.height=(m+26)+'px'}
  function layout(){order.forEach(function(c,i){c.style.zIndex=10-i;c.style.transform=i?'translateY('+(i*12)+'px) scale('+(1-i*.05)+')':'none';c.style.opacity=i>2?0:1;c.setAttribute('aria-hidden',i?'true':'false')})}
  function show(c){var ss=$$('.stars span',c),ws=$$('p span',c);
    ss.forEach(function(s,i){s.classList.remove('on');setTimeout(function(){s.classList.add('on');if(!RM)A(s,frames(24,function(t){return {transform:'scale('+(1+.6*(1-spring(t,6,14)))+') rotate('+((1-spring(t,6,14))*-30)+'deg)'}}),{duration:500})},RM?0:150+i*110)});
    if(!RM)ws.forEach(function(w,i){A(w,[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:380,delay:300+i*14,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'})})}
  measure();layout();fontsReady().then(measure);
  var rz=0;window.addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(measure,150)},{passive:true});
  cards.forEach(function(c){$$('.stars span',c).forEach(function(s){s.classList.add('on')})});
  onView(st,function(){show(order[0])},.4);
  function next(dir){var top=order[0];if(top._out)return;top._out=1;dir=dir||1;
    top.style.transition='transform .45s cubic-bezier(.4,0,.6,1),opacity .45s';top.style.transform='translateX('+(dir*120)+'%) rotate('+(dir*14)+'deg)';top.style.opacity=0;
    setTimeout(function(){order.push(order.shift());top.style.transition='none';layout();requestAnimationFrame(function(){requestAnimationFrame(function(){top.style.transition='';top._out=0})});show(order[0])},RM?0:380)}
  function prev(){var top=order[0];if(top._out)return;var last=order.pop();order.unshift(last);last._out=1;
    last.style.transition='none';last.style.zIndex=11;last.style.opacity=0;last.style.transform='translateX(-120%) rotate(-14deg)';reflow(last);
    last.style.transition='transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s';layout();show(last);
    setTimeout(function(){last.style.transition='';last._out=0},RM?0:470)}
  var nb=$('#revNextBtn'),pb=$('#revPrevBtn');
  if(nb)nb.addEventListener('click',function(){next(1)});
  if(pb)pb.addEventListener('click',prev);
  st.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();next(1)}else if(e.key==='ArrowLeft'){e.preventDefault();prev()}});
  var sx=0,sy=0,dx=0,drag=false,horiz=false;
  st.addEventListener('pointerdown',function(e){if(e.button)return;drag=true;horiz=false;sx=e.clientX;sy=e.clientY;dx=0});
  st.addEventListener('pointermove',function(e){if(!drag)return;dx=e.clientX-sx;var dy=e.clientY-sy;
    if(!horiz){if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){horiz=true;order[0].style.transition='none';try{st.setPointerCapture(e.pointerId)}catch(_){}}else if(Math.abs(dy)>10){drag=false;return}else return}
    order[0].style.transform='translateX('+dx+'px) rotate('+(dx/20)+'deg)'});
  function up(){if(!drag)return;drag=false;if(!horiz)return;order[0].style.transition='';if(dx>90)next(1);else if(dx<-90)next(-1);else order[0].style.transform='none'}
  st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
});

/* ================= 20 Časté dotazy ================= */
later('faq',function(){
  var items=$$('#faq details.faq-item');if(!items.length)return;
  items.forEach(function(d){d.removeAttribute('name');
    var a=$('.faq-a',d);if(!a)return;var w=document.createElement('div');w.className='mo-ans';a.parentNode.insertBefore(w,a);w.appendChild(a);d._w=w});
  function close(d){var w=d._w,h=w.offsetHeight;d.classList.add('mo-closing');
    var an=A(w,[{height:h+'px'},{height:'0px'}],{duration:RM?1:300,easing:'cubic-bezier(.4,0,.2,1)'});
    var end=function(){d.open=false;d.classList.remove('mo-closing')};if(an)an.onfinish=end;else end()}
  function open(d){d.open=true;var w=d._w,h=w.offsetHeight;
    A(w,[{height:'0px'},{height:h+'px'}],{duration:RM?1:380,easing:'cubic-bezier(.2,.8,.2,1)'});
    A($('.faq-a',d),[{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'none'}],{duration:RM?1:380,delay:RM?0:90,easing:'ease-out',fill:'backwards'})}
  items.forEach(function(d){var s=$('summary',d);if(!s||!d._w)return;
    s.addEventListener('click',function(e){e.preventDefault();if(d.classList.contains('mo-closing'))return;
      if(d.open)close(d);else{items.forEach(function(o){if(o!==d&&o.open&&!o.classList.contains('mo-closing'))close(o)});open(d)}})});
  /* „Zobrazit další dotazy“: plynulé rozbalení místo skoku (původní obsluhu nahrazuje) */
  var tb=$('#faqToggle'),more=$('#faqMore');if(!tb||!more)return;var busy=false;
  tb.addEventListener('click',function(e){e.stopImmediatePropagation();if(busy)return;
    var show=more.hidden;tb.setAttribute('aria-expanded',show?'true':'false');tb.textContent=show?tb.getAttribute('data-less'):tb.getAttribute('data-more');
    if(RM||!more.animate){more.hidden=!show;if(!show)$$('details',more).forEach(function(o){o.open=false});return}
    busy=true;more.style.overflow='hidden';
    if(show){more.hidden=false;var h=more.offsetHeight;
      A(more,[{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=function(){more.style.overflow='';busy=false};
      $$('details',more).forEach(function(o,k){A(o,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:380,delay:80+k*70,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'})})}
    else{var h2=more.offsetHeight;
      A(more,[{height:h2+'px',opacity:1},{height:'0px',opacity:0}],{duration:320,easing:'cubic-bezier(.4,0,.2,1)'}).onfinish=function(){more.hidden=true;more.style.overflow='';$$('details',more).forEach(function(o){o.open=false});busy=false}}
  },true);
});

/* ================= Zámek stránky pod menu a okny (mobil) ================= */
safe('lock',function(){
  var html=document.documentElement,drawer=$('#drawer');
  var SCROLLERS='.drawer,.bio-panel,.mk-body,.toast-card';
  function anyOpen(){return (drawer&&drawer.classList.contains('open'))||!!$('.bio-modal.open')||!!$('.mk.open')||!!$('.toast-overlay.show')}
  function sync(){html.classList.toggle('mo-lock',anyOpen())}
  var mo=new MutationObserver(sync);
  function watch(n){if(n)mo.observe(n,{attributes:true,attributeFilter:['class']})}
  watch(drawer);watch($('#formToast'));
  new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1&&(n.classList.contains('bio-modal')||n.classList.contains('mk')))watch(n)})})}).observe(document.body,{childList:true});
  $$('.bio-modal').forEach(watch);
  var sy=0;
  document.addEventListener('touchstart',function(e){sy=e.touches[0].clientY},{passive:true});
  document.addEventListener('touchmove',function(e){if(!html.classList.contains('mo-lock'))return;
    var sc=e.target.closest&&e.target.closest(SCROLLERS);
    if(!sc){e.preventDefault();return}
    var dy=e.touches[0].clientY-sy,top=sc.scrollTop<=0,bot=sc.scrollTop+sc.clientHeight>=sc.scrollHeight-1;
    if(sc.scrollHeight<=sc.clientHeight||(dy>0&&top)||(dy<0&&bot))e.preventDefault()},{passive:false});
});

/* ================= Vlny za bloby videoukázek (v3, podle hero bigband-kv) =================
   Jemné kruhové „spektrum“ kolem každého blobu: swingové frázování, měkký nástup a dozvuk.
   Kreslí se jen u blobů, které jsou opravdu vidět (ve slideru 3 na PC, 1 na mobilu),
   na mobilu 30 snímků/s, při skryté záložce, otevřeném videu a „omezení pohybu“ stojí. */
later('vidwaves',function(){
  var track=$('#vidTrack');if(!track)return;
  var probe=document.createElement('canvas');if(!probe.getContext||!probe.getContext('2d'))return;
  var TAU=Math.PI*2,N=120,mqMob=matchMedia('(max-width:860px)'),fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  var COS=new Float32Array(N),SIN=new Float32Array(N);
  for(var i=0;i<N;i++){var an=i/N*TAU-Math.PI/2;COS[i]=Math.cos(an);SIN[i]=Math.sin(an)}
  function fract(n){return n-Math.floor(n)}
  function hash(n){return fract(Math.sin(n*127.1+311.7)*43758.5453)}
  function ringD(a,b){var n=Math.abs(a-b)%1;return Math.min(n,1-n)}
  function bell(x,w){return Math.exp(-x*x/(2*w*w))}
  function env(age,dec){return age<0?0:(1-Math.exp(-age*34))*Math.exp(-age*dec)}
  /* dekorativní pohyb, ne analýza zvuku: swingový offbeat, krátké fráze, nezávislé doznění */
  function notes(t,seed){var period=60/(84+seed%5*2),beat=Math.floor(t/period),ev=[];
    for(var k=0;k<4;k++){var b=beat-k,ph=Math.floor(b/8),age=t-b*period,g=.56+.25*hash(ph+70+seed*13);
      ev.push({at:hash(b+11+seed*7),w:.018+hash(b+41)*.024,v:env(age,3.8)*g*(b%4===0?1.12:.86)});
      ev.push({at:fract(hash(b+11+seed*7)+.43),w:.022+hash(b+53)*.018,v:env(age-.08,4.7)*g*.65});
      ev.push({at:hash(b+101+seed*3),w:.014+hash(b+71)*.018,v:env(age-period*2/3,5.6)*g*.66})}
    return ev}
  var items=[],active=[],frame=0,last=0,time=0,modal=$('#vidModal');
  $$('.vid-blob',track).forEach(function(blob){
    var old=$('.vid-eq',blob),seed=parseInt(old&&old.getAttribute('data-i'),10)||0;
    var cv=document.createElement('canvas');cv.className='vid-wave';cv.setAttribute('aria-hidden','true');
    if(old)blob.replaceChild(cv,old);else blob.insertBefore(cv,blob.firstChild);
    var it={blob:blob,cv:cv,ctx:cv.getContext('2d'),seed:seed,lv:new Float32Array(N),pk:new Float32Array(N),jit:new Float32Array(N),S:0,B:0,on:false,hov:0,hovT:0};
    for(var j=0;j<N;j++)it.jit[j]=.72+hash(j+3+seed*17)*.48;
    if(fine){blob.addEventListener('pointerenter',function(){it.hovT=1});blob.addEventListener('pointerleave',function(){it.hovT=0})}
    items.push(it)});
  if(!items.length)return;
  var css=getComputedStyle(document.documentElement);
  function rgb(v,f){var h=(css.getPropertyValue(v)||'').trim().replace('#','');if(h.length!==6)return f;return parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16)}
  var CBAR=rgb('--emerald-2','21,122,127');
  /* vlny vyrůstají přímo zpoza blobu: pro každý paprsek se zjistí, kde má blob okraj (viewBox 210) */
  function outline(it,fallback){var ro=new Float32Array(N),ph=$('.vid-photo',it.blob),pa=ph&&$('clipPath path',ph),i;
    for(i=0;i<N;i++)ro[i]=0;
    if(pa){try{var sc=ph.getBoundingClientRect().width/210,tl=pa.getTotalLength();
      for(var k=0;k<360;k++){var q=pa.getPointAtLength(tl*k/360),th=Math.atan2(q.y,q.x),ix=Math.round(((th+Math.PI/2)/TAU*N)%N+N)%N,r=Math.hypot(q.x,q.y)*sc;if(r>ro[ix])ro[ix]=r}}catch(e){}}
    var any=false;for(i=0;i<N;i++)if(ro[i])any=true;
    if(!any){for(i=0;i<N;i++)ro[i]=fallback;return ro}
    for(i=0;i<N;i++)if(!ro[i]){var l=i,r2=i;while(!ro[(l+N)%N])l--;while(!ro[r2%N])r2++;var f=(i-l)/(r2-l);ro[i]=ro[(l+N)%N]*(1-f)+ro[r2%N]*f}
    var sm=new Float32Array(N);for(i=0;i<N;i++)sm[i]=(ro[(i+N-1)%N]+2*ro[i]+ro[(i+1)%N])/4;return sm}
  function size(it){var B=it.blob.getBoundingClientRect().width;if(!B)return;var mob=mqMob.matches,E=mob?Math.round(Math.min(40,B*.2)):0,S=B+2*E,dpr=Math.min(window.devicePixelRatio||1,2);
    it.ro=outline(it,B*(mob?.47:.4));
    it.B=B;it.S=S;it.mob=mob;it.cv.style.width=it.cv.style.height=S+'px';it.cv.style.marginLeft=it.cv.style.marginTop=(-S/2)+'px';
    it.cv.width=Math.round(S*dpr);it.cv.height=Math.round(S*dpr);it.ctx.setTransform(dpr,0,0,dpr,0,0);paint(it,time,.016,RM)}
  function paint(it,t,dt,still){var S=it.S,B=it.B,c=S/2,g=it.ctx,ro=it.ro;if(!S||!ro)return;
    g.clearRect(0,0,S,S);
    var ev=notes(still?3.42:t+3.42+it.seed*1.7,it.seed),edge=c-3,grow=1+it.hov*.12;
    it.hov+=(it.hovT-it.hov)*(1-Math.exp(-Math.max(dt,.016)*3.5));
    g.lineCap='round';g.lineWidth=Math.max(1.4,B*.0095);
    for(var i=0;i<N;i++){var x=i/N,ax=x*TAU;
      var tg=.05+.02*(1+Math.sin(ax*5+t*.44+it.seed))+.016*(1+Math.sin(ax*11-t*.31));
      for(var e=0;e<ev.length;e++)tg+=ev[e].v*bell(ringD(x,ev[e].at),ev[e].w);
      tg=Math.min(1,tg*it.jit[i]*1.65);if(still)tg*=.62;
      var sp=tg>it.lv[i]?19:5.5;it.lv[i]=still?tg:it.lv[i]+(tg-it.lv[i])*(1-Math.exp(-dt*sp));
      var v=it.lv[i];it.pk[i]=still?v:Math.max(v,it.pk[i]-dt*.34);
      var r0=ro[i]-4,room=Math.max(6,edge-ro[i]),r1=Math.min(edge,ro[i]+3+room*.9*v*grow);
      g.strokeStyle='rgba('+CBAR+','+(.5+v*.5).toFixed(3)+')';
      g.beginPath();g.moveTo(c+COS[i]*r0,c+SIN[i]*r0);g.lineTo(c+COS[i]*r1,c+SIN[i]*r1);g.stroke();
    }}
  function running(){return !RM&&!document.hidden&&active.length&&!(modal&&modal.classList.contains('show'))}
  function loop(now){frame=0;if(!running()){last=0;return}
    var iv=mqMob.matches?1000/30:1000/60;if(!last)last=now-iv;
    if(now-last>=iv-.6){var dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;for(var k=0;k<active.length;k++)paint(active[k],time,dt,false)}
    frame=requestAnimationFrame(loop)}
  function sync(){if(running()){if(!frame){last=0;frame=requestAnimationFrame(loop)}}else if(frame){cancelAnimationFrame(frame);frame=0;last=0}}
  items.forEach(size);
  if(window.MutationObserver){var mt=new MutationObserver(function(){resize()});items.forEach(function(it){var ph=$('.vid-photo',it.blob);if(ph)mt.observe(ph,{childList:true})})}
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){var it=null;for(var k=0;k<items.length;k++)if(items[k].cv===e.target)it=items[k];if(!it)return;
      it.on=e.isIntersecting;var ix=active.indexOf(it);if(it.on&&ix<0)active.push(it);else if(!it.on&&ix>=0)active.splice(ix,1)});sync()},{threshold:0});
    items.forEach(function(it){io.observe(it.cv)})}
  else{active=items.slice();sync()}
  var rt=0;function resize(){clearTimeout(rt);rt=setTimeout(function(){items.forEach(size);sync()},120)}
  window.addEventListener('resize',resize,{passive:true});if(mqMob.addEventListener)mqMob.addEventListener('change',resize);
  document.addEventListener('visibilitychange',sync);
  if(modal)new MutationObserver(sync).observe(modal,{attributes:true,attributeFilter:['class']});
  track.classList.add('mo-waves');
});

/* ================= Šipka nahoru se drží nad patičkou (v5) ================= */
later('totop',function(){
  var btn=$('.back-to-top'),foot=$('footer');if(!btn||!foot)return;
  var on=false,raf=0,root=document.documentElement;
  function upd(){raf=0;var r=foot.getBoundingClientRect(),h=Math.max(0,innerHeight-r.top);root.style.setProperty('--mo-foot',Math.round(h)+'px')}
  function tick(){if(!raf)raf=requestAnimationFrame(upd)}
  new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on){addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick,{passive:true})}else{removeEventListener('scroll',tick);removeEventListener('resize',tick)}tick()}).observe(foot);
});

/* ================= Vstupenka v sekci Naživo: útržek se odtrhne (v5) ================= */
later('ticket',function(){
  var tk=$('#koncerty .ticket'),stub=tk&&$('.ticket-stub',tk);if(!tk||!stub)return;
  var btn=$('#koncerty a.btn'),torn=false;
  function tear(){if(torn)return;torn=true;tk.classList.add('torn');
    if(!RM)A(stub,[{transform:'none'},{transform:'rotate(-1.5deg)',offset:.18},{transform:'rotate(1.2deg)',offset:.34},{transform:'translate(2px,1px) rotate(-.6deg)',offset:.48},{transform:'translate(18px,10px) rotate(9deg)'}],{duration:900,easing:'cubic-bezier(.3,.7,.3,1)'})}
  function mend(){if(!torn)return;torn=false;tk.classList.remove('torn');if(!RM)A(stub,[{transform:'translate(18px,10px) rotate(9deg)'},{transform:'none'}],{duration:450,easing:'cubic-bezier(.3,1.3,.5,1)'})}
  onView(tk,function(){setTimeout(tear,450)},.6);
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){tk.addEventListener('pointerenter',mend);tk.addEventListener('pointerleave',function(){setTimeout(tear,120)})}
  tk.style.cursor='pointer';tk.addEventListener('click',function(){if(btn)btn.click()});
});

/* ================= Termíny koncertů ve vyskakovacím okně ================= */
later('concerts',function(){
  var a=$('#koncerty a.btn[href*="davidklenha.cz"]');if(!a||!window.fetch)return;
  var mk=document.createElement('div');mk.className='mk';mk.setAttribute('role','dialog');mk.setAttribute('aria-modal','true');mk.setAttribute('aria-labelledby','mkTitle');
  mk.innerHTML='<div class="mk-panel"><div class="mk-head"><div><h3 id="mkTitle">'+TX.kTitle+'</h3><span class="mk-sub"></span></div>'+
    '<button type="button" class="mk-x" aria-label="'+TX.close+'"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div>'+
    '<div class="mk-body"><div class="mk-list" aria-live="polite"></div></div>'+
    '<div class="mk-foot"><a class="mk-all" href="'+a.href+'" target="_blank" rel="noopener">'+TX.kAll+'</a></div></div>';
  document.body.appendChild(mk);
  var list=$('.mk-list',mk),sub=$('.mk-sub',mk),body=$('.mk-body',mk),loaded=false,last=null;
  var fd=new Intl.DateTimeFormat(LANG,{day:'numeric'}),fm=new Intl.DateTimeFormat(LANG,{month:'short'}),fw=new Intl.DateTimeFormat(LANG,{weekday:'short'}),fmy=new Intl.DateTimeFormat(LANG,{month:'long',year:'numeric'});
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function render(d){var today=new Date();today.setHours(0,0,0,0);
    var up=(d||[]).filter(function(x){var t=new Date(x.date+'T00:00:00');return !isNaN(t)&&t>=today}).sort(function(p,q){return (p.date+p.time).localeCompare(q.date+q.time)});
    if(!up.length){sub.textContent='';list.innerHTML='<p class="mk-msg">'+TX.kNone+'</p>';return}
    up=up.slice(0,30);sub.textContent=TX.kCount(up.length);
    var mon='';
    list.innerHTML=up.map(function(x){var t=new Date(x.date+'T12:00:00'),m=x.date.slice(0,7),h='';
      if(m!==mon){mon=m;h='<div class="mk-m">'+esc(fmy.format(t))+'</div>'}
      return h+'<div class="mk-row"><div class="mk-d" aria-label="'+esc(t.toLocaleDateString(LANG))+'"><b>'+esc(fd.format(t))+'</b><span>'+esc(fw.format(t))+'</span></div>'+
        '<div class="mk-t"><strong>'+esc(x.title)+'</strong><span>'+esc([x.time,x.place].filter(Boolean).join(' · '))+'</span>'+(x.band?'<em>'+esc(x.band)+'</em>':'')+'</div></div>'}).join('');
    if(!RM)$$('.mk-row',list).slice(0,8).forEach(function(r,k){A(r,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:380,delay:80+k*45,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'})})}
  function load(){if(loaded)return;loaded=true;list.innerHTML='<p class="mk-msg">'+TX.kLoad+'</p>';
    fetch('/koncerty.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){render(j&&j.items?j.items:j)},function(){loaded=false;list.innerHTML='<p class="mk-msg">'+TX.kErr+'</p>'})}
  function open(){last=document.activeElement;body.scrollTop=0;mk.classList.add('open');load();setTimeout(function(){$('.mk-x',mk).focus({preventScroll:true})},30)}
  function close(){mk.classList.remove('open');if(last&&last.focus)last.focus({preventScroll:true})}
  a.addEventListener('click',function(e){if(e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();open()});
  $('.mk-x',mk).addEventListener('click',close);
  mk.addEventListener('click',function(e){if(e.target===mk)close()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&mk.classList.contains('open'))close()});
});

/* ================= 03 Přechody: nadpis jen když je vidět ================= */
safe('vt',function(){
  window.addEventListener('pageswap',function(){var h=$('.hero-slogans');if(!h)return;var r=h.getBoundingClientRect();
    if(r.bottom<0||r.top>innerHeight)h.style.viewTransitionName='none'});
});
})();
