# Spočítej si úvěr | Imperial Vision

Sub-web s kalkulačkou refinancování. React 19 + TypeScript, build přes esbuild (žádný další framework).

## Spuštění

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit testy výpočtů (Node ≥ 22.6)
npm run typecheck
npm run build      # → dist/ (statický web, nasaditelný na libovolný hosting)
```

Složka `dist/` je již sestavená – lze ji nahrát na hosting i bez instalace.

## Struktura

```
src/
  styles/tokens.css      ← VŠECHNY design tokeny (barvy, gradient, písmo, rádiusy, rozestupy…)
  styles/app.css         ← komponenty, používají jen tokeny
  lib/loanMath.ts        ← výpočetní logika (bez UI), testy v tests/
  lib/format.ts          ← české formáty čísel a CZK
  lib/consent.ts         ← správa souhlasu s cookies
  lib/contact.ts         ← odeslání poptávky (adaptér pro backend)
  config/site.ts         ← kontakty, právní údaje, integrace (null = chybí)
  data/partners.ts       ← loga partnerů
  data/reviews.ts        ← Google recenze
  components/            ← sekce a komponenty
public/assets/brand      ← logo, symbol, originální gradienty, favicon
public/assets/fonts      ← Archivo (subset, OFL licence)
BRAND_RULES.md           ← přehled pravidel identity a jak jsou uplatněna
```

## Kalkulačka – metodika

- Anuitní splátka `M = P × r / (1 − (1 + r)^−n)`, pro `r = 0` platí `M = P / n`.
- **Současný úvěr**: pokud uživatel zadá splátku, náklady se počítají splátkovým kalendářem s touto splátkou (měsíční úročení, poslední splátka zkrácena). Pokud se zadaná splátka liší o více než 2 % od splátky dopočtené ze zůstatku, sazby a doby, zobrazí se upozornění. Bez zadané splátky se dopočítá.
- **Modelový úvěr**: anuita ze stejného zůstatku, modelové sazby a nové splatnosti.
- **Rozdíl měsíčních splátek** = současná − modelová. **Celková úspora / dodatečné náklady** = zbývající platby současného úvěru − (platby modelového úvěru + náklady refinancování). Obojí je zobrazeno odděleně.
- **Návratnost nákladů** = náklady / měsíční rozdíl (zaokrouhleno nahoru).
- Upozornění: delší splatnost, nižší splátka ale vyšší celkové náklady, nepokryté poplatky, sazba bez úspory, fixace před koncem.
- Validace: chybějící a nečitelné hodnoty, rozsahy (sazba 0–30 %, doba 1 měsíc–40 let), splátka nepokrývající úrok, fixace v minulosti.
- Výsledky jsou nominální, bez inflace, se sazbou neměnnou po celou dobu. Modelová sazba není nabídkou banky – uvedeno v UI.

## Integrace, které chybí

### Kontaktní formulář
Backend není k dispozici. Dokud je `SITE.integrations.leadEndpoint` `null`, formulář nic neodesílá ani neukládá
a uživateli to pravdivě oznámí (lišta „Ukázkový režim“ + stav po odeslání).

Pro zprovoznění nastavte endpoint, který přijme `POST application/json` s tělem `LeadPayload` (viz `src/lib/contact.ts`)
a vrátí 2xx. Doporučení pro backend:
- serverová validace a sanitizace všech polí (klientská validace nestačí), limit velikosti požadavku,
- ochrana proti spamu (honeypot pole `web` je již ve formuláři; doplnit rate limiting nebo captcha),
- CORS povolený jen pro doménu webu, HTTPS,
- uložení do CRM / odeslání e-mailem; doba uchování a zpracovatelé uvedení v zásadách ochrany osobních údajů,
- záznam souhlasu (čas, text souhlasu).

Možnosti: vlastní API, serverless funkce (Vercel/Netlify/Cloudflare), Formspree / Basin, nebo přímo webhook do CRM.

### Google recenze
`src/data/reviews.ts` obsahuje 5 skutečných recenzí a souhrn (5,0 / 17 recenzí) převzaté z profilu
Imperial Vision s.r.o. na Mapách Google k 31. 10. 2026. Zbývající recenze doplňte ve stejném formátu. Pro automatické načítání: Google Places API (Place Details → `reviews`,
vrací max. 5 recenzí, vyžaduje API klíč a serverový proxy endpoint, zobrazení podle pravidel Google) nebo Google Business
Profile API. Recenze neupravujte.

### Partnerská loga
34 dodaných log je v `public/assets/partners/` (oříznutá PNG), seznam s opticky vyrovnanými rozměry v
`src/data/partners.ts`. Nové logo: soubor do stejné složky + řádek v seznamu.

### Analytika / marketing
Žádné nástroje nejsou nasazeny. Přidávejte je výhradně přes `registerConsentScript()` v `src/lib/consent.ts`
(spustí se až po souhlasu, při odvolání se smažou uvedené cookies). Seznam cookies doplňte do zásad cookies.

## Chybějící podklady (před spuštěním)

| Podklad | Kde doplnit |
|---|---|
| Doména / kanonická URL (pro `canonical`, absolutní `og:image`) | `index.html`, `src/config/site.ts` |
| ~~Telefon, e-mail, adresa, hlavní web~~ – doplněno z imperialvision.cz | `src/config/site.ts` |
| ~~Obchodní firma, IČO, sídlo, zápis v OR~~ – doplněno z imperialvision.cz; DIČ tam není uvedeno | `src/config/site.ts` |
| Regulační postavení dle zák. č. 257/2016 Sb., číslo registrace v ČNB, příp. zastoupený zprostředkovatel | `src/config/site.ts` |
| Mimosoudní řešení sporů / orgán dohledu, informace o odměně | `src/config/site.ts`, právní stránky |
| Texty: Ochrana osobních údajů, Zásady cookies, Právní informace | `src/components/Closing.tsx` (`LEGAL_PAGES`) |
| ~~Loga partnerů~~ – dodáno (34 log, `public/assets/partners/`) | `src/data/partners.ts` |
| Zbývajících 12 ze 17 Google recenzí (bez přihlášení Google zobrazí jen 5) nebo přístup k API | `src/data/reviews.ts` |
| Endpoint pro poptávky (CRM / e-mail) | `src/config/site.ts` |
| Oficiální HEX/CMYK hodnoty barev a gradientu | `src/styles/tokens.css` |
| Originální SVG symbolu a vertikálního loga, pravidlo minimální velikosti | `public/assets/brand/` |
| Kontrola textu „imperialvison.cz“ v manuálu (str. 20) – pravděpodobně překlep | – |

Viditelné placeholdery jsou na webu označeny „[Doplnit: …]“, „Testovací data“ a „Partner 1…8“.

## Verze pro GoHighLevel (spocitejsiuver.cz)

Web běží i jako stránka v GoHighLevel: každá sekce je v GHL samostatná sekce s prvkem **Custom Code**, který obsahuje jen místo pro sekci. Skript a styly se načítají v *Header tracking code* stránky.

```bash
npm run build:ghl   # → ghl-dist/ (skript, CSS s prefixem .iv a použité soubory)
```

Obsah `ghl-dist/` se nahraje do `docs/ghl/` v repozitáři (hosting přes GitHub Pages: `https://sucikdesign.github.io/spocitej-si-uver/ghl/`).

