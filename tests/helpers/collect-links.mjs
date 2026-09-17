// Collects STATIC internal navigation links from component source.
//
// "Static" means a string literal in the component source: data-array
// entries, static href attributes, and static JSX-expression literals
// (href={'/x'}, href={`/x`} — a literal $ in the path is fine; only
// ${...} interpolation is out of scope). Hrefs computed at runtime
// (interpolated template literals, values derived from request data) cannot
// be validated statically and are out of scope by design. Relative hrefs
// without a leading slash (and without a scheme) are collected so they fail
// loudly: global nav links must be root-relative, otherwise the browser
// resolves them against the current nested route and 404s.
//
// Callers must pass comment-stripped source (see strip-comments.mjs): an
// href inside a line or block comment is not live navigation.
const templateLiteralPattern = /\bhref\s*=\s*\{\s*`(\/[^`]*)`\s*\}/g;
const relativeTemplatePattern = /\bhref\s*=\s*\{\s*`((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^`]*)`\s*\}/g;
const interpolatedPatterns = new Set([templateLiteralPattern, relativeTemplatePattern]);

export function collectStaticInternalLinks(source) {
  const links = new Set();
  const patterns = [
    /\bhref\s*=\s*["'](\/[^"']*)["']/g,
    /\bhref\s*=\s*\{\s*["'](\/[^"']*)["']\s*\}/g,
    templateLiteralPattern,
    /\bhref\s*:\s*["'](\/[^"']*)["']/g,
    /\[\s*["'](\/[^"']*)["']\s*,\s*["'][^"']+["']\s*\]/g,
    // Relative hrefs (no leading slash, no scheme, no anchor): the same
    // syntactic forms as above, collected so they are reported broken
    // instead of silently ignored.
    /\bhref\s*=\s*["']((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^"']*)["']/g,
    /\bhref\s*=\s*\{\s*["']((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^"']*)["']\s*\}/g,
    relativeTemplatePattern,
    /\bhref\s*:\s*["']((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^"']*)["']/g,
    /\[\s*["']((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^"']*)["']\s*,\s*["'][^"']+["']\s*\]/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      // Interpolated template literals are not statically resolvable.
      if (interpolatedPatterns.has(pattern) && match[1].includes('${')) continue;
      links.add(match[1]);
    }
  }

  return [...links];
}
