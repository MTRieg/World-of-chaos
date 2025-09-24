const fs = require('fs');
const path = require('path');

// Input file paths
const ALLIANCES_FILE = 'alliances.json'; // contains `name` and `alliance`
const MAPPING_FILE = 'mappings_template.json';    // contains `index`, `name`, `mapping`

// Load JSON data
const alliancesData = JSON.parse(fs.readFileSync(ALLIANCES_FILE, 'utf8'));
const mappingsData = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));

// Create a map: country name => alliance (trimmed)
const allianceMap = {};
for (const entry of alliancesData) {
    allianceMap[entry.name] = entry.alliance.trim(); // Remove accidental spaces
}

// Group countries by alliance name (excluding empty alliances)
const allianceGroups = {};
for (const name in allianceMap) {
    const alliance = allianceMap[name];
    if (alliance !== "") {
        if (!allianceGroups[alliance]) {
            allianceGroups[alliance] = [];
        }
        allianceGroups[alliance].push(name);
    }
}

// Create a name -> index lookup from the mappings file
const nameToIndex = {};
for (const country of mappingsData) {
    nameToIndex[country.name] = country.index;
}

// For each alliance group, set mutual mappings to 3
for (const group of Object.values(allianceGroups)) {
    for (let i = 0; i < group.length; i++) {
        for (let j = 0; j < group.length; j++) {
            if (i === j) continue; // Skip self

            const nameA = group[i];
            const nameB = group[j];

            const indexA = nameToIndex[nameA];
            const indexB = nameToIndex[nameB];

            if (indexA !== undefined && indexB !== undefined) {
                mappingsData[indexA].mapping[indexB] = 3;
                mappingsData[indexB].mapping[indexA] = 3;
            }
        }
    }
}

// Write the updated mapping data to file
fs.writeFileSync('mappings.json', JSON.stringify(mappingsData, null, 2));
console.log('Updated mappings saved to updated-mappings.json');