/**
 * Partnerská loga pro slider – dodaná Imperial Vision (složka „Partneri“, 34 log).
 *
 * Soubory jsou v /public/assets/partners/ (PNG, černá na průhledném pozadí,
 * oříznuté o prázdné okraje). `width` × `height` je opticky vyrovnaná velikost
 * v px: loga mají podobnou vizuální plochu bez ohledu na poměr stran.
 *
 * Nové logo: uložte soubor do /public/assets/partners/ a přidejte řádek níže.
 */

export interface Partner {
  name: string;
  /** Cesta k logu. Bez loga se zobrazí neutrální placeholder. */
  logo?: string;
  /** Zobrazená šířka a výška v px (opticky vyrovnané). */
  width?: number;
  height?: number;
  placeholder?: boolean;
}

/**
 * Na webu se zobrazují jen banky, se kterými se refinancuje (výběr klienta).
 * Pořadí podle zadání. Chybějící loga (Zonky, InBank, Komerční banka, Trinity Bank)
 * jsou níže zakomentovaná – po dodání souboru stačí doplnit `logo` + rozměry a odkomentovat.
 * V dodané sadě je jen „KB Pojišťovna“, což NENÍ logo Komerční banky – proto se nepoužívá.
 */
export const partners: Partner[] = [
  // { name: "Zonky", logo: "/assets/partners/zonky.svg", width: 0, height: 0 },
  // { name: "InBank", logo: "/assets/partners/inbank.svg", width: 0, height: 0 },
  { name: "Cofidis", logo: "/assets/partners/partner-04.png", width: 76, height: 50 },
  { name: "Česká spořitelna", logo: "/assets/partners/partner-07.png", width: 105, height: 49 },
  { name: "ČSOB", logo: "/assets/partners/partner-09.png", width: 64, height: 50 },
  // { name: "Komerční banka", logo: "/assets/partners/kb.svg", width: 0, height: 0 },
  { name: "mBank", logo: "/assets/partners/partner-22.png", width: 118, height: 44 },
  { name: "Oberbank", logo: "/assets/partners/partner-26.png", width: 170, height: 29 },
  { name: "Modrá pyramida", logo: "/assets/partners/partner-24.png", width: 100, height: 50 },
  { name: "Raiffeisenbank", logo: "/assets/partners/partner-28.png", width: 141, height: 37 },
  // { name: "Trinity Bank", logo: "/assets/partners/trinity-bank.svg", width: 0, height: 0 },
  { name: "UniCredit Bank", logo: "/assets/partners/partner-32.png", width: 170, height: 22 },
];
