const MOCO_CENTER = [39.1329468,-77.1980853];
const DISTRICT_COLOR = {1: 'Aquamarine', 2: 'Salmon', 3: 'HotPink', 4: 'Violet', 5: 'YellowGreen', 6: 'RoyalBlue', 7: 'Teal', 8: 'Purple', 9: 'Yellow', 10: 'Crimson', 11: 'RebeccaPurple', 12: 'Navy', 13: 'Gold'};
const HIGHLIGHTED_STYLE_1 = {color: 'yellow', weight: 4};
const HIGHLIGHTED_STYLE_2 = {color: 'white', weight: 2};
const UNHIGHLIGHTED_STYLE = {color: 'black', weight: 0.5};
const GRADIENTS = {
	BLUE_RED_GRADIENT: ['#2171b5','#6baed6','#bdd7e7','#eff3ff','#fee5d9','#fcae91','#fb6a4a','#cb181d'],
	PURPLE_GRADIENT: ["#4a1486", "#6a51a3", "#807dba", "#9e9ac8", "#bcbddc", "#dadaeb", "#efedf5", "#fcfbfd"],
	BLUE_GRADIENT: ["#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#deebf7", "#f7fbff"],
	RED_GRADIENT: ["#99000d", "#cb181d", "#ef3b2c", "#fb6a4a", "#fc9272", "#fcbba1", "#fee0d2", "#fff5f0"]
}

let map;						// A Leaflet map
let geoJson;					// A GeoJson storing polygon data
let electionData = [];			// An array of records on precincts
let geoJsonLayer;				// A Leaflet layer that draws polgyons stored
								// in a GeoJson		
let showDistrictsData;			// A boolean that decides whether user action
								// will display precinct or district level data								
let highlightedPrecinct;		// This variable references the highlighted
								// precinct on the map. Only one precinct can
								// be highlighted at a time.

let legend;
let setting;


// LOADS DATA FROM FILE

// Initialize the variable: electionData
// Load the contents of the csv file into an array
function loadElectionData(csvName) {
	console.time('Election data loaded')
	fs.createReadStream(csvName)
		.pipe(csv())
		.on('data', (data) => electionData.push(data));
	console.timeEnd('Election data loaded');
}

// Helper function that lookup a row in electionData
// Uses a row's precinct value as the primary key
function getRow(precinct) {
	for (row of electionData) {
		// '\ufeff' HAS to prepend 'Precinct'
		// It is the first character of the csv file
		if (row['\ufeffPrecinct'] == precinct) {
			return row;
		}
	}
	return undefined;
}

// Loads election data from file
loadElectionData('./resources/app/sanitized_election_data_Rebecca.csv');

// Initialize the variable: geoJson
// Load GeoJson into memory
function loadGeoJson(geoJsonName) {
	console.time('GeoJson loaded');
	geoJson = JSON.parse(fs.readFileSync(geoJsonName));
	console.timeEnd('GeoJson loaded');
}

// Loads polygon data from file
loadGeoJson('./resources/app/MoCo_precincts.geojson');

function loadSetting(jsonName) {
	setting = JSON.parse(fs.readFileSync(jsonName));
}

loadSetting('./resources/app/setting.json');


// INITIALIZE LEAFLET MAP

// Create the map and center the view on MoCo
map = L.map('map');
map.setView(center=MOCO_CENTER,zoom=11);

// Configure the map to do nothing when double clicked on
map.off('dblclick');

// Add the tile layer to map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// CREATING THE POLYGON LAYER

geoJsonLayer = L.geoJson(geoJson, {
	
	style: function (_) {
		return {
			stroke: true,
			color: 'black',
			weight: 0.5,
			fillOpacity: 0.8,
		};
	},
	
	onEachFeature: function (feature, polygon) {
		polygon.on({
			click: precinctClicked,
			dblclick: precinctDblClicked,
			mouseover: mousedOverPrecinct,
			mouseout: mousedOutPrecinct,
		});
	}
	
});

geoJsonLayer.addTo(map);


// POLYGON EVENT HANDLERS

