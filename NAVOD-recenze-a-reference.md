# Jak přidat recenzi nebo místo, kde jsme hráli

Recenze a reference se už neupravují v `index.html`. Mají vlastní soubory:

- **`recenze.json`** – recenze („Co nám píší klienti“)
- **`reference.json`** – místa a akce („Pro koho jsme hráli“)

Po uložení souboru na GitHubu se do minuty sama upraví česká, anglická i německá stránka. Potom se web znovu publikuje (zhruba 1–2 minuty).

## Postup na GitHubu (stačí prohlížeč, i v mobilu)

1. Otevřete repozitář a klikněte na `recenze.json` (nebo `reference.json`).
2. Vpravo nahoře klikněte na **tužku** (Edit this file).
3. Zkopírujte vzor níže a vložte ho **za poslední `}` před `]`**. Mezi položkami musí být **čárka**.
4. Dole klikněte na **Commit changes**.
5. V záložce **Actions** uvidíte běh „Recenze a reference“. Zelená fajfka = hotovo, červený křížek = v souboru je chyba (viz níže).

## Vzor recenze

```json
    {
      "jmeno": "Jana K.",
      "datum": "2026-10-10",
      "akce": { "cs": "firemní večer", "en": "corporate evening", "de": "Firmenabend" },
      "text": {
        "cs": "Přesně takhle jsme si to představovali…",
        "en": "Exactly what we had in mind…",
        "de": "Genau so hatten wir es uns vorgestellt…"
      },
      "hvezdy": 5,
      "zdroj": "https://www.budemesvoji.cz/listing/david-klenha-jazz-band/"
    }
```

| Pole | Povinné | Poznámka |
|---|---|---|
| `jmeno` | ano | Křestní jméno a iniciála, např. „Jana K.“. Jen se souhlasem klienta. |
| `datum` | ano | Vždy ve tvaru **RRRR-MM-DD**. Web ho sám převede na 10. 10. 2026 / 10 Oct 2026 / 10.10.2026. Recenze se řadí od nejnovější. |
| `akce` | ne | Typ akce. Stačí jen `"cs"`; bez anglického nebo německého překladu se na EN/DE stránce ukáže jen název sestavy. |
| `text` | ano | Stačí jen `"cs"`. Bez překladu se na EN/DE stránce ukáže český originál. |
| `hvezdy` | ne | Jen u recenzí z portálu, kde klient opravdu dal hvězdičky (budemesvoji, Google). **U poděkování z e-mailu pole vynechte**, hvězdičky se pak nezobrazí. |
| `zdroj` | ne | Odkud recenze je (odkaz na budemesvoji, nebo `"e-mail"`). Na webu se nezobrazuje, slouží vám pro kontrolu. |

Název sestavy („jazzové duo“, „jazzové trio“…) se doplní sám podle webu. Každý web má vlastní `recenze.json`, takže recenzi vložte na web té sestavy, která opravdu hrála.

Šipky u recenzí se zobrazí samy, jakmile jsou na webu aspoň dvě recenze.

## Vzor reference

```json
    {
      "nazev": "Hotel Augustine",
      "popis": { "cs": "Praha · firemní večer", "en": "Prague · corporate evening", "de": "Prag · Firmenabend" }
    }
```

Pokud se název v jiném jazyce liší, napište ho stejně jako popis:
`"nazev": { "cs": "Zámek Zbraslav", "en": "Zbraslav Chateau", "de": "Schloss Zbraslav" }`

Reference se zobrazují v pořadí, v jakém jsou v souboru. Nejdůležitější dejte nahoru.

## Když běh skončí červeně

Klikněte na běh v záložce Actions → krok „Vygenerovat recenze a reference“. Chyba je popsaná česky, např.:

- `CHYBA v recenze.json, řádek 14 … chybí čárka` – mezi dvěma `}` a `{` chybí `,`, nebo chybí uvozovka.
- `datum „1.10.2026“ musí být ve tvaru RRRR-MM-DD` – opravte na `2026-10-01`.
- `chybí český text („cs“)`

Dokud je v souboru chyba, **web se nezmění**, takže nic nerozbijete. Opravte soubor a uložte znovu.

## Pravidla

- Jen skutečné recenze a skutečná místa. Vymyšlené recenze jsou podle zákona o ochraně spotřebitele zakázané.
- Jména klientů a firem jen s jejich souhlasem.
- `index.html` mezi značkami `<!-- RECENZE:START -->` a `<!-- RECENZE:END -->` (a totéž u REFERENCE) ručně neupravujte. Při dalším běhu by se to přepsalo.
