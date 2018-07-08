/*
    (/・ω・)/
 */

global._SELECTED_OSU_FILE = 'WAKE_ME_UP';

import './styles/app.css';
import fnt_exo_20_black from './assets/fonts/exo-20-black.ttf';
global.fnt_exo_20_black = fnt_exo_20_black;

const PIXI = (global.PIXI = require('pixi.js'));
const PIXISND = (global.PIXISND = require('pixi-sound'));
const PIXIPART = (global.PIXIPART = require('./pixi-particles.js'));

global.FBEngine = require('fbengine');

require('./vector.js');

global.osuScale = function(x, y) {
	if (typeof y === 'undefined') {
		if (typeof x === 'object') {
			return {
				x:
					x.x *
					((Settings.applicationSettings.width + Settings.osuDefaults.Padding.x) / 512),
				y:
					x.y *
					((Settings.applicationSettings.height + Settings.osuDefaults.Padding.y) / 384)
			};
		} else {
			return (
				x * ((Settings.applicationSettings.width + Settings.osuDefaults.Padding.x) / 512)
			);
		}
	} else {
		return {
			x: x * ((Settings.applicationSettings.width + Settings.osuDefaults.Padding.x) / 512),
			y: y * ((Settings.applicationSettings.height + Settings.osuDefaults.Padding.y) / 384)
		};
	}
};

global.GetOSUFile = function(name) {
	return global._OSUFILECACHE[name];
};

const Settings = (global.Settings = require('./Settings/Settings.js'));

const Leaderboards = new FBEngine.Leaderboards();
global.Leaderboards = Leaderboards;

const AdAPI = new FBEngine.Adverts();
global.AdAPI = AdAPI;

const SaveData = new FBEngine.SaveData();
global.SaveData = SaveData;

const AudioAPI = new FBEngine.Audio();
global.AudioAPI = AudioAPI;

const AssetLoader = (global.AssetLoader = FBEngine.AssetLoader);

const Analytics = new (require('fbengine')).Analytics();
global.Analytics = Analytics;

const Easing = (global.Easing = FBEngine.Easing);

const Tokens = (global.Tokens = []);

PIXI.settings.SCALE_MODE = Settings.applicationSettings.scaleMode;
const Application = (global.Application = new PIXI.Application(Settings.applicationSettings));
const EventHandler = (global.EventHandler = new FBEngine.EventHandler(Application.ticker));
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

const FlowController = (global.FlowController = require('./flowController.js'));

Application.ticker.add(delta => {
	'use strict';
	let deltaTime = Application.ticker.elapsedMS;

	if (FlowController.currentAction) FlowController.currentAction();

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