function decimal2Percent(decimal) {
	if (decimal == 'N/D')
		return decimal;
	else
		return Math.round(decimal * 10000)/100 + '%';
}

function populateInfoBox(precinct) {
	let infoBox = document.getElementById('infoBox');
	
	let row = getRow(precinct);
	
	infoBox.innerHTML =`
	<h4 class='mx-auto'>Precinct ${precinct}</h4>
	<table class='summary-table'>
		<tr>
			<td >Smondrowski Votes 2012</td>
			<td>${row['Rebecca Smondrowski 2012']}</td>
		</tr>
		<tr>
			<td >Opponents Votes 2012</td>
			<td>${row['Opponent 2012']}</td>
		</tr>
		<tr>
			<td >Smondrowski Share of Votes 2012</td>
			<td>${decimal2Percent(row['Rebecca Smondrowski Percentage 2012'])}</td>
		</tr>
		<tr>
			<td >Opponents Share of Votes 2012</td>
			<td>${decimal2Percent(row['Opponent Percentage 2012'])}</td>
		</tr>
		<tr>
			<td >Voter Turnout 2012</td>
			<td>${row['2012 Total Number']}</td>
		</tr>
		<tr>
			<td >Smondrowski Votes 2016</td>
			<td>${row['Rebecca Smondrowski 2016']}</td>
		</tr>
		<tr>
			<td >Opponents Votes 2016</td>
			<td>${row['Opponent 2016']}</td>
		</tr>
		<tr>
			<td >Smondrowski Share of Votes 2016</td>
			<td>${decimal2Percent(row['Rebecca Smondrowski Percentage 2016'])}</td>
		</tr>
		<tr>
			<td >Opponents Share of Votes 2016</td>
			<td>${decimal2Percent(row['Opponent Percentage 2016'])}</td>
		</tr>
		<tr>
			<td >Voter Turnout 2016</td>
			<td>${row['2016 Total Number']}</td>
		</tr>
	</table>
	`;
}

// Helper function that remove the highlight effect from the currently
// highlighted precinct
function unhighlightPrecinct() {
	if (highlightedPrecinct) {
		highlightedPrecinct.setStyle(UNHIGHLIGHTED_STYLE);
		highlightedPrecinct = undefined;
	}
}

function precinctClicked(e) {
	let clickedLayer = e.target;
	
	let feature = clickedLayer.feature;

	if (!showDistrictsData) {
		if (!highlightedPrecinct) {
			clickedLayer.setStyle(HIGHLIGHTED_STYLE_1);
			highlightedPrecinct = clickedLayer;
			
			clickedLayer.bringToFront();
			
		} else if (highlightedPrecinct == clickedLayer) {
			highlightedPrecinct.setStyle(UNHIGHLIGHTED_STYLE);
			highlightedPrecinct = undefined;
			
		} else {
			highlightedPrecinct.setStyle(UNHIGHLIGHTED_STYLE);
			clickedLayer.setStyle(HIGHLIGHTED_STYLE_1);
			highlightedPrecinct = clickedLayer;
			
			populateInfoBox(feature.properties.PRECINCT);
			clickedLayer.bringToFront();
		}
	}
}

function precinctDblClicked(e) {
	let clickedLayer = e.target;
	
	let feature = clickedLayer.feature;
	
	if (!showDistrictsData) {
		map.setView(clickedLayer.getCenter());
		
		clickedLayer.bringToFront();
		
		if (!highlightedPrecinct) {
			clickedLayer.setStyle(HIGHLIGHTED_STYLE_1);
			highlightedPrecinct = clickedLayer;
			
		} else if (highlightedPrecinct != clickedLayer) {
			highlightedPrecinct.setStyle(UNHIGHLIGHTED_STYLE);
			clickedLayer.setStyle(HIGHLIGHTED_STYLE_1);
			highlightedPrecinct = clickedLayer;
			
			populateInfoBox(feature.properties.PRECINCT);
		}
	}
}

