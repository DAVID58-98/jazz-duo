#!/usr/bin/env python3
"""
Vygeneruje sekce „Co nám píší klienti“, „Pro koho jsme hráli“ a „Videoukázky“
z recenze.json, reference.json a videa.json do index.html, en/index.html a de/index.html
(mezi značky <!-- RECENZE:START/END -->, <!-- REFERENCE:START/END --> a <!-- VIDEA:START/END -->).
Spouští ho GitHub Actions po každé změně JSON souborů.
"""
import json, re, sys, html, datetime, pathlib, urllib.request, urllib.error

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
SITE = (ROOT / 'CNAME').read_text(encoding='utf-8').strip()
ENS = {'jazzduo.cz': 'duo', 'jazztrio.cz': 'trio', 'jazzquartet.cz': 'quartet', 'jazzcombo.cz': 'combo'}[SITE]
LABEL = {
    'duo': {'cs': 'jazzové duo', 'en': 'jazz duo', 'de': 'Jazz-Duo'},
    'trio': {'cs': 'jazzové trio', 'en': 'jazz trio', 'de': 'Jazz-Trio'},
    'quartet': {'cs': 'jazzový kvartet', 'en': 'jazz quartet', 'de': 'Jazz-Quartett'},
    'combo': {'cs': 'Jazz Combo', 'en': 'Jazz Combo', 'de': 'Jazz Combo'},
}[ENS]
PAGES = {'cs': 'index.html', 'en': 'en/index.html', 'de': 'de/index.html'}
STARS_LABEL = {'cs': 'Hodnocení {n} z 5 hvězdiček', 'en': '{n}/5', 'de': '{n}/5'}
PLAY_LABEL = {'cs': 'Přehrát video', 'en': 'Play video', 'de': 'Video abspielen'}
MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
CHYBY = []


def chyba(msg):
    CHYBY.append(msg)


def esc(s):
    return html.escape(s, quote=False)


def prelozit(pole, jazyk, kde):
    """pole může být text, nebo {"cs": …, "en": …, "de": …}; chybí-li překlad, použije se čeština."""
    if isinstance(pole, str):
        return pole, 'cs'
    if not isinstance(pole, dict) or not pole.get('cs'):
        chyba(f'{kde}: chybí český text („cs“)')
        return '', 'cs'
    if pole.get(jazyk):
        return pole[jazyk], jazyk
    return pole['cs'], 'cs'


def datum(iso, jazyk, kde):
    try:
        d = datetime.date.fromisoformat(iso)
    except Exception:
        chyba(f'{kde}: datum „{iso}“ musí být ve tvaru RRRR-MM-DD, např. 2026-10-22')
        return ''
    if jazyk == 'cs':
        return f'{d.day}. {d.month}. {d.year}'
    if jazyk == 'en':
        return f'{d.day} {MONTH_EN[d.month - 1]} {d.year}'
    return d.strftime('%d.%m.%Y')


def nacti(nazev, klic):
    p = ROOT / nazev
    try:
        data = json.loads(p.read_text(encoding='utf-8'))
    except json.JSONDecodeError as e:
        sys.exit(f'CHYBA v {nazev}, řádek {e.lineno}, sloupec {e.colno}: {e.msg}. '
                 'Nejčastěji chybí čárka mezi položkami nebo uvozovka.')
    if not isinstance(data.get(klic), list):
        sys.exit(f'CHYBA v {nazev}: chybí seznam "{klic}": [ … ]')
    return data[klic]


