// Přidá ke všem selektorům prefix `.iv`, aby styly webu neovlivnily zbytek
// stránky v GoHighLevel a naopak. Zachová stavové třídy na <html>
// (.motion, .intro-playing, .intro-done) i @font-face / @keyframes.
const HTML_STATE = /^((?:\.(?:motion|intro-playing|intro-done|iv-legal-open))+)(?=\s|$)/;

function splitTop(sel) {
  const out = []; let depth = 0, cur = "";
  for (const ch of sel) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

function scopeSelector(s) {
  if (s.startsWith(":root")) return ".iv" + s.slice(5);
  if (/^html\b/.test(s)) return s;                       // ponechat (scroll apod.)
  if (/^body\b/.test(s)) return ".iv" + s.slice(4);
  const m = s.match(HTML_STATE);
  if (m) {
    const rest = s.slice(m[1].length).trim();
    if (!rest || /^(body|html)\b/.test(rest)) return s;
    return `${m[1]} .iv ${rest}`;
  }
  return `.iv ${s}`;
}

export function scopeCss(css) {
  let i = 0, out = "";
  const n = css.length;
  function readBlock(start) {           // vrátí index za odpovídající }
    let depth = 0;
    for (let j = start; j < n; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") { depth--; if (depth === 0) return j + 1; }
    }
    return n;
  }
  function process(text) {
    let res = "", k = 0;
    while (k < text.length) {
      const open = text.indexOf("{", k);
      if (open === -1) { res += text.slice(k); break; }
      const prelude = text.slice(k, open);
      // najdi konec bloku
      let depth = 0, end = open;
      for (; end < text.length; end++) {
        if (text[end] === "{") depth++;
        else if (text[end] === "}") { depth--; if (depth === 0) { end++; break; } }
      }
      const body = text.slice(open + 1, end - 1);
      const p = prelude.trim();
      // komentáře a mezery před pravidlem ponecháme
      const lead = prelude.slice(0, prelude.length - prelude.trimStart().length);
      if (p.startsWith("@media") || p.startsWith("@supports") || p.startsWith("@container") || p.startsWith("@layer")) {
        res += lead + p + "{" + process(body) + "}";
      } else if (p.startsWith("@")) {
        res += lead + p + "{" + body + "}";      // @font-face, @keyframes …
      } else {
        const cleaned = p.replace(/\/\*[\s\S]*?\*\//g, "").trim();
        res += lead + splitTop(cleaned).map(scopeSelector).join(",") + "{" + body + "}";
      }
      k = end;
    }
    return res;
  }
  void readBlock; void i; void out;
  return process(css.replace(/\/\*[\s\S]*?\*\//g, ""));
}
