function isHtmlSpace(character) {
  return (
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\f' ||
    character === '\r'
  );
}

function isTagBoundary(character) {
  return (
    character === undefined ||
    isHtmlSpace(character) ||
    character === '/' ||
    character === '>'
  );
}

function asciiCode(character) {
  const code = character?.charCodeAt(0);
  return code >= 65 && code <= 90 ? code + 32 : code;
}

function matchesAsciiAt(source, index, marker) {
  if (index + marker.length > source.length) return false;
  for (let offset = 0; offset < marker.length; offset += 1) {
    if (asciiCode(source[index + offset]) !== marker.charCodeAt(offset)) {
      return false;
    }
  }
  return true;
}

function beginsMarkup(character) {
  const code = asciiCode(character);
  return (
    (code >= 97 && code <= 122) ||
    character === '/' ||
    character === '!' ||
    character === '?'
  );
}

function beginsOpeningTag(character) {
  const code = asciiCode(character);
  return code >= 97 && code <= 122;
}

function findTagEnd(source, start) {
  let state = 'beforeAttributeName';
  let quote = null;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (state === 'attributeValueQuoted') {
      if (character === quote) quote = null;
      if (quote === null) state = 'afterAttributeValueQuoted';
      continue;
    }
    if (character === '>') return index;

    if (state === 'beforeAttributeName') {
      if (isHtmlSpace(character) || character === '/') continue;
      state = 'attributeName';
      continue;
    }
    if (state === 'attributeName') {
      if (isHtmlSpace(character)) {
        state = 'afterAttributeName';
      } else if (character === '=') {
        state = 'beforeAttributeValue';
      }
      continue;
    }
    if (state === 'afterAttributeName') {
      if (isHtmlSpace(character) || character === '/') continue;
      state = character === '=' ? 'beforeAttributeValue' : 'attributeName';
      continue;
    }
    if (state === 'beforeAttributeValue') {
      if (isHtmlSpace(character)) continue;
      if (character === '"' || character === "'") {
        quote = character;
        state = 'attributeValueQuoted';
      } else {
        state = 'attributeValueUnquoted';
      }
      continue;
    }
    if (state === 'attributeValueUnquoted') {
      if (isHtmlSpace(character)) state = 'beforeAttributeName';
      continue;
    }
    if (state === 'afterAttributeValueQuoted') {
      if (isHtmlSpace(character) || character === '/') {
        state = 'beforeAttributeName';
      } else {
        state = 'attributeName';
      }
    }
  }
  return -1;
}

function findCommentEnd(source, start) {
  if (source.startsWith('<!-->', start)) return start + 5;
  if (source.startsWith('<!--->', start)) return start + 6;
  const standardEnd = source.indexOf('-->', start + 4);
  const bangEnd = source.indexOf('--!>', start + 4);
  if (standardEnd === -1) {
    return bangEnd === -1 ? -1 : bangEnd + 4;
  }
  if (bangEnd === -1) return standardEnd + 3;
  return Math.min(standardEnd + 3, bangEnd + 4);
}

function isReconstructableTagPrefix(source, start, end, tagName) {
  const length = end - start;
  if (length <= 0 || length > tagName.length) return false;
  for (let offset = 0; offset < length; offset += 1) {
    if (asciiCode(source[start + offset]) !== tagName.charCodeAt(offset)) {
      return false;
    }
  }
  return true;
}

function findTagStart(source, marker, from) {
  let state = 'data';
  let quote = null;
  let tagNameStart = -1;
  let tagNameCanReconstruct = false;
  const tagName = marker.slice(1);
  for (let start = from; start < source.length; start += 1) {
    const character = source[start];
    if (state === 'attributeValueQuoted') {
      if (character === quote) {
        quote = null;
        state = 'afterAttributeValueQuoted';
      }
      continue;
    }
    if (character === '<' && (state === 'data' || state === 'tagName')) {
      if (state === 'data' && source.startsWith('<!--', start)) {
        const commentEnd = findCommentEnd(source, start);
        if (commentEnd === -1) return -1;
        start = commentEnd - 1;
        continue;
      }
      const markerMatches =
        matchesAsciiAt(source, start, marker) &&
        isTagBoundary(source[start + marker.length]);
      if (
        markerMatches &&
        (
          state === 'data' ||
          (
            tagNameCanReconstruct &&
            isReconstructableTagPrefix(
              source,
              tagNameStart,
              start,
              tagName,
            )
          )
        )
      ) {
        return start;
      }
      if (beginsMarkup(source[start + 1])) {
        tagNameCanReconstruct =
          beginsOpeningTag(source[start + 1]) &&
          (
            state === 'data' ||
            (
              tagNameCanReconstruct &&
              isReconstructableTagPrefix(
                source,
                tagNameStart,
                start,
                tagName,
              )
            )
          );
        state = 'tagName';
        tagNameStart = start + (source[start + 1] === '/' ? 2 : 1);
      }
      continue;
    }
    if (state === 'data') continue;
    if (character === '>') {
      state = 'data';
      tagNameStart = -1;
      tagNameCanReconstruct = false;
      continue;
    }
    if (state === 'tagName') {
      if (isHtmlSpace(character)) state = 'beforeAttributeName';
      continue;
    }
    if (state === 'beforeAttributeName') {
      if (isHtmlSpace(character) || character === '/') continue;
      state = 'attributeName';
      continue;
    }
    if (state === 'attributeName') {
      if (isHtmlSpace(character)) {
        state = 'afterAttributeName';
      } else if (character === '=') {
        state = 'beforeAttributeValue';
      }
      continue;
    }
    if (state === 'afterAttributeName') {
      if (isHtmlSpace(character) || character === '/') continue;
      state = character === '=' ? 'beforeAttributeValue' : 'attributeName';
      continue;
    }
    if (state === 'beforeAttributeValue') {
      if (isHtmlSpace(character)) continue;
      if (character === '"' || character === "'") {
        quote = character;
        state = 'attributeValueQuoted';
      } else {
        state = 'attributeValueUnquoted';
      }
      continue;
    }
    if (state === 'attributeValueUnquoted') {
      if (isHtmlSpace(character)) state = 'beforeAttributeName';
      continue;
    }
    if (state === 'afterAttributeValueQuoted') {
      if (isHtmlSpace(character) || character === '/') {
        state = 'beforeAttributeName';
      } else {
        state = 'attributeName';
      }
    }
  }
  return -1;
}

function findRawTextClosingTag(source, marker, from) {
  for (let start = from; start < source.length; start += 1) {
    if (
      source[start] === '<' &&
      matchesAsciiAt(source, start, marker) &&
      isTagBoundary(source[start + marker.length])
    ) {
      return start;
    }
  }
  return -1;
}

function isSelfClosingTag(source, tagEnd) {
  let index = tagEnd - 1;
  while (index >= 0 && isHtmlSpace(source[index])) index -= 1;
  return source[index] === '/';
}

function findCompleteTagBlocks(source, tagName) {
  const openMarker = `<${tagName}`;
  const closeMarker = `</${tagName}`;
  const blocks = [];
  let searchFrom = 0;
  let knownNoCloseFrom = null;

  while (searchFrom < source.length) {
    const start = findTagStart(source, openMarker, searchFrom);
    if (start === -1) break;
    const openEnd = findTagEnd(source, start + openMarker.length);
    if (openEnd === -1) break;

    let closeStart = -1;
    if (knownNoCloseFrom === null || openEnd + 1 < knownNoCloseFrom) {
      closeStart = findRawTextClosingTag(
        source,
        closeMarker,
        openEnd + 1,
      );
      if (closeStart === -1) knownNoCloseFrom = openEnd + 1;
    }
    if (closeStart === -1) {
      if (isSelfClosingTag(source, openEnd)) {
        blocks.push({ start, end: openEnd + 1 });
        searchFrom = openEnd + 1;
        continue;
      }
      break;
    }

    const closeEnd = findTagEnd(source, closeStart + closeMarker.length);
    if (closeEnd === -1) break;
    blocks.push({ start, end: closeEnd + 1 });
    searchFrom = closeEnd + 1;
  }
  return blocks;
}

function findCompleteComments(source) {
  const blocks = [];
  let searchFrom = 0;
  while (searchFrom < source.length) {
    const start = findCommentStart(source, searchFrom);
    if (start === -1) break;
    const end = findCommentEnd(source, start);
    if (end === -1) break;
    blocks.push({ start, end });
    searchFrom = end;
  }
  return blocks;
}

function findCommentStart(source, from) {
  let state = 'data';
  let quote = null;
  for (let start = from; start < source.length; start += 1) {
    const character = source[start];
    if (state === 'attributeValueQuoted') {
      if (character === quote) {
        quote = null;
        state = 'afterAttributeValueQuoted';
      }
      continue;
    }
    if (character === '<' && (state === 'data' || state === 'tagName')) {
      if (state === 'data' && source.startsWith('<!--', start)) return start;
      if (state === 'data' && beginsMarkup(source[start + 1])) {
        state = 'tagName';
      }
      continue;
    }
    if (state === 'data') continue;
    if (character === '>') {
      state = 'data';
      continue;
    }
    if (state === 'tagName') {
      if (isHtmlSpace(character)) state = 'beforeAttributeName';
      continue;
    }
    if (state === 'beforeAttributeName') {
      if (isHtmlSpace(character) || character === '/') continue;
      state = 'attributeName';
      continue;
    }
    if (state === 'attributeName') {
      if (isHtmlSpace(character)) {
        state = 'afterAttributeName';
      } else if (character === '=') {
        state = 'beforeAttributeValue';
      }
      continue;
    }
    if (state === 'afterAttributeName') {
      if (isHtmlSpace(character) || character === '/') continue;
      state = character === '=' ? 'beforeAttributeValue' : 'attributeName';
      continue;
    }
    if (state === 'beforeAttributeValue') {
      if (isHtmlSpace(character)) continue;
      if (character === '"' || character === "'") {
        quote = character;
        state = 'attributeValueQuoted';
      } else {
        state = 'attributeValueUnquoted';
      }
      continue;
    }
    if (state === 'attributeValueUnquoted') {
      if (isHtmlSpace(character)) state = 'beforeAttributeName';
      continue;
    }
    if (state === 'afterAttributeValueQuoted') {
      if (isHtmlSpace(character) || character === '/') {
        state = 'beforeAttributeName';
      } else {
        state = 'attributeName';
      }
    }
  }
  return -1;
}

function removeBlocks(source, candidates) {
  if (candidates.length === 0) return source;
  candidates.sort(
    (left, right) => left.start - right.start || right.end - left.end,
  );

  const blocks = [];
  for (const candidate of candidates) {
    const previous = blocks.at(-1);
    if (previous && candidate.start < previous.end) continue;
    blocks.push(candidate);
  }

  const chunks = [];
  let cursor = 0;
  for (const block of blocks) {
    chunks.push(source.slice(cursor, block.start));
    cursor = block.end;
  }
  chunks.push(source.slice(cursor));
  return chunks.join('');
}

export function stripHtmlBlocks(
  value,
  { comments = false, tags = [] } = {},
) {
  let source = String(value ?? '');
  const maxIterations = 32;
  const tagNames = [...new Set(tags.map((tag) => String(tag).toLowerCase()))];
  if (tagNames.some((tag) => !/^[a-z][a-z0-9:-]*$/.test(tag))) {
    throw new TypeError('HTML tag names must be literal names.');
  }

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const candidates = tagNames.flatMap((tag) =>
      findCompleteTagBlocks(source, tag),
    );
    if (comments) {
      candidates.push(...findCompleteComments(source));
    }
    if (candidates.length === 0) return source;

    source = removeBlocks(source, candidates);
  }

  throw new Error('HTML filtering exceeded its reconstruction-pass limit.');
}
