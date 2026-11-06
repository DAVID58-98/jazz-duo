# Jak přidat video do Videoukázek

Videa se už neupravují v `index.html`. Mají vlastní soubor **`videa.json`** (v kořeni repozitáře, vedle `recenze.json`).

Po uložení souboru na GitHubu se do minuty sama upraví česká, anglická i německá stránka. Potom se web znovu publikuje (zhruba 1–2 minuty).

## Postup na GitHubu (stačí prohlížeč, i v mobilu)

1. Otevřete repozitář a klikněte na `videa.json`.
2. Vpravo nahoře klikněte na **tužku** (Edit this file).
3. Zkopírujte vzor níže a vložte ho **hned za `"videa": [`**, pokud má být video ve slideru první. Na konec seznamu (za poslední `}` před `]`) ho dejte, pokud má být poslední. Mezi položkami musí být **čárka**.
4. Dole klikněte na **Commit changes**.
5. V záložce **Actions** uvidíte běh „Recenze, reference a videa“. Zelená fajfka = hotovo, červený křížek = v souboru je chyba (viz níže).

## Vzor videa

```json
    {
      "url": "https://youtube.com/shorts/9Fh07PPHEYw",
      "nazev": "Blue Suede Shoes",
      "misto": "Club Salsita, Praha"
    },
```

Čárka za `}` patří tam, když pod vloženým videem následuje další. U posledního videa v seznamu čárka být nesmí.

| Pole | Povinné | Poznámka |
|---|---|---|
| `url` | ano | Odkaz na YouTube. Funguje `youtube.com/shorts/…`, `youtube.com/watch?v=…` i `youtu.be/…`. ID videa si web vytáhne sám. |
| `nazev` | ano | Název skladby. |
| `misto` | ne | Kde se hrálo, zobrazí se pod názvem. Stačí česky. Pokud se místo v jiném jazyce liší, napište ho takto: `"misto": { "cs": "Hotel Augustine, Praha", "en": "Hotel Augustine, Prague", "de": "Hotel Augustine, Prag" }` |
| `na_vysku` | ne | Web pozná video na výšku sám podle odkazu `/shorts/`. Pole použijte, jen když je video na výšku, ale odkaz je běžný (`"na_vysku": true`), nebo naopak (`"na_vysku": false`). Bez uvozovek. |
| `nahled` | ne | Vlastní náhledová fotka místo té z YouTube, např. `"nahled": "video/0.webp"` (soubor nahraný do složky `video`). Bez tohoto pole se použije náhled z YouTube v nejvyšší dostupné kvalitě. |

Pořadí ve slideru = pořadí v souboru. Co je v souboru nahoře, je ve slideru první.

## Náhledová fotka

Bez pole `nahled` si web náhled vezme z YouTube sám, v nejvyšší kvalitě, kterou YouTube k videu má:

- Shorts: svislý náhled (až 1080 × 1920), jinak 1280 × 720.
- Běžná videa: 1280 × 720, jinak nižší.

Do bubliny se vyřízne střed obrázku. Pokud ořez nesedí (např. hlava je mimo střed), nahrajte vlastní fotku do složky `video` a doplňte pole `nahled`.

Když na YouTube změníte náhled videa, web ho převezme sám (obrázek se načítá přímo z YouTube).

## Když běh skončí červeně

Klikněte na běh v záložce Actions → krok „Vygenerovat recenze, reference a videa“. Chyba je popsaná česky, např.:

- `CHYBA v videa.json, řádek 14 … chybí čárka`: mezi dvěma `}` a `{` chybí `,`, nebo chybí uvozovka. Častá chyba je i čárka navíc za posledním videem.
- `v „url“ není platný odkaz na YouTube video`: zkopírujte odkaz znovu přes Sdílet → Kopírovat odkaz.
- `stejné video už je v položce 3`: video je v seznamu dvakrát.
- `chybí „nazev“`

Dokud je v souboru chyba, **web se nezmění**, takže nic nerozbijete. Opravte soubor a uložte znovu.

## Pravidla

- Videa musí být na YouTube veřejná nebo „neveřejná“ (unlisted). Soukromé video se na webu nepřehraje.
- `index.html` mezi značkami `<!-- VIDEA:START -->` a `<!-- VIDEA:END -->` ručně neupravujte. Při dalším běhu by se to přepsalo.
