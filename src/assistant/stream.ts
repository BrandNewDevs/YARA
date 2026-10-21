/** Read only a top-level reply string from an incomplete JSON object. */
export function partialReply(raw: string): string | undefined {
  // The model is instructed to emit reply first. A later reply is emitted on completion.
  const match = /^\s*\{\s*"reply"\s*:\s*"/.exec(raw);
  if (!match) return undefined;
  let result = '';
  for (let i = match[0].length; i < raw.length; i++) {
    const char = raw[i];
    if (char === '"') return result;
    if (char === '\\') {
      if (++i >= raw.length) break;
      const escaped = raw[i];
      if (escaped === 'u') {
        const hex = raw.slice(i + 1, i + 5);
        if (hex.length !== 4) break;
        if (!/^[0-9a-f]{4}$/i.test(hex)) return undefined;
        result += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else {
        const escapes: Record<string, string> = { '"': '"', '\\': '\\', '/': '/', n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' };
        if (!(escaped in escapes)) return undefined;
        result += escapes[escaped];
      }
    } else {
      if (char.charCodeAt(0) < 32) return undefined;
      result += char;
    }
  }
  // Do not expose half of a UTF-16 surrogate pair.
  return /[\uD800-\uDBFF]$/.test(result) ? result.slice(0, -1) : result;
}
