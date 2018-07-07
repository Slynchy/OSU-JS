let game = require('../game.js');
//let game_legacy = require('../game_legacy.js');
let mainMenu = require('../Tokens/MainMenu.js');

class Settings {
	constructor() {
		this.DEBUG = {
			enabled: true,
			suppressLoadingLogs: true
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
			width: 540,
			height: 960,
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

		this.GameSettings = {
			portraitMode: false,
		};

		this.Analytics = {
			enabled: false,
			mode: 'FBINSTANT', // options: FBINSTANT or GOOGLE
			tid: '',
			debug: false,
			url: 'https://www.google-analytics.com/collect?' // deprecated
		};

		this.OSUSettings = {
			timing_threshold: 0.066, // difference of 66ms, for LOGGING ONLY
			timing_hard_threshold: 0.5, // difference of 500ms; if over this, don't spawn obj

			slider_reward_threshold: 0.97 // if slider progress exceeds this value when mouse released, award points
		};

		this.mainMenuAssets = {
			t_black: 'black.png',
			t_white: 'white.png',
			t_button_portrait: 'portrait_button.png',
			t_button_landscape: 'landscape_button.png',
		};

		this.resources = {
			t_whiteCircle: 'white_circle.png',
			t_redbg9s: 'redbg_9slice.png',
			t_circleOutline: 'circle_outline.png',

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
			snd_soft_hitnormal: 'defaultAssets/soft-hitnormal.wav',
			snd_soft_hitwhistle: 'defaultAssets/soft-hitwhistle.wav',
			snd_soft_sliderslide: 'defaultAssets/soft-sliderslide.wav',
			snd_soft_slidertick: 'defaultAssets/soft-slidertick.wav',
			snd_soft_sliderwhistle: 'defaultAssets/soft-sliderwhistle.wav',

			t_circle_glow: 'circle_glow.png',
			t_arrows: 'arrows.png',
			t_spark: 'spark.png'
		};

		this.osuTracks = [
			"WAKE_ME_UP",
			"STYX_HELIX",
			"JUMPIN_JUMP_UP"
		];

		this.Leaderboards = {
			leaderboard_names: [],
			offlineMode: true
		};

		this.audioSettings = {
			globalVolume: 0.15,
			sfxVolume: 0.15,
			musicVolume: 0.15
		};

		this.osuDefaults = {
			ApproachRate: 3,
			Padding: {
				x: -256,
				y: -100
			}
		};

		this.flowSettings = {
			mainMenuToken: mainMenu,
			gameToken: game
		};

		this.adverts = {
			placementId: '...',
			enabled: false
		};
	}
}

module.exports = new Settings();
