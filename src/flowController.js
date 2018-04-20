let osujson = require('osu-json');
let OSZHandler = require('./OSZHandler/OSZHandler.js');
let LoadingScreen = require('./Tokens/LoadingScreen.js');

import osuFile from './assets/STYX_HELIX/STYX_HELIX.osu';

class FlowController {
	constructor() {
		this.game = null;

		if (!this.entry) {
			throw new Error('FlowController requires an entrypoint (FlowController.entry())!');
		}

		this._currentAction = this.entry;
	}

	get currentAction() {
		return this._currentAction;
	}

	printCurrentAction(){
		if(!this._currentAction) return;
		console.log(this._currentAction.name);
		return this._currentAction.name;
	}

	/**
	 * @param {Function} val
	 */
	set currentAction(val) {
		if (typeof val !== 'function') throw new Error('Must be function param');
		this._currentAction = val;
	}

	/**
	 * Every implementation of FlowController MUST have an entry() function
	 */
	entry() {
		console.log('[flowController] entry');
		this.currentAction = this.startLoading;
	}

	startLoading() {
		console.log('[flowController] startLoading');

		AssetLoader.LoadAssetsFromAssetList(Settings.resources).then(
			() => {
				this.currentAction = this.finishedLoading;
				console.log('[FlowController] Finished loading initial assets');
			},
			() => {
				console.error('error');
			}
		);

		AddToken((this.loadingScreen = new LoadingScreen()));
		this.currentAction = this.waitForLoading;
	}

	waitForLoading() {}

	finishedLoading() {
		'use strict';
		this.currentAction = this.waitForOsuFile;

		osujson.ParseOSUFileAsync(osuFile).then(output => {
			this._osuFile = output;
			console.log(this._osuFile);
			OSZHandler.HandleOSUFile(output).then(result => {
				console.log(result);
				this._osuFile = result;
				RemoveToken(this.loadingScreen);
				this.currentAction = this.startGame;
			});
		});
	}

	waitForOsuFile() {}

	startGame() {
		console.log('[FlowController] startGame');
		this.game = AddToken(new Settings.flowSettings.gameToken(this._osuFile));
		this.currentAction = this.inGame;
	}

	inGame() {}
}

module.exports = new FlowController();
