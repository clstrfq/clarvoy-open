export function sanitizeCoachOutput(raw: string): string {
  const withoutMarkdown = raw
    .replace(/```/g, "")
    .replace(/^\s{0,3}#{1,6}\s?/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*]\s+/gm, "");

  return withoutMarkdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;b&gt;/g, "<b>")
    .replace(/&lt;\/b&gt;/g, "</b>")
    .replace(/&lt;i&gt;/g, "<i>")
    .replace(/&lt;\/i&gt;/g, "</i>")
    .replace(/&lt;br&gt;/g, "<br>")
    .replace(/&lt;br\/&gt;/g, "<br>")
    .replace(/&lt;br \/&gt;/g, "<br>")
    .replace(/\n/g, "<br>");
}

export function sanitizeUntrustedContext(input: string, maxChars: number): string {
  const withoutControls = input.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  const bounded = withoutControls.slice(0, maxChars);
  return bounded
    .replace(/```/g, "")
    .replace(/<\s*\/?\s*(system|assistant|user|tool)\s*>/gi, "");
}

export function buildBoundedContext(parts: string[], maxChars: number): string {
  const chunks: string[] = [];
  let used = 0;
  for (const part of parts) {
    if (!part || used >= maxChars) continue;
    const remaining = maxChars - used;
    const clipped = part.slice(0, remaining);
    chunks.push(clipped);
    used += clipped.length;
  }
  return chunks.join("\n");
}
