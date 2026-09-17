// Collects STATIC internal navigation links from component source by walking
// the TypeScript AST — never by regexing raw source text.
//
// "Static" means a string literal in a genuine navigation position:
//   - JSX attributes: <Link href="/x">, <a to="/y">, href={'/x'}, href={`/x`}
//   - data literals:  { href: '/x', label: '...' } object properties and
//                     ['/x', 'label'] array pairs (footer column links)
//
// href="..." text that merely appears INSIDE a string (docs, error messages,
// analytics payloads, JSON blobs) is NOT live navigation and is never
// collected: the walk only visits syntactic positions, so string contents are
// never scanned. Comments are not part of the AST either, but callers still
// pass comment-stripped source (see strip-comments.mjs) to keep the pipeline
// explicit.
//
// Relative hrefs without a leading slash (and without a scheme) are collected
// so they fail loudly: global nav links must be root-relative, otherwise the
// browser resolves them against the current nested route and 404s. Scheme
// hrefs (tel:, mailto:, https:, ...), #anchors, and protocol-relative URLs
// (//host — external URLs, not internal paths) are never collected.
import ts from 'typescript';

const LINK_ATTRIBUTES = new Set(['href', 'to']);
const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function isCollectibleTarget(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (SCHEME_PATTERN.test(value)) return false; // tel:, mailto:, https:, ...
  if (value.startsWith('#')) return false; // in-page anchor
  if (value.startsWith('//')) return false; // protocol-relative: external URL
  return true;
}

// A statically-known string: a string literal, or a template literal with no
// ${...} interpolation. Anything else (identifiers, call expressions,
// interpolated templates) is computed at runtime and out of scope.
function staticString(node) {
  if (!node) return undefined;
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

export function collectStaticInternalLinks(source) {
  const links = new Set();
  const add = (value) => {
    if (isCollectibleTarget(value)) links.add(value);
  };

  const sourceFile = ts.createSourceFile(
    'navigation.tsx',
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );

  const visit = (node) => {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      LINK_ATTRIBUTES.has(node.name.text)
    ) {
      // <Link href="/x">, <a to="/y">, href={'/x'}, href={`/x`}
      const { initializer } = node;
      if (initializer) {
        const value = ts.isJsxExpression(initializer)
          ? staticString(initializer.expression)
          : staticString(initializer);
        if (value !== undefined) add(value);
      }
    } else if (
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      LINK_ATTRIBUTES.has(node.name.text)
    ) {
      // { href: '/x', label: '...' } — data-driven nav arrays
      const value = staticString(node.initializer);
      if (value !== undefined) add(value);
    } else if (
      ts.isArrayLiteralExpression(node) &&
      node.elements.length >= 2
    ) {
      // ['/x', 'label'] — footer column link pairs
      const first = staticString(node.elements[0]);
      const second = staticString(node.elements[1]);
      if (first !== undefined && second !== undefined) add(first);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return [...links];
}