def recenze_html(seznam, jazyk):
    vystup = []
    serazene = sorted(enumerate(seznam), key=lambda x: (x[1].get('datum', ''), -x[0]), reverse=True)
    for i, r in serazene:
        kde = f'recenze.json, položka {i + 1} ({r.get("jmeno", "?")})'
        if not r.get('jmeno'):
            chyba(f'{kde}: chybí „jmeno“')
        text, tj = prelozit(r.get('text'), jazyk, kde)
        akce, aj = prelozit(r.get('akce', ''), jazyk, kde) if r.get('akce') else ('', jazyk)
        if aj != jazyk:
            akce = ''  # bez překladu typu akce ukážeme na EN/DE jen název sestavy
        kdy = datum(r.get('datum', ''), jazyk, kde)
        n = r.get('hvezdy')
        hv = ''
        if n:
            if n not in (1, 2, 3, 4, 5):
                chyba(f'{kde}: „hvezdy“ musí být číslo 1 až 5, nebo položku vynechte')
            else:
                hv = f'<div class="stars" role="img" aria-label="{STARS_LABEL[jazyk].format(n=n)}">{"★" * n}</div>'
        lang_attr = f' lang="{tj}"' if tj != jazyk else ''
        popis = ' · '.join(x for x in [esc(akce), LABEL[jazyk]] if x)
        vystup.append(
            f'<figure class="review">{hv}<p{lang_attr}>{esc(text)}</p>'
            f'<figcaption class="who"><b>{esc(r.get("jmeno", ""))}</b><span>{popis}</span>'
            f'<span class="when">{kdy}</span></figcaption></figure>')
    return '\n        '.join(vystup)


def reference_html(seznam, jazyk):
    vystup = []
    for i, r in enumerate(seznam):
        kde = f'reference.json, položka {i + 1}'
        nazev, _ = prelozit(r.get('nazev'), jazyk, kde) if r.get('nazev') else ('', jazyk)
        if not nazev:
            chyba(f'{kde}: chybí „nazev“')
        popis, _ = prelozit(r.get('popis', ''), jazyk, kde) if r.get('popis') else ('', jazyk)
        vystup.append(f'<li class="ref-card"><span class="ref-name">{esc(nazev)}</span><span class="ref-occ">{esc(popis)}</span></li>')
    return '\n          '.join(vystup)


YT_ID = re.compile(r'(?:youtu\.be/|[?&]v=|/shorts/|/embed/|/live/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])')
_NAHLEDY = {}


def yt_id(url):
    m = YT_ID.search(url or '')
    return m.group(1) if m else None


def existuje(url):
    """True = obrázek na YouTube existuje, False = neexistuje, None = nejde ověřit (bez sítě)."""
    try:
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except urllib.error.HTTPError:
        return False
    except Exception:
        return None


def yt_nahled(vid, na_vysku):
    """Náhled v nejvyšší dostupné kvalitě. U Shorts nejdřív svislý náhled (oardefault, až 1080×1920),
    pak maxres (1280×720), sd (640×480) a hq (480×360, ten existuje vždy)."""
    if vid in _NAHLEDY:
        return _NAHLEDY[vid]
    kandidati = (['oardefault'] if na_vysku else []) + ['maxresdefault', 'sddefault']
    vysledek = None
    for k in kandidati:
        url = f'https://i.ytimg.com/vi/{vid}/{k}.jpg'
        ok = existuje(url)
        if ok:
            vysledek = url
            break
        if ok is None:  # bez sítě nejde ověřit – vezmeme nejlepší běžný náhled
            print(f'Upozornění: nelze ověřit náhled videa {vid}, použiji maxresdefault.')
            vysledek = f'https://i.ytimg.com/vi/{vid}/maxresdefault.jpg'
            break
    _NAHLEDY[vid] = vysledek or f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg'
    return _NAHLEDY[vid]


