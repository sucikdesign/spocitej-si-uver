// Build & dev server – esbuild (jediná build závislost).
//   npm run build   → dist/ (statický web připravený k nasazení)
//   npm run dev     → http://localhost:5173 s automatickým přebuildováním
import * as esbuild from "esbuild";
import { cp, mkdir, rm, copyFile } from "node:fs/promises";

const dev = process.argv.includes("--dev");
const ghl = process.argv.includes("--ghl");
const outdir = "dist";

if (ghl) {
  await buildGhl();
  process.exit(0);
}

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
await cp("public", outdir, { recursive: true });
await copyFile("index.html", `${outdir}/index.html`);

const options = {
  entryPoints: { app: "src/main.tsx" },
  bundle: true,
  outdir,
  format: "esm",
  target: ["es2020", "safari15"],
  jsx: "automatic",
  minify: !dev,
  sourcemap: dev,
  legalComments: "none",
  external: ["/assets/*"],
  define: { "process.env.NODE_ENV": JSON.stringify(dev ? "development" : "production") },
  logLevel: "info",
};

if (dev) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: outdir, port: 5173 });
  console.log(`\n  Spočítej si úvěr → http://localhost:${port}\n`);
} else {
  await esbuild.build(options);
}

/* ------------------------------------------------------------------------ */
/* Verze pro GoHighLevel: npm run build:ghl → ghl-dist/                      */
/*  - jeden skript (IIFE) + jedno CSS s prefixem .iv                          */
/*  - cesty /assets/… přepsány na absolutní URL hostingu (GHL_ASSET_BASE)     */
/* ------------------------------------------------------------------------ */
async function buildGhl() {
  const { readFile, writeFile } = await import("node:fs/promises");
  const { scopeCss } = await import("./scripts/scope-css.mjs");
  const BASE = (process.env.GHL_ASSET_BASE || "https://sucikdesign.github.io/spocitej-si-uver/ghl").replace(/\/$/, "");
  const out = "ghl-dist";
  await rm(out, { recursive: true, force: true });
  await mkdir(`${out}/assets`, { recursive: true });
  await esbuild.build({
    entryPoints: { "iv-ghl": "src/ghl.tsx" },
    bundle: true, outdir: out, format: "iife", target: ["es2020", "safari15"], jsx: "automatic",
    minify: true, legalComments: "none", external: ["/assets/*"],
    define: { "process.env.NODE_ENV": '"production"' }, logLevel: "info",
  });
  const fix = (s) => s.replaceAll("/assets/", `${BASE}/assets/`);
  const js = await readFile(`${out}/iv-ghl.js`, "utf8");
  await writeFile(`${out}/iv-ghl.js`, fix(js));
  // CSS: tokens + app s prefixem .iv, pak doplňky pro GHL; nakonec minifikace
  const raw = (await readFile("src/styles/tokens.css", "utf8")) + "\n" + (await readFile("src/styles/app.css", "utf8"));
  const scoped = scopeCss(raw) + "\n" + (await readFile("src/styles/ghl.css", "utf8"));
  const min = await esbuild.transform(fix(scoped), { loader: "css", minify: true, target: ["safari15"] });
  await writeFile(`${out}/iv-ghl.css`, min.code);
  await rm(`${out}/iv-ghl.css.map`, { force: true });
  // jen soubory, které web skutečně používá
  const used = [
    "fonts/Archivo-Variable-latin-ext.woff",
    "brand/imperial-vision-logo-horizontal-white.svg",
    "brand/imperial-vision-logo-horizontal-black.svg",
    "brand/imperial-vision-logo-horizontal-gradient.webp",
    "brand/imperial-vision-symbol-white.svg",
    "brand/imperial-vision-symbol-black.svg",
    "brand/imperial-vision-x-sab-servis-white.svg",
    "brand/iv-gradient.webp",
    "brand/favicon-32.png",
    "video/hero-1920.mp4", "video/hero-1920.webm", "video/hero-1280.mp4", "video/hero-1280.webm", "video/hero-first.webp",
  ];
  const { partners } = await import("./scripts/partners-list.mjs");
  for (const f of [...used, ...partners]) {
    await mkdir(`${out}/assets/${f.split("/").slice(0, -1).join("/")}`, { recursive: true });
    await copyFile(`public/assets/${f}`, `${out}/assets/${f}`);
  }
  console.log(`\n  GHL build → ${out}/ (assets base: ${BASE})\n`);
}
