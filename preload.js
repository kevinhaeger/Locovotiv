// Load these modules before Electron is ready
const _fs = require('fs');
const _csv = require('csv-parser');

// Make modules global when Electron is ready
// and begins to load web pages
process.once('loaded', () => {
	global.fs = _fs;
	global.csv = _csv;
});