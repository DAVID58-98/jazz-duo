#!/usr/bin/env python3
"""
Vygeneruje sekce „Co nám píší klienti“ a „Pro koho jsme hráli“ z recenze.json a reference.json
do index.html, en/index.html a de/index.html (mezi značky <!-- RECENZE:START/END --> a
<!-- REFERENCE:START/END -->). Spouští ho GitHub Actions po každé změně JSON souborů.
"""
import json, re, sys, html, datetime, pathlib

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
    for jazyk, soubor in PAGES.items():
        p = ROOT / soubor
        s = p.read_text(encoding='utf-8')
        s = vloz(s, 'RECENZE', recenze_html(recenze, jazyk), '        ', soubor)
        s = vloz(s, 'REFERENCE', reference_html(reference, jazyk), '          ', soubor)
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
    print(f'Hotovo: {len(recenze)} recenzí, {len(reference)} referencí ({SITE}).')


if __name__ == '__main__':
    main()
