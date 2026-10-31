// Build & dev server – esbuild (jediná build závislost).
//   npm run build   → dist/ (statický web připravený k nasazení)
//   npm run dev     → http://localhost:5173 s automatickým přebuildováním
import * as esbuild from "esbuild";
import { cp, mkdir, rm, copyFile } from "node:fs/promises";

const dev = process.argv.includes("--dev");
const outdir = "dist";

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