**Header tracking code stránky v GHL:**

```html
<link rel="stylesheet" href="https://sucikdesign.github.io/spocitej-si-uver/ghl/iv-ghl.css?v=1">
<script>window.IV_CONFIG = { leadEndpoint: "URL_INBOUND_WEBHOOKU", leadFormat: "form" };</script>
<script src="https://sucikdesign.github.io/spocitej-si-uver/ghl/iv-ghl.js?v=1" defer></script>
```

Po každé aktualizaci zvyšte `?v=` v obou odkazech.

**Sekce (Custom Code v pořadí):**

| Sekce | Kód |
|---|---|
| Hero | `<div data-iv="hero"></div>` |
| Partneři | `<div data-iv="partneri"></div>` |
| Jak to funguje | `<div data-iv="jak-to-funguje"></div>` |
| Kalkulačka | `<div data-iv="kalkulacka"></div>` |
| Recenze | `<div data-iv="recenze"></div>` |
| Kontakt | `<div data-iv="kontakt"></div>` |
| Patička | `<div data-iv="paticka"></div>` |

Navigace, cookie lišta a právní stránky (překryvné okno) se vkládají automaticky. Sekce lze v GHL přesouvat, skrývat nebo odebrat.

**Formulář → CRM:** workflow v GHL s triggerem *Inbound Webhook*. Formulář posílá `application/x-www-form-urlencoded` s poli `first_name`, `last_name`, `name`, `email`, `phone`, `message`, `preferred_contact`, `consent_personal_data`, `calculation` (výsledek kalkulace jako text), `source`, `submitted_at`, `page_url`.