function mousedOverPrecinct(e) {
	let mousedOverLayer = e.target;
	
	let feature = mousedOverLayer.feature;
	
	if (!showDistrictsData) {
		if (mousedOverLayer != highlightedPrecinct) {
			mousedOverLayer.setStyle(HIGHLIGHTED_STYLE_2);
			mousedOverLayer.bringToFront();
			
			if (highlightedPrecinct)
				highlightedPrecinct.bringToFront();
		}
		
		if (!highlightedPrecinct)
			populateInfoBox(feature.properties.PRECINCT);
	}
}

function mousedOutPrecinct(e) {
		let mousedOutLayer = e.target;
	
	if (!showDistrictsData) {
		if (mousedOutLayer != highlightedPrecinct) {
			mousedOutLayer.setStyle(UNHIGHLIGHTED_STYLE);
		}
	}
}


// FUNCTIONS THAT CHANGE WHAT'S DISPLAYED

function getColor(value, columnName) {
	let cutoffs = setting[columnName].cutoffs;
	let gradient = GRADIENTS[setting[columnName].gradientName];
	
	let i;
	for (i = 0; i < cutoffs.length; i++) {
		if (value > cutoffs[i])
			return gradient[i];
	}
	return gradient[i];
}

function createLegend(columnName) {
	let cutoffs = setting[columnName].cutoffs;
	
	legend = new L.control({position: 'bottomright'});
	
	legend.onAdd = function (map) {
		let div = L.DomUtil.create('div', 'info legend');
		
		div.innerHTML +=
			'<i style="background:' + 
			getColor(Number.POSITIVE_INFINITY, columnName) + 
			'"></i> &gt; ' + cutoffs[0] + '<br>';
			
		for (let i = 1; i < cutoffs.length; i++) {
			div.innerHTML +=
				'<i style="background:' + 
				getColor(cutoffs[i]+0.001, columnName) +
				'"></i> ' + cutoffs[i] + ' ~ ' + cutoffs[i-1] + '<br>';
		}
		
		div.innerHTML +=
			'<i style="background:' + 
			getColor(Number.NEGATIVE_INFINITY, columnName) +
			'"></i> &lt; ' + cutoffs[cutoffs.length-1] + '<br>';
			
		return div;
	}
	
	legend.addTo(map);
}

function removeLegend() {
	if (legend) {
		legend.remove();
		legend = undefined;
	}
}

function display(columnName) {
	
	showDistrictsData = false;
	
	removeLegend();
	
	createLegend(columnName);
	
	let options = {stroke: true};
	
	geoJsonLayer.setStyle(function (feature) {
		
		let row = getRow(feature.properties.PRECINCT);
		
		if (!row) {
			options.fillColor = 'gray';
			return options;
		}
		
		let value = row[columnName];
		
		if (value == 'N/D') {
			options.fillColor = 'gray';
			return options;
		}
		
		// Determine if value (string) contains int or float data
		if (value.indexOf('.') == -1) {
			value = parseInt(value);
		} else {
			value = parseFloat(value);
		}
		
		options.fillColor = getColor(value, columnName);
		return options;
	});
	
}

function display1() {
	showDistrictsData = true;
	
	unhighlightPrecinct;
	
	removeLegend();
	
	geoJsonLayer.setStyle(function (feature) {
		let [districtNum, _] = feature.properties.PRECINCT.split('.');
		
		return {stroke: false, fillColor: DISTRICT_COLOR[districtNum]};
	});
}

// ADDING CHECKBOXES

let displaySelector = document.getElementById('displaySelector');

displaySelector.innerHTML += `
<div class='form-check'>
	<input class='form-check-input' type='radio' name='view'
	id='districts' onchange='display1()' checked>
	<label class='form-check-label' for='districts'>
	Election District Map
	</label>
</div>`;

display1();

for (columnName in setting) {
	displaySelector.innerHTML += `
	<div class='form-check'>
		<input class='form-check-input' type='radio' name='view'
		id='${columnName}' onchange='display(this.id)'>
		<label class='form-check-label' for='${columnName}'>
		${setting[columnName].label}
		</label>
	</div>`;
}







