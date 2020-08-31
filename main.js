const {app, BrowserWindow} = require('electron');
const path = require('path');

let mapWindow;

// Listens for Electron to be ready
app.on('ready', () => {
	// Create the browser window
	mapWindow = new BrowserWindow({
		width: 1400,
		height:882,
		webPreferences:  {
			preload: path.join(__dirname, 'preload.js')
		}
	});

	mapWindow.setMenu(null);
	mapWindow.setResizable(false);

	// and load mapWindow.html for the app
	mapWindow.loadFile('mapWindow.html');
});