const biggerIslands = require('./BiggerIslands.js');
const colorIndexing = require('./colorIndexing.js');
const SVG_splitter = require('./SVG_splitter.js');
const xpath = require('xpath');
const sharp = require('sharp');
const fs = require('fs');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

// Function to load an SVG file and parse it into a DOM
function loadDOM(filename = 'input.svg') {
  const svgString = fs.readFileSync(filename, 'utf8');  // Read file as string
  const dom = new DOMParser().parseFromString(svgString, 'image/svg+xml');  // Parse into DOM
  return dom;
}

// Main processing function, now marked as async
async function processSVG(outline_fn, no_outline_fn, clickable_fn, overlay_fn, input_filename = 'input.svg') {

  // === Load and clone SVG DOM ===
  const inputDoc = loadDOM(input_filename);

  // Clone DOMs for modification
  let outlineDoc = new DOMParser().parseFromString(new XMLSerializer().serializeToString(inputDoc), 'image/svg+xml');
  let noOutlineDoc = new DOMParser().parseFromString(new XMLSerializer().serializeToString(inputDoc), 'image/svg+xml');

  // Process the SVG DOMs concurrently using setImmediate wrapped in Promises
  await Promise.all([
    new Promise(resolve => setImmediate(() => {
      outlineDoc = SVG_splitter.createOutlineSVG(outlineDoc);
      resolve();
    })),
    new Promise(resolve => setImmediate(() => {
      noOutlineDoc = SVG_splitter.createNoOutlineSVG(noOutlineDoc);
      resolve();
    }))
  ]);

  console.log('Separation of Lines successful\n');

  // Serialize the modified DOMs to SVG strings
  const outlineSVG = new XMLSerializer().serializeToString(outlineDoc);
  const noOutlineSVG = new XMLSerializer().serializeToString(noOutlineDoc);

  // Convert SVGs to PNG using sharp
  await Promise.all([
    sharp(Buffer.from(outlineSVG, 'utf-8')).png().toFile(outline_fn),
    sharp(Buffer.from(noOutlineSVG, 'utf-8')).png().toFile(no_outline_fn)
  ]);

  console.log('PNG conversion complete!\n');

  // === Generate overlay.png ===
  try {
    const overlayIndexed = await colorIndexing.indexColors(noOutlineSVG, "pallets.json", 'none');
    await sharp(Buffer.from(overlayIndexed)).png().toFile(overlay_fn);
    console.log('overlay.png saved!');
  } catch (err) {
    console.error('Error during overlay.png generation:', err);
  }

  // === Generate clickable.png ===
  try {
    const SVGislandsExpanded = biggerIslands.expandIslands(noOutlineDoc);
    const clickableIndexed = await colorIndexing.indexColors(SVGislandsExpanded, "pallets.json", '#ffffff');
    await sharp(Buffer.from(clickableIndexed)).png().toFile(clickable_fn);
    console.log('clickable.png saved!');
  } catch (err) {
    console.error('Error during clickable.png generation:', err);
  }
}

// Export as async so it can be awaited from elsewhere
module.exports = { processSVG };


//processSVG();

module.exports = {processSVG};
