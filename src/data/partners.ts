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
 * Pořadí podle zadání. Barevná loga jsou v /assets/partners/color/ (dodáno 11/2026).
 * Cofidis a Komerční banka se na webu nezobrazují (rozhodnutí klienta 11/2026).
 * V dodané sadě je jen „KB Pojišťovna“, což NENÍ logo Komerční banky – proto se nepoužívá.
 */
export const partners: Partner[] = [
  { name: "Zonky", logo: "/assets/partners/color/zonky.png", width: 157, height: 38 },
  { name: "InBank", logo: "/assets/partners/color/inbank.png", width: 120, height: 42 },
  { name: "Česká spořitelna", logo: "/assets/partners/color/ceska-sporitelna.png", width: 111, height: 50 },
  { name: "ČSOB", logo: "/assets/partners/color/csob.png", width: 63, height: 50 },
  { name: "mBank", logo: "/assets/partners/color/mbank.png", width: 98, height: 37 },
  { name: "Oberbank", logo: "/assets/partners/color/oberbank.png", width: 150, height: 26 },
  { name: "Modrá pyramida", logo: "/assets/partners/color/modra-pyramida.png", width: 100, height: 50 },
  { name: "Raiffeisenbank", logo: "/assets/partners/color/raiffeisenbank.png", width: 155, height: 39 },
  { name: "Trinity Bank", logo: "/assets/partners/color/trinity-bank.png", width: 170, height: 14 },
  { name: "UniCredit Bank", logo: "/assets/partners/color/unicredit.png", width: 170, height: 22 },
];
