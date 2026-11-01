# Imperial Vision – přehled závazných pravidel pro web

Zdroj: `IMPERIAL_VISION[design_manual].pdf` (Branding manuál, 30 stran) + dodané vizuály `priklad_01.png`, `priklad_02.png`.
Všechny hodnoty jsou centrálně v `src/styles/tokens.css`.

## Z manuálu (závazné)

| Oblast | Pravidlo | Kapitola | Jak je uplatněno na webu |
|---|---|---|---|
| Logo | Horizontální verze je primární varianta. | 1.2 | Header i patička používají originální horizontální SVG. |
| Ochranná zóna | = symbol zmenšený na 50 %; prostor musí zůstat volný. | 1.3 | SVG se používá včetně vnitřního okraje (zóny), neořezává se. |
| Úpravy loga | Zákaz měnit proporce symbolu a logotypu, rozdělovat, deformovat, otáčet. | 4.3 | Logo jen jako `<img>` z originálního souboru, výška řízená poměrem stran. |
| Monochrom | Logo lze použít v libovolné jednobarevné variantě při dostatečném kontrastu. | 4.2 | Bílá varianta (originál) + černá varianta (změněna jen výplň `fill`). |
| Gradient v logu | Povolen **výhradně** v centrální části symbolu („I“). | 4.1 | Na webu se gradient do loga nevkládá – logo je vždy monochromní. |
| Barevnost | Modulární gradienty jako základ barevného systému. | 2.1 | Hero i závěrečná sekce používají gradientové video `GRADIENT_loop_10s.mp4` (hero: úvod 0,7 s přes celou obrazovku, pak blok; v obou sekcích přehrávání na hover; rozhodnutí klienta). Rastr `iv-gradient.webp` zůstává připraven. |
| Fractal Glass | Rozšíření gradientu o skleněný efekt. | 2.2 | Na webu se záměrně nepoužívá – jen čistý gradient (rozhodnutí klienta). |
| Typografie | Primární písmo Archivo (variabilní). | 3.1 | Dodaný variabilní font, subset pro češtinu, rezy 400–700. |
| Symbol jako prvek | Samostatný symbol jako podkladová vrstva, doporučená opacita 10–20 %. | 4.5 | Vodoznak v sekci „Možná platíte…“. |

## Odvozeno z podkladů (manuál číselně neuvádí – nahraditi oficiálními hodnotami)

- **Zaoblení**: rohy symbolu mají poloměr ≈ 2,2 % výšky tahu (16/734 jednotek ve vektoru). Systém `3 / 5 / 8 / 12 px` – žádné pill tvary.
- **Neutrální barvy**: `#1e1e1e` (nadpisy), `#fbfbfb` (světlé plochy), `#7e7e7e`/`#b0b0b0` (šedé texty a obrysy) – změřeno z vizuálů.
- **Akcent**: `#e04f42` – červený štítek z `priklad_02.png`. Používá se jen pro štítek s velkým tučným písmem (kontrast 3,7 : 1 = AA pro velký text).
- **Lineární CSS gradient**: vzorkovaný z originálního rastru; jen pro tenké linky (proužek nad výsledky). Velké plochy vždy používají originální rastr.
- **Vodoznak na světlé ploše**: vizuály používají bílý symbol na `#fbfbfb` (velmi jemný); manuál pro tmavé pozadí uvádí 10–20 %. Web se drží vizuálů.
- **Typografie nadpisů**: Archivo SemiBold, mírně stažený tracking, nadpisy zakončené tečkou – podle vizuálů.

## Světlý motiv

Světlé sekce (`#fff` / `#fbfbfb`), tmavá patička. Hero: gradientové video 0,7 s přes celou obrazovku, pak se zmenší do odsazeného bloku s rádiusem 12 px; dál se přehrává jen při hoveru. Závěrečná sekce: stejné video, v klidu první snímek, při hoveru se přehrává; tmavé sklo (20 %) s bílým textem.

## Doplňkové UI barvy (mimo identitu)

Chyba `#b3261e`, varování `#8a5300`, úspěch `#1d6b46`, focus `#1e9dbd` (odvozen z tyrkysové části gradientu). Všechny splňují WCAG AA.

## Otevřené otázky k identitě

1. Oficiální HEX/RGB/CMYK hodnoty barev a bodů gradientu (manuál je neuvádí).
2. Výklad kap. 4.1: která část symbolu je „I“ – vizuál na str. 17 ukazuje gradient na levém tahu. Web gradient do loga zatím nevkládá.
3. Minimální velikost loga v digitálu (manuál neuvádí). Web používá výšku viditelného loga ≥ 32 px.
4. Vertikální logo a samostatný symbol jako originální soubory (web používá symbol vyříznutý z horizontálního SVG beze změny geometrie).
