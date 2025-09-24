
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const xpath = require('xpath');

// Helper: Namespace constants
const INKSCAPE = 'http://www.inkscape.org/namespaces/inkscape';

// Setup XPath selector with namespace mapping
const select = xpath.useNamespaces({
  inkscape: INKSCAPE,
  svg: 'http://www.w3.org/2000/svg',
  inkscape: 'http://www.inkscape.org/namespaces/inkscape',
});

// Helper: Serialize DOM back to string
const dom = new XMLSerializer();


function hasFill(el) {
  // Check the 'fill' attribute directly
  let fill = el.getAttribute('fill');

  // Check if 'style' contains a 'fill' rule
  const styleAttr = el.getAttribute('style') || '';
  const styleRules = styleAttr.split(';');

  for (let rule of styleRules) {
    rule = rule.trim();
    if (rule.startsWith('fill:')) {
      const value = rule.split(':')[1].trim();
      if (value.toLowerCase() !== 'none') {
        return true; // Found a fill in style that is not 'none'
      } else {
        return false; // Found a fill in style that is 'none'
      }
    }
  }

  // If no fill in style, fallback to 'fill' attribute
  if (fill && fill.toLowerCase() !== 'none') {
    return true;
  }

  // No fill found
  return false;
}

function expandIslands(document) {
  // 1️⃣ Collect Island Fills labels
  const islandFillsGroup = select('//svg:g[@inkscape:label="Island Fills"]', document)[0];
  const islandFillsLabels = new Set();

  if (islandFillsGroup) {
    // Iterate over the <g> children
    const islandChildren = select('./*', islandFillsGroup);
    islandChildren.forEach(child => {
      const label = child.getAttributeNS(INKSCAPE, 'label');
      if (label){
        islandFillsLabels.add(label);
      } 
    });
  }

  // 2️⃣ Update SC markers circles
const scMarkersGroup = select('//svg:g[@inkscape:label="SC markers"]', document)[0];

if (scMarkersGroup) {
  // Step 1: Get direct children of SC markers group
  const markerChildren = select('./*', scMarkersGroup);

  // Step 2: For each child (likely a group), find its direct children (i.e., grandchildren of scMarkersGroup)
  markerChildren.forEach(child => {
    const label = child.getAttribute('inkscape:label');

    if (label) {
      if(islandFillsLabels.has(label)){
        const grandchildren = select('./*', child); // These are the grandchildren
        // Step 3: Loop over each grandchild
        grandchildren.forEach(grandchild => {
            // If the element has a fill and is not "none", and is a circle, adjust its radius
            if (hasFill(grandchild)) {
                if (grandchild.tagName && grandchild.tagName.toLowerCase() === 'circle') {
                grandchild.setAttribute('r', '15');
                }
            }
        })
      }
    }
  });
  }

  // Return the modified SVG as a string
  return dom.serializeToString(document);
}

// Export the function for use in other scripts
module.exports = { expandIslands };
