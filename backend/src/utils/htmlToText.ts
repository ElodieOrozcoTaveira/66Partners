/**
 * Version texte brut d'un email HTML (partie text/plain du message).
 * Les messageries (Outlook/Hotmail en tête) classent plus volontiers en
 * indésirables un email qui n'a qu'une partie HTML.
 */
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  ccedil: "ç",
  copy: "©",
  mdash: "—",
  ndash: "–",
  hellip: "…",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const value = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

export function htmlToText(html: string): string {
  let text = html
    // Blocs réservés à Outlook (VML) : doublons du contenu normal.
    .replace(/<!--\[if mso\]>[\s\S]*?<!\[endif\]-->/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "");

  // Liens : « libellé : adresse » pour que les boutons restent utilisables.
  text = text.replace(/<a\b[^>]*?href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, inner: string) => {
    const label = stripTags(inner);
    const url = decodeEntities(href).trim();
    if (!url || url.startsWith("mailto:") || url === label) return label || url.replace(/^mailto:/, "");
    return label ? `${label} : ${url}` : url;
  });

  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|h[1-6]|tr|table|ul|ol|li|section|header|footer|center|blockquote)\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "");

  return decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    // Numéro d'étape seul sur sa ligne : « 1. Titre ».
    .replace(/^(\d{1,2})\n+(?=\S)/gm, "$1. ")
    .trim();
}