def videa_html(seznam, jazyk):
    if not seznam:
        chyba('videa.json: seznam videí je prázdný, nechte tam aspoň jedno video')
    vystup = []
    videna = {}
    for i, v in enumerate(seznam):
        kde = f'videa.json, položka {i + 1} ({v.get("nazev", "?") if isinstance(v.get("nazev"), str) else "?"})'
        url = v.get('url', '')
        vid = yt_id(url)
        if not vid:
            chyba(f'{kde}: v „url“ není platný odkaz na YouTube video („{url}“)')
            continue
        if vid in videna:
            chyba(f'{kde}: stejné video už je v položce {videna[vid]}')
        videna[vid] = i + 1
        nazev, nj = prelozit(v.get('nazev'), jazyk, kde) if v.get('nazev') else ('', jazyk)
        if not nazev:
            chyba(f'{kde}: chybí „nazev“ (název skladby)')
        misto, mj = prelozit(v.get('misto'), jazyk, kde) if v.get('misto') else ('', jazyk)
        na_vysku = v.get('na_vysku')
        if na_vysku is None:
            na_vysku = '/shorts/' in url
        elif not isinstance(na_vysku, bool):
            chyba(f'{kde}: „na_vysku“ musí být true nebo false (bez uvozovek), nebo položku vynechte')
        nahled = v.get('nahled')
        if nahled:
            if not re.match(r'^(https://|video/)', nahled):
                chyba(f'{kde}: „nahled“ musí začínat „video/“ (soubor ve složce video) nebo „https://“')
            elif nahled.startswith('video/') and not (ROOT / nahled).exists():
                chyba(f'{kde}: soubor „{nahled}“ v repozitáři neexistuje')
            src = nahled if nahled.startswith('https://') else f'https://{SITE}/{nahled}'
        else:
            src = yt_nahled(vid, na_vysku)
        aria = PLAY_LABEL[jazyk] + ': ' + nazev + (' – ' + misto if misto else '')
        n_lang = f' lang="{nj}"' if nj != jazyk else ''
        m_lang = f' lang="{mj}"' if mj != jazyk else ''
        vert_attr = ' data-vert="1"' if na_vysku else ''
        misto_html = f'<div class="vid-place"{m_lang}>{esc(misto)}</div>' if misto else ''
        vystup.append(
            f'<div class="vid-item" data-yt="{vid}"{vert_attr}>'
            f'<button class="vid-blob" type="button" aria-label="{html.escape(aria)}">'
            f'<svg class="vid-eq" data-i="{i}" viewBox="0 0 200 200" aria-hidden="true"></svg>'
            f'<span class="vid-photo" data-src="{html.escape(src)}" data-cid="vidclipo{i}" data-i="{i}"></span>'
            f'<span class="vid-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></button>'
            f'<div class="vid-name"{n_lang}>{esc(nazev)}</div>{misto_html}</div>')
    return '\n            '.join(vystup)


def vloz(s, znacka, obsah, odsazeni, soubor):
    pat = re.compile(rf'(<!-- {znacka}:START[^>]*-->)(.*?)(<!-- {znacka}:END -->)', re.S)
    if len(pat.findall(s)) != 1:
        sys.exit(f'CHYBA: v {soubor} chybí značky <!-- {znacka}:START --> a <!-- {znacka}:END -->')
    return pat.sub(lambda m: m.group(1) + '\n' + odsazeni + obsah + '\n' + odsazeni + m.group(3), s)


def sipky(s, pocet):
    """Šipky u recenzí jen tehdy, když jsou aspoň dvě."""
    for idv in ('revPrevBtn', 'revNextBtn'):
        s = re.sub(rf'(<button type="button" class="rev-arrow [a-z]+" id="{idv}")( style="display:none")?',
                   lambda m: m.group(1) + ('' if pocet > 1 else ' style="display:none"'), s)
    return s


def main():
    recenze = nacti('recenze.json', 'recenze')
    reference = nacti('reference.json', 'reference')
    videa = nacti('videa.json', 'videa')
    for jazyk, soubor in PAGES.items():
        p = ROOT / soubor
        s = p.read_text(encoding='utf-8')
        s = vloz(s, 'RECENZE', recenze_html(recenze, jazyk), '        ', soubor)
        s = vloz(s, 'REFERENCE', reference_html(reference, jazyk), '          ', soubor)
        s = vloz(s, 'VIDEA', videa_html(videa, jazyk), '            ', soubor)
        s = sipky(s, len(recenze))
        if not CHYBY:
            p.write_text(s, encoding='utf-8')
    llms = ROOT / 'llms.txt'
    if llms.exists() and not CHYBY:
        t = llms.read_text(encoding='utf-8')
        jmena = ', '.join(prelozit(r.get('nazev'), 'cs', 'llms')[0] for r in reference)
        t2 = re.sub(r'^(- Reference [^:]*: ).*$', lambda m: m.group(1) + jmena, t, count=1, flags=re.M)
        if t2 != t:
            llms.write_text(t2, encoding='utf-8')
    if CHYBY:
        sys.exit('Nic jsem nezměnil, v souborech jsou chyby:\n- ' + '\n- '.join(dict.fromkeys(CHYBY)))
    print(f'Hotovo: {len(recenze)} recenzí, {len(reference)} referencí, {len(videa)} videí ({SITE}).')


if __name__ == '__main__':
    main()
