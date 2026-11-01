// Loga partnerů, která jsou aktuálně v src/data/partners.ts (bez zakomentovaných).
import { readFile } from "node:fs/promises";
const src = await readFile(new URL("../src/data/partners.ts", import.meta.url), "utf8");
export const partners = src
  .split("\n")
  .filter((l) => !l.trim().startsWith("//"))
  .flatMap((l) => [...l.matchAll(/"\/assets\/(partners\/[^"]+)"/g)].map((m) => m[1]));
