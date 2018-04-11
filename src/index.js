/*
    (/・ω・)/
 */

const PIXI = (global.PIXI = require('pixi.js'));

require('./engine/MiscPolyfills.js');
require('./engine/FBInstant.js');

const Settings = (global.Settings = require('./Settings/Settings.js'));
const Leaderboards = (global.Leaderboards = require('./engine/gamesparks/FBLeaderboards.js'));
const AdAPI = (global.AdAPI = require('./engine/Adverts.js'));
const SaveData = (global.SaveData = require('./engine/SaveData.js'));
const AudioAPI = (global.AudioAPI = require('./engine/Audio.js'));
const Analytics = (global.Analytics = require('./engine/Analytics.js'));
const Easing = (global.Easing = require('./engine/Easing.js'));
const Tokens = (global.Tokens = []);
const Application = (global.Application = new PIXI.Application(Settings.applicationSettings));

Application.renderer.backgroundColor = Settings.applicationSettings.backgroundColor;
document.body.appendChild(Application.view);
SetRendererProperties(Application.renderer.view);
PIXI.settings.SCALE_MODE = Settings.applicationSettings.scaleMode;
Application.ticker.minFPS = 60;
window.addEventListener('resize', function() {
	renderer.resize(Settings.applicationSettings.width, Settings.applicationSettings.height);
});

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
