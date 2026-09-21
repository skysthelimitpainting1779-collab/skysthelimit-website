// Strips JS/TS line (//) and block (/* */) comments from source text while
// respecting string literals ('...', "...", and `...` including ${}
// template expressions, which are parsed as code).
//
// The internal-link test collects static hrefs from raw component source; a
// commented-out href must not be treated as live navigation (commenting out
// a link should not keep failing the test, and a commented valid link must
// not fake the non-empty coverage guard).
//
// Known limitations: regex literals containing '/' or quotes, and comment
// markers inside them, are not specially handled — none of the scanned
// navigation sources use regex literals today.
export function stripComments(source) {
  const out = [];
  const n = source.length;
  let i = 0;

  function at(text) {
    return source.startsWith(text, i);
  }

  // Parses code until the matching '}' (when inExpression) or EOF. Comments
  // are dropped; everything else — including string and template literals —
  // is copied verbatim (template ${} expressions recurse through here).
  function parseCode(inExpression) {
    while (i < n) {
      if (at('//')) {
        const end = source.indexOf('\n', i);
        i = end === -1 ? n : end; // keep the newline: line numbers stay stable
        continue;
      }
      if (at('/*')) {
        const end = source.indexOf('*/', i + 2);
        // Keep newlines inside the comment so line numbers stay stable.
        const body = end === -1 ? source.slice(i) : source.slice(i, end + 2);
        out.push(body.replace(/[^\n]/g, ''));
        i = end === -1 ? n : end + 2;
        continue;
      }
      const ch = source[i];
      if (ch === "'" || ch === '"') {
        copyQuoted(ch);
        continue;
      }
      if (ch === '`') {
        copyTemplate();
        continue;
      }
      if (inExpression && ch === '{') {
        out.push(ch);
        i += 1;
        parseCode(true); // nested block or object literal
        continue;
      }
      if (inExpression && ch === '}') {
        out.push(ch);
        i += 1;
        return; // closes the enclosing ${} expression
      }
      out.push(ch);
      i += 1;
    }
  }

  function copyQuoted(quote) {
    const start = i;
    i += 1;
    while (i < n) {
      if (source[i] === '\\') {
        i += 2;
        continue;
      }
      if (source[i] === quote) {
        i += 1;
        break;
      }
      i += 1;
    }
    out.push(source.slice(start, i));
  }

  function copyTemplate() {
    let start = i; // opening backtick; literal text copies verbatim
    i += 1;
    while (i < n) {
      const ch = source[i];
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '`') {
        i += 1;
        out.push(source.slice(start, i));
        return;
      }
      if (ch === '$' && source[i + 1] === '{') {
        out.push(source.slice(start, i)); // flush the literal chunk
        out.push('${');
        i += 2;
        parseCode(true); // strips comments inside the expression, stops at '}'
        start = i; // resume the literal after the expression
        continue;
      }
      i += 1;
    }
    out.push(source.slice(start, i)); // unterminated template: copy the rest
  }

  parseCode(false);
  return out.join('');
}
