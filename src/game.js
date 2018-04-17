let Token = require('./engine/Token.js');
let GameObject = require('./engine/GameObject.js');
let Text = require('./engine/Text.js');
let ContainerObject = require('./engine/ContainerObject.js');
let Button = require('./engine/Button.js');
let CircleHitObject = require('./Objects/CircleHitObject.js');
let NineSliceObject = require('./engine/NineSliceObject.js');
let SliderHitObject = require('./Objects/SliderHitObject.js');
let WAAClock = require('waaclock');

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
		this._circleSize = 54.4 - 4.48 * this.activeTrack.data['Difficulty']['CircleSize'];
		this._activeMPB = 1000;
		this.events = [];

		this.bg = new GameObject(
			//this.activeTrack.bg,
			t_white,
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
				fontSize: 22,
				fill: '#ff0000'
			})
		});
		this.scene.addChild(this.scoreDisplay);

		Application.stage.addChild(this.scene);

		if (props) Object.assign(this, props);

		this._scheduleHitObjectSpawns();
		this._scheduleTimingPoints();
		this._playTrack();
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
		this.__trackInstance = this.activeTrack.track.play();
		//this.__trackInstance.on('progress', this._onProgress.bind(this));
	}

	static _calculatePreempt(difficulty) {
		let AR = difficulty['ApproachRate'];

		if (AR < 5) {
			return 1200 + 600 * (5 - AR) / 5;
		} else if (AR === 5) {
			return 1200;
		} else if (AR > 5) {
			return 1200 - 750 * (AR - 5) / 5;
		}

		throw new Error('AR not a number!');
	}

	calculateScore(difficulty, timestamp){
		return Game._calculateScore(difficulty, timestamp);
	}

	static _calculateFadein(difficulty) {
		let AR = difficulty['ApproachRate'];

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

	_scheduleHitObjectSpawns() {
		if (!this._trackClock) {
			this._trackClock = new WAAClock(this.activeTrack.track.context.audioContext);
			this._trackClock.start();
		}

		for (let k in this.activeTrack.data['HitObjects']) {
			let current = this.activeTrack.data['HitObjects'][k];

			this.events.push(
				this._trackClock.callbackAtTime(() => {
					switch (current.type.type) {
						case 'slider':
							this._spawnSlider(current);
							break;
						default:
						case 'circle':
							this._spawnCircle(current);
							break;
					}
				}, current.time * 0.001)
			);
		}
	}

	_scheduleTimingPoints() {
		if (!this._trackClock) {
			this._trackClock = new WAAClock(this.activeTrack.track.context.audioContext);
			this._trackClock.start();
		}

		this._setTimingPointData(this.activeTrack.data['TimingPoints'][0]);

		for (let i = 1; i < this.activeTrack.data['TimingPoints'].length; i++) {
			let current = this.activeTrack.data['TimingPoints'][i];

			this.events.push(
				this._trackClock.callbackAtTime(() => {
					this._setTimingPointData(current);
				}, current.offset * 0.001)
			);
		}
	}

	_spawnSlider(current) {
		this.scene.addChild(
			new SliderHitObject(
				current.x,
				current.y,
				current.type,
				'hitsound', // todo
				{
					fadein: this._fadein,
					preempt: this._preempt,
					path: current.path,
					circleSize: this._circleSize,
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
		this.scene.addChild(
			new CircleHitObject(
				current.x,
				current.y,
				current.type,
				'hitsound', // todo
				{
					fadein: this._fadein,
					preempt: this._preempt,
					circleSize: this._circleSize
				},
				{ game: this }
			)
		);
	}

	/**
	 *
	 * @param time
	 * @private
	 * @deprecated
	 */
	_handleHitObjectProgress(time) {
		for (let k in this.activeTrack.data['HitObjects']) {
			let current = this.activeTrack.data['HitObjects'][k];

			//if(current.type.type !== 'circle') continue;

			if (Math.floor(time * 1000) > current.time - this._preempt && !current.spawned) {
				console.log(current.type.type);

				let obj = null;

				switch (current.type.type) {
					case 'slider':
						obj = new SliderHitObject(
							current.x,
							current.y,
							current.type,
							'hitsound', // todo
							{
								fadein: this._fadein,
								preempt: this._preempt,
								path: current.path,
								circleSize: this._circleSize
							},
							{ game: this }
						);
						break;
					default:
					case 'circle':
						obj = new CircleHitObject(
							current.x,
							current.y,
							current.type,
							'hitsound', // todo
							{
								fadein: this._fadein,
								preempt: this._preempt,
								circleSize: this._circleSize
							},
							{ game: this }
						);
						break;
				}

				this.scene.addChild(obj);

				current.spawned = true;
			}
		}
	}

	_setTimingPointData(tpoint) {
		this._activeMPB = tpoint.mpb;
		this._activeMeter = tpoint.meter;

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
