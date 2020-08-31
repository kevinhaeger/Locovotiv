let fs = require('fs');

let json_file = 'MoCo_precincts.geojson';
let geoJson = JSON.parse(fs.readFileSync(json_file));

function precinctAsString(num) {
	let str = String(num);
	if (str.length == 5) {
		return str.substring(0,2) + '.' + str.substring(3);
	} else {
		return str.substring(0,1) + '.' + str.substring(2);
	}
}

for (i in geoJson.features) {
	let feature = geoJson.features[i];
	feature.type = 'Feature';
	feature.properties.PRECINCT = precinctAsString(feature.properties.PRECINCT);
	
	// Remove unused data
	delete feature.properties.fid;
	delete feature.properties.INTPTLAT10;
	delete feature.properties.INTPTLON10;
	delete feature.properties.STATEFP10;
	delete feature.properties.COUNTYFP10;
	delete feature.properties.COUNTY_NAME;
}

fs.writeFile(json_file, JSON.stringify(geoJson), (err) => {
	if (err) console.log(err);
});