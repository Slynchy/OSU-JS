let Token = require('./engine/Token.js');
let GameObject = require('./engine/GameObject.js');
let Text = require('./engine/Text.js');
let ContainerObject = require('./engine/ContainerObject.js');
let Button = require('./engine/Button.js');
let CircleHitObject = require('./Objects/CircleHitObject.js');
let NineSliceObject = require('./engine/NineSliceObject.js');
let SliderHitObject = require('./Objects/SliderHitObject.js');
let WebAudioScheduler = require('web-audio-scheduler');
let AudioLoader = require('audio-loader');

class Game extends Token {
	constructor(osuFile, props) {
		super({});

		/*
			Game variables go here
		 */
		this.name = 'Game';
		this.scene = new ContainerObject();
		this._osuFile = osuFile;

		this.overallDifficulty = this.activeTrack.data['Difficulty']['OverallDifficulty'];
		this._fadein = Game._calculateFadein(this.activeTrack.data['Difficulty']);
		this._preempt = Game._calculatePreempt(this.activeTrack.data['Difficulty']);
		this._circleSize = osuScale(
			54.4 - 4.48 * this.activeTrack.data['Difficulty']['CircleSize']
		);
		this._activeMPB = 1000;
		this._activeSampleSet = 'normal';
		this.events = [];

		this._currentComboCount = 0;

		if (PIXI.sound) PIXI.sound.volumeAll = 0.1;

		this.bg = new GameObject(
			//this.activeTrack.bg,
			t_black,
			{
				width: Settings.applicationSettings.width,
				height: Settings.applicationSettings.height,
				z: 0
			}
		);
		this.scene.addChild(this.bg);

		this.score = 0;
		this.scoreDisplay = new Text({
			text: '0',
			x: Settings.applicationSettings.width / 2,
			style: new PIXI.TextStyle({
				align: 'center',
				fontSize: osuScale(22),
				fill: '#ff0000'
			})
		});
		this.scene.addChild(this.scoreDisplay);

		Application.stage.addChild(this.scene);

		if (props) Object.assign(this, props);

		AudioLoader(
			'./assets/STYX_HELIX/' + this.activeTrack.data['General']['AudioFilename']
		).then(buffer => {
			console.log(buffer);

			this.__AUDIOCTX = new AudioContext();
			this.__AUDIOGAIN = this.__AUDIOCTX.createGain();
			this.__AUDIOSRC = this.__AUDIOCTX.createBufferSource();
			this.__AUDIOSRC.buffer = buffer;

			this.__AUDIOSRC.connect(this.__AUDIOGAIN);
			this.__AUDIOGAIN.connect(this.__AUDIOCTX.destination);

			this._setTimingPointData(this.activeTrack.data['TimingPoints'][0]);
			this._createScheduler();
			this._scheduleHitObjectSpawns();
			this._scheduleTimingPoints();
			this._playTrack();
		});
	}

	addScore(score) {
		this.score += Math.abs(score);
		this._updateScore();
	}

	_updateScore() {
		this.scoreDisplay.text = this.score.toString();
	}

	_playTrack() {
		this.__trackProgress = 0;
		this._trackClock.start();
		this.__trackInstance = this.__AUDIOSRC.start();
		this.__AUDIOGAIN.gain.setValueAtTime(0.1, this.__AUDIOCTX.currentTime);
		//this.__trackInstance.on('progress', this._onProgress.bind(this));
	}

	static _calculatePreempt(difficulty) {
		let AR = difficulty['ApproachRate'] | Settings.osuDefaults.ApproachRate;

		if (AR < 5) {
			return 1200 + 600 * (5 - AR) / 5;
		} else if (AR === 5) {
			return 1200;
		} else if (AR > 5) {
			return 1200 - 750 * (AR - 5) / 5;
		}

		throw new Error('AR not a number!');
	}

	calculateScore(difficulty, timestamp) {
		return Game._calculateScore(difficulty, timestamp);
	}

	static _calculateFadein(difficulty) {
		let AR = difficulty['ApproachRate'] | Settings.osuDefaults.ApproachRate;

		if (AR < 5) {
			return 800 + 400 * (5 - AR) / 5;
		} else if (AR === 5) {
			return 800;
		} else if (AR > 5) {
			return 800 - 500 * (AR - 5) / 5;
		}

		throw new Error('AR not a number!');
	}

	/**
	 *
	 * @param difficulty
	 * @param timestamp In milliseconds, the time between click and the perfect hit
	 * @returns {number}
	 * @private
	 */
	static _calculateScore(difficulty, timestamp) {
		//let OD = difficulty['OverallDifficulty'];
		let OD = difficulty;

		if (timestamp < 0) timestamp = Math.abs(timestamp);

		if (timestamp < 50 + 30 * (5 - OD) / 5) {
			return 300;
		} else if (timestamp < 100 + 40 * (5 - OD) / 5) {
			return 100;
		} else if (timestamp < 50 + 30 * (5 - OD) / 5) {
			return 50;
		}

		return 0;
		//throw new Error('Invalid timestamp');
	}

	_createScheduler() {
		this._trackClock = new WebAudioScheduler({
			context: this.__AUDIOCTX,
			interval: 0.0125,
			aheadTime: 0.025
		});
	}

	async _scheduleHitObjectSpawns() {
		for (let k in this.activeTrack.data['HitObjects']) {
			let current = this.activeTrack.data['HitObjects'][k];

			let timestamp = current.time * 0.001 - this._preempt * 0.001;

			this._trackClock.insert(timestamp, () => {
				let diff = Math.abs(timestamp - this.__AUDIOCTX.currentTime);
				if (diff >= Settings.OSUSettings.timing_threshold) {
					console.warn('Out of timing by %ims', diff * 1000);
				}

				switch (current.type.type) {
					case 'slider':
						this._spawnSlider(current);
						break;
					default:
					case 'circle':
						this._spawnCircle(current);
						break;
				}
			});
		}
	}

	async _scheduleTimingPoints() {
		for (let i = 1; i < this.activeTrack.data['TimingPoints'].length; i++) {
			let current = this.activeTrack.data['TimingPoints'][i];

			this._trackClock.insert(current.offset * 0.001, this._setTimingPointData, current);
		}
	}

	_spawnSlider(current) {
		//TODO: fix this hack
		if (current.path.sliderType === 'bezier') return;

		let pos = osuScale(current.x, current.y);

		if (current.type.isNewCombo) {
			this._currentComboCount = 0;
		}

		this.scene.addChild(
			new SliderHitObject(
				pos.x,
				pos.y,
				current.type,
				{
					fadein: this._fadein,
					preempt: this._preempt,
					path: current.path,
					circleSize: this._circleSize,
					repeat: current.repeat,
					mpb: this._activeMPB,
					comboNumber: ++this._currentComboCount,
					hitSounds: this._getHitSound({ hitSound: 'normal' }),
					duration:
						current.pixelLength /
						(100.0 * this.activeTrack.data['Difficulty']['SliderMultiplier']) *
						this._activeMPB
				},
				{ game: this }
			)
		);
	}

	_spawnCircle(current) {
		let pos = osuScale(current.x, current.y);
		if (current.type.isNewCombo) {
			this._currentComboCount = 0;
		}
		this.scene.addChild(
			new CircleHitObject(
				pos.x,
				pos.y,
				current.type,
				{
					fadein: this._fadein,
					preempt: this._preempt,
					comboNumber: ++this._currentComboCount,
					circleSize: this._circleSize,
					hitSounds: this._getHitSound(current)
				},
				{ game: this }
			)
		);
	}

	_getHitSound(entry) {
		let result = [];

		for (let k in entry['hitSound']) {
			if (entry['hitSound'][k] === true || k === 'normal') {
				let file = ('snd_' + this._activeSampleSet + '_hit' + k).toLowerCase();

				if (global.hasOwnProperty(file)) {
					result.push(global[file]);
				} else {
					throw new Error('Hitsound invalid!');
				}
			}
		}

		return result;
	}

	_setTimingPointData(tpoint) {
		this._activeMPB = tpoint.mpb;
		this._activeMeter = tpoint.meter;
		this._activeSampleSet = tpoint.sampleSet;

		// todo

		tpoint.done = true;
	}

	_handleTimingPointProgress(time) {
		if (!this.activeTrack.data['TimingPoints'][0].done) {
			this._setTimingPointData(this.activeTrack.data['TimingPoints'][0]);
		}

		for (let i = 1; i < this.activeTrack.data['TimingPoints'].length; i++) {
			let current = this.activeTrack.data['TimingPoints'][i];

			if (current.offset <= time) return;
			else if (current.done === true) continue;

			this._setTimingPointData(current);
		}
	}

	/**
	 *
	 * @param progress
	 * @private
	 * @deprecated
	 */
	_onProgress(progress) {
		this.__trackProgress = progress;

		let time = this.__trackProgress * this.activeTrack.track.duration;

		//this._handleTimingPointProgress(time);
		//this._handleHitObjectProgress(time);
	}

	get activeTrack() {
		return this._osuFile;
	}

	endStep(delta) {
		'use strict';
		super.endStep(delta);

		if (this.scene) this.scene.endStep(delta);
	}

	onDestroy() {
		'use strict';
		super.onDestroy();
	}

	onRemove() {
		'use strict';
		application.stage.removeChild(this.scene);
		FlowController.game = null;
	}

	onAdd() {
		'use strict';
		super.onAdd();
		Application.stage.addChild(this.scene);
	}

	physicsStep(dt) {}

	// Quits the game
	quit() {
		'use strict';
		this.destroy();
	}
}

module.exports = Game;
