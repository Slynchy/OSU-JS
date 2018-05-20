/*
    (/・ω・)/
 */

import './styles/app.css';
import fnt_exo_20_black from './assets/fonts/exo-20-black.ttf';
global.fnt_exo_20_black = fnt_exo_20_black;
const PIXI = (global.PIXI = require('pixi.js'));
const PIXISND = (global.PIXISND = require('pixi-sound'));

require('./engine/MiscPolyfills.js');
require('./vector.js');

global.osuScale = function(x, y) {
	if (typeof y === 'undefined') {
		if (typeof x === 'object') {
			return {
				x: x.x * (Settings.applicationSettings.width / 512),
				y: x.y * (Settings.applicationSettings.height / 384)
			};
		} else {
			return x * (Settings.applicationSettings.width / 512);
		}
	} else {
		return {
			x: x * (Settings.applicationSettings.width / 512),
			y: y * (Settings.applicationSettings.height / 384)
		};
	}
};

global.GetOSUFile = function(name) {
	return global._OSUFILECACHE[name];
};

require('./engine/FBInstant.js');

const Settings = (global.Settings = require('./Settings/Settings.js'));
const Leaderboards = (global.Leaderboards = require('./engine/gamesparks/FBLeaderboards.js'));
const AdAPI = (global.AdAPI = require('./engine/Adverts.js'));
const SaveData = (global.SaveData = require('./engine/SaveData.js'));
const AudioAPI = (global.AudioAPI = require('./engine/Audio.js'));
const AssetLoader = (global.AssetLoader = require('./engine/AssetLoader.js'));
const Analytics = (global.Analytics = require('./engine/Analytics.js'));
const Easing = (global.Easing = require('./engine/Easing.js'));
const Tokens = (global.Tokens = []);

PIXI.settings.SCALE_MODE = Settings.applicationSettings.scaleMode;
const Application = (global.Application = new PIXI.Application(Settings.applicationSettings));
const EventHandler = (global.EventHandler = new (require('./engine/EventHandler.js'))(
	Application.ticker
));
Application.renderer.backgroundColor = Settings.applicationSettings.backgroundColor;
document.body.appendChild(Application.view);
SetRendererProperties(Application.renderer.view);
global.__CACHEDCSSSTYLE = Application.view.getAttribute('style');

let resize = function() {
	let scale = { x: 1, y: 1 };
	scale.x = (window.innerWidth - 10) / Application.view.width;
	scale.y = (window.innerHeight - 10) / Application.view.height;

	if (scale.x < 1 || scale.y < 1) {
		scale = '1, 1';
	} else if (scale.x < scale.y) {
		scale = scale.x + ', ' + scale.x;
	} else {
		scale = scale.y + ', ' + scale.y;
	}

	Application.view.setAttribute(
		'style',
		//__CACHEDCSSSTYLE +
		' ' +
			'-ms-transform: scale(' +
			scale +
			'); -webkit-transform: scale3d(' +
			scale +
			', 1); -moz-transform: scale(' +
			scale +
			'); -o-transform: scale(' +
			scale +
			'); transform: scale(' +
			scale +
			'); max-width: 100%;max-height: 100%;'
	);
};
window.addEventListener('resize', resize);
resize();

const flowController = (global.flowController = require('./flowController.js'));

Application.ticker.add(delta => {
	'use strict';
	let deltaTime = Application.ticker.elapsedMS;

	if (flowController.currentAction) flowController.currentAction();

	for (let i = 0; i < Tokens.length; i++) {
		if (!Tokens[i]._queuedForDestruction && Tokens[i].startStep) {
			Tokens[i].startStep(deltaTime);
		}
	}
	for (let i = 0; i < Tokens.length; i++) {
		if (!Tokens[i]._queuedForDestruction && Tokens[i].endStep) {
			Tokens[i].endStep(deltaTime);
		}
	}
	for (let i = Tokens.length - 1; i >= 0; i--) {
		if (Tokens[i]._queuedForDestruction) {
			Tokens[i] = null;
			Tokens.splice(i, 1);
		}
	}
});

if (module.hot) {
	module.hot.accept();
}
