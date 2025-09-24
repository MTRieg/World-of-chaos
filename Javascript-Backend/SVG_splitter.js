const fs = require('fs');
const xpath = require('xpath');
const { XMLSerializer } = require('@xmldom/xmldom');

// Utility functions
function isBlack(value) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === '#000' ||
    normalized === '#000000' ||
    normalized === 'black' ||
    normalized === 'rgb(0,0,0)'
  );
}

function extractStyleValue(style, property) {
  const regex = new RegExp(`${property}\\s*:\\s*([^;]+)`, 'i');
  const match = style?.match(regex);
  return match ? match[1].trim() : null;
}

function updateStyleProperty(style, property, newValue) {
  if (!style) return `${property}:${newValue}`;
  const parts = style.split(';').map(p => p.trim()).filter(Boolean);
  let found = false;
  const updated = parts.map(p => {
    if (p.startsWith(`${property}:`)) {
      found = true;
      return `${property}:${newValue}`;
    }
    return p;
  });
  if (!found) updated.push(`${property}:${newValue}`);
  return updated.join(';');
}

// Outline version
function processForOutline(el) {
  if (el.nodeName.toLowerCase() === 'text') {
    // For text, make sure it’s fully visible
    let style = el.getAttribute('style');
    style = updateStyleProperty(style, 'fill-opacity', '1');
    style = updateStyleProperty(style, 'fill', 'black'); // optional: force text color to black
    if (style !== null) {
      el.setAttribute('style', style);
    }
    return; // Skip further processing for text
  }

  if (el.hasAttribute('fill-opacity')) {
    el.setAttribute('fill-opacity', '0');
  }

  let style = el.getAttribute('style');
  const styleFillOpacity = extractStyleValue(style, 'fill-opacity');
  if (styleFillOpacity !== null) {
    style = updateStyleProperty(style, 'fill-opacity', '0');
  }

  const strokeAttr = el.getAttribute('stroke');
  const strokeStyle = extractStyleValue(style, 'stroke');

  if (strokeAttr && !isBlack(strokeAttr)) {
    el.setAttribute('stroke', 'transparent');
  }

  if (strokeStyle && !isBlack(strokeStyle)) {
    style = updateStyleProperty(style, 'stroke', 'transparent');
  }

  if (style !== null) {
    el.setAttribute('style', style);
  }
}

function createOutlineSVG(doc) {
  const elements = xpath.select('//*', doc);
  for (const el of elements) {
    if (el.nodeType === 1) {
      processForOutline(el);
    }
  }
  
  fs.writeFileSync('outline.svg', new XMLSerializer().serializeToString(doc));

  return(doc);
}

// No-outline version
function removeBlackStrokes(el) {
  const strokeAttr = el.getAttribute('stroke');
  if (strokeAttr && isBlack(strokeAttr)) {
    el.removeAttribute('stroke');
  }

  let style = el.getAttribute('style');
  if (style) {
    const strokeStyle = extractStyleValue(style, 'stroke');
    if (strokeStyle && isBlack(strokeStyle)) {
      const newStyle = style
        .split(';')
        .map(part => part.trim())
        .filter(part => !part.startsWith('stroke'))
        .join(';');
      if (newStyle) {
        el.setAttribute('style', newStyle);
      } else {
        el.removeAttribute('style');
      }
    }
  }
}

function createNoOutlineSVG(doc) {
  const elements = xpath.select('//*', doc);
  for (const el of elements) {
    if (el.nodeType !== 1) continue;

    if (el.tagName === 'text') {
      el.parentNode.removeChild(el);
    } else {
      removeBlackStrokes(el);
    }
  }
  fs.writeFileSync('no-outline.svg', new XMLSerializer().serializeToString(doc));
  return(doc);
}


module.exports = {
  createOutlineSVG, createNoOutlineSVG
}
