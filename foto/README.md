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
- Původních 8 fotek (`01-11-2025.webp` až `20-12-2025.webp`) má 600 × 800 px, to je také v pořádku. Data v jejich názvech jsou jen pro seřazení.

## Název souboru

```
DD-MM-RRRR.webp
```

Příklad: `27-10-2026.webp`

Víc fotek ze stejného dne: `27-10-2026.webp`, `27-10-2026-2.webp`, `27-10-2026-3.webp` …

- **Datum = den akce, ve tvaru DD-MM-RRRR** (vždy dvě číslice: `05-03-2026`, ne `5-3-2026`). Podle něj se galerie řadí (nejnovější první). Fotky ze stejného dne jdou v pořadí: bez čísla, -2, -3 …
- Ve složce na GitHubu se fotky seřadí podle dne v měsíci, ne chronologicky – to nevadí, na webu je pořadí správně.
- Žádné mezery, háčky ani čárky – fotka s mezerou nebo diakritikou v názvu se do galerie **nepřidá**.
- Když datum v názvu chybí, použije se datum nahrání.

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
