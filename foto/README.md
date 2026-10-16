# Jak přidat fotku do galerie

Galerie na webu se řadí sama **od nejnovější fotky**. Stačí fotku správně připravit a nahrát do této složky – zbytek udělá GitHub Action (do 1–2 minut je fotka na webu).

## Formát fotky

| | |
|---|---|
| **Formát** | **WebP** (`.webp`) |
| **Rozměr** | **900 × 1200 px** – na výšku, poměr **3 : 4** |
| **Kvalita** | 75–80 % |
| **Velikost souboru** | ideálně do **300 kB** (nad 400 kB GitHub upozorní) |

- Fotka na šířku se v náhledu ořízne na střed – proto ji radši rovnou ořízni na výšku 3 : 4.
- Fotky `2026-01-17` až `2026-09-19` mají data vymyšlená, jen pro seřazení. Některé z nich mají 600 × 800 px, to je také v pořádku.

## Název souboru

```
RRRR-MM-DD.webp
```

Příklad: `2026-10-27.webp` (= 27. 10. 2026)

Víc fotek ze stejného dne: `2026-10-27.webp`, `2026-10-27-2.webp`, `2026-10-27-3.webp` …

- **Datum = den akce, ve tvaru RRRR-MM-DD** – rok, měsíc, den (vždy dvě číslice: `2026-03-05`, ne `2026-3-5`). Podle něj se galerie řadí (nejnovější první). Fotky ze stejného dne jdou v pořadí: bez čísla, -2, -3 …
- Díky tomu jsou fotky seřazené podle data i ve složce na GitHubu (nejstarší nahoře, nejnovější dole).
- Když fotku omylem pojmenuješ evropsky (`27-10-2026.webp`), GitHub ji sám přejmenuje na `2026-10-27.webp`.
- Žádné mezery, háčky ani čárky – fotka s mezerou nebo diakritikou v názvu se do galerie **nepřidá**.
- Když datum v názvu chybí, použije se datum nahrání.

## Přejmenování fotky

GitHub na webu neumí přejmenovat obrázek. Vytvoř ve složce `foto` soubor `prejmenovat.txt` (Add file → Create new file) a napiš do něj řádky:

```
stary-nazev.webp -> 2026-10-27.webp
```

Po uložení GitHub fotky přejmenuje a soubor `prejmenovat.txt` sám smaže.

## Jak fotku připravit (nejrychleji)

1. Otevři **[squoosh.app](https://squoosh.app)** (funguje i v mobilu).
2. Přetáhni fotku → vpravo **Resize** zapni a nastav šířku **900** (výška se dopočítá – u fotky na výšku 3:4 vyjde 1200).
3. Dole vyber **WebP**, kvalita **75–80**.
4. Zkontroluj velikost vpravo dole (do 300 kB) → **Download**.
5. Přejmenuj podle vzoru výše.

## Jak fotku nahrát

1. Na GitHubu otevři složku **`foto`** v repozitáři `jazz-duo`.
2. **Add file → Upload files** → přetáhni fotky → **Commit changes**.
3. Počkej 1–2 minuty (záložka **Actions** → „Galerie“ musí mít zelenou fajfku) a obnov web.

**Smazání fotky:** otevři ji ve složce `foto` → tři tečky → **Delete file** → Commit. Galerie se upraví sama.

## Co nesahat

- `galerie.json` – generuje se automaticky, ručně ho neupravuj.
- Pokud Action ukáže žlutý vykřičník (warning), klikni na něj – napíše, která fotka má špatný název, formát nebo velikost.
