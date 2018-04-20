let game = require('../game.js');

class Settings {
	constructor() {
		this.DEBUG = {
			suppressLoadingLogs: false
		};

		this.SaveData = {
			defaultSaveData: {}
		};

		/**
		 * @deprecated
		 */
		this.GameSparks = {
			key: '',
			secret: '',
			logger: console.log,
			debug: false,
			offlineMode: true
		};

		this.applicationSettings = {
			// REQUIRED
			width: 512,
			height: 384,
			sharedTicker: true,
			autoStart: false,
			backgroundColor: 0x000000,
			scaleMode: 0, // 0 == linear, 1 == nearest

			// unneeded
			antialias: true,
			roundPixels: false,
			renderScale: 1.0
		};

		this.styleSettings = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		this.GameSettings = {};

		this.Analytics = {
			enabled: false,
			mode: 'FBINSTANT', // options: FBINSTANT or GOOGLE
			tid: '',
			debug: false,
			url: 'https://www.google-analytics.com/collect?' // deprecated
		};

		this.resources = {
			t_black: 'black.png',
			t_white: 'white.png',
			t_whiteCircle: 'white_circle.png',
			t_redbg9s: 'redbg_9slice.png',
			t_circleOutline: 'circle_outline.png',
			snd_hitclap: 'STYX_HELIX/soft-hitclap3.wav',

			snd_drum_hitclap: 'defaultAssets/drum-hitclap.wav',
			snd_drum_hitfinish: 'defaultAssets/drum-hitfinish.wav',
			snd_drum_hitnormal: 'defaultAssets/drum-hitnormal.wav',
			snd_drum_hitwhistle: 'defaultAssets/drum-hitwhistle.wav',
			snd_drum_sliderslide: 'defaultAssets/drum-sliderslide.wav',
			snd_drum_slidertick: 'defaultAssets/drum-slidertick.wav',
			snd_drum_sliderwhistle: 'defaultAssets/drum-sliderwhistle.wav',

			snd_normal_hitclap: 'defaultAssets/normal-hitclap.wav',
			snd_normal_hitfinish: 'defaultAssets/normal-hitfinish.wav',
			snd_normal_hitnormal: 'defaultAssets/normal-hitnormal.wav',
			snd_normal_hitwhistle: 'defaultAssets/normal-hitwhistle.wav',
			snd_normal_sliderslide: 'defaultAssets/normal-sliderslide.wav',
			snd_normal_slidertick: 'defaultAssets/normal-slidertick.wav',
			snd_normal_sliderwhistle: 'defaultAssets/normal-sliderwhistle.wav',

			snd_soft_hitclap: 'defaultAssets/soft-hitclap.wav',
			snd_soft_hitfinish: 'defaultAssets/soft-hitfinish.wav',
			snd_soft_hitwhistle: 'defaultAssets/soft-hitwhistle.wav',
			snd_soft_sliderslide: 'defaultAssets/soft-sliderslide.wav',
			snd_soft_slidertick: 'defaultAssets/soft-slidertick.wav',
			snd_soft_sliderwhistle: 'defaultAssets/soft-sliderwhistle.wav'
		};

		this.Leaderboards = {
			leaderboard_names: [],
			offlineMode: true
		};

		this.audioSettings = {
			globalVolume: 1.0,
			sfxVolume: 1.0, // unused
			musicVolume: 1.0 // unused
		};

		this.flowSettings = {
			mainMenuToken: null,
			gameToken: game
		};

		this.adverts = {
			placementId: '...',
			enabled: false
		};
	}
}

module.exports = new Settings();
