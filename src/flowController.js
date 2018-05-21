let osujson = require('osu-json');
let OSZHandler = require('./OSZHandler/OSZHandler.js');
let LoadingScreen = require('./Tokens/LoadingScreen.js');

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

	printCurrentAction() {
		if (!this._currentAction) return;
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
		this.currentAction = this.startMainMenu;
	}

	startMainMenu() {
		this.currentAction = this.onMainMenu;
		this.mainMenu = AddToken(
			new Settings.flowSettings.mainMenuToken(() => {
				this.currentAction = this.startLoading;
				RemoveToken(this.mainMenu);
				this.mainMenu = null;
			}, {})
		);
	}

	onMainMenu() {}

	startLoading() {
		console.log('[flowController] startLoading');

		AssetLoader.LoadAssetsFromAssetList(Settings.resources).then(
			() => {
				this.currentAction = this.finishedLoading;
				console.log('[FlowController] Finished loading initial assets');
			},
			err => {
				console.error(err);
			}
		);

		AddToken((this.loadingScreen = new LoadingScreen()));
		this.currentAction = this.waitForLoading;
	}

	waitForLoading() {}

	finishedLoading() {
		'use strict';
		let osuFiles = {};
		for(let k in Settings.osuTracks){
			osuFiles[Settings.osuTracks[k]] = ("tracks/" + Settings.osuTracks[k] + "/" + Settings.osuTracks[k] + ".osu");
		}

		AssetLoader.LoadAssetsFromAssetList(osuFiles).then(
			() => {
				this.currentAction = this.finishedLoadingOsuFiles;
				console.log('[FlowController] Finished loading osu files');
			},
			err => {
				console.error(err);
			}
		);

		this.currentAction = this.waitForOsuFile;
	}

	finishedLoadingOsuFiles(){
		osujson.ParseOSUFileAsync(GetOSUFile(_SELECTED_OSU_FILE)).then(output => {
			this._osuFile = output;
			OSZHandler.HandleOSUFile(output).then(result => {
				this._osuFile = result;
				RemoveToken(this.loadingScreen);
				this.currentAction = this.startGame;
			});
		});
		this.currentAction = this.waitForOsuFile;
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
