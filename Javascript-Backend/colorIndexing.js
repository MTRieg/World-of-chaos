// Import required modules
const fs = require('fs');
const path = require('path');
const tinycolor = require('tinycolor2');

// Helper: Convert [r, g, b] array to hex string like "#rrggbb"
function rgbArrayToHex(rgb) {
  return tinycolor({ r: rgb[0], g: rgb[1], b: rgb[2] }).toHexString().toLowerCase();
}

// Main function
async function indexColors(svgContent, palettePath, otherFillString) {

  // Read and parse the palette file (expects an array of [r, g, b] arrays)
  const paletteRaw = fs.readFileSync(palettePath, 'utf-8');
  const paletteArray = JSON.parse(paletteRaw);

  // Convert palette entries to hex strings
  const palette = paletteArray.map(rgb => rgbArrayToHex(rgb));

  // Regex to find 'fill' properties in CSS styles (e.g., fill: rgb(255,0,0) or fill: #ff0000)
  const fillRegex = /fill\s*:\s*([^;"]+)/gi;

  // Process all fill values
  svgContent = svgContent.replace(fillRegex, (match, colorValue) => {
    const original = colorValue.trim().toLowerCase();

    // Skip 'none' or 'transparent' (optional)
    if (original === 'none' || original === 'transparent') {
      return match;
    }

    // Normalize color to hex for comparison
    const colorHex = tinycolor(original).toHexString().toLowerCase();

    // Find the index in the palette
    const index = palette.findIndex(p => p === colorHex);

    if (index === -1) {
      // Not found in palette -> replace with white
      return 'fill: ' + otherFillString;
;
    } else {
      // Found in palette -> replace with #00xxxx (4 hex digits)
      const hexIndex = index.toString(16).padStart(4, '0');
      return `fill: #00${hexIndex}`;
    }
  });

  
  // --- NEW CODE FOR 'stroke' PROPERTY ---

  // Regex to find 'stroke' properties in CSS styles (e.g., stroke: rgb(255,0,0) or stroke: #ff0000)
  const strokeRegex = /stroke\s*:\s*([^;"]+)/gi;

  // Process all stroke values similarly to fills
  svgContent = svgContent.replace(strokeRegex, (match, colorValue) => {
    const original = colorValue.trim().toLowerCase();

    // Skip 'none' or 'transparent'
    if (original === 'none' || original === 'transparent') {
      return match;
    }

    // Normalize color to hex
    const colorHex = tinycolor(original).toHexString().toLowerCase();

    // Find the index in the palette
    const index = palette.findIndex(p => p === colorHex);

    if (index === -1) {
      // Not found in palette -> remove stroke
      return 'stroke: none';
    } else {
      // Found in palette -> replace with #00xxxx (4 hex digits)
      const hexIndex = index.toString(16).padStart(4, '0');
      return `stroke: #00${hexIndex}`;
    }
  });
  

  // -----------------------------------

  // Write output to indexed.svg
  fs.writeFileSync('indexed.svg', svgContent, 'utf8');

  return svgContent;
};

module.exports = {indexColors};
