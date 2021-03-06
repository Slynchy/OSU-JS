let Token = FBEngine.Token;
let GameObject = FBEngine.GameObject;
let Text = FBEngine.Text;
let ContainerObject = FBEngine.ContainerObject;
let Button = FBEngine.Button;
let NineSliceObject = FBEngine.NineSliceObject;
let CircleHitObject = require('./Objects/CircleHitObject.js');
let SliderHitObject = require('./Objects/SliderHitObject.js');
let WebAudioScheduler = require('web-audio-scheduler');
let AudioLoader = require('audio-loader');

/**
 * Class for the normal version of Osu!
 * @deprecated
 */
class Game_legacy extends Token {
	constructor(osuFile, props) {
		super({});

		/*
			Game_legacy variables go here
		 */
		this.name = 'Game_legacy';
		this.scene = new ContainerObject();
		this._osuFile = osuFile;
		this.globalVolume = Settings.audioSettings.globalVolume;
		this._activeSampleIndex = 0;

		this._offset = {
			x: -(Settings.osuDefaults.Padding.x * 0.5),
			y: -(Settings.osuDefaults.Padding.y * 0.5)
		};

		this.difficulty = this.activeTrack.data['Difficulty'];
		this.overallDifficulty = this.activeTrack.data['Difficulty']['OverallDifficulty'];
		this._fadein = Game_legacy._calculateFadein(this.activeTrack.data['Difficulty']);
		this._preempt = Game_legacy._calculatePreempt(this.activeTrack.data['Difficulty']);
		this._circleSize = osuScale(
			54.4 - 4.48 * this.activeTrack.data['Difficulty']['CircleSize']
		);
		this._activeMPB = 1000;
		this._activeSampleSet = 'normal';
		this.events = [];

		this._currentComboCount = 0;

		if (PIXI.sound) PIXI.sound.volumeAll = 0.2;

		this.bg = new GameObject(
			//this.activeTrack.bg,
			t_black,
			{
				width: Settings.applicationSettings.width,
				height: Settings.applicationSettings.height,
				z: -5
			}
		);
		this.scene.addChild(this.bg);

		this.customBg = new GameObject(t_black, {
			x: Settings.applicationSettings.width / 2,
			y: Settings.applicationSettings.height / 2,
			alpha: 0,
			width: Settings.applicationSettings.width,
			height: Settings.applicationSettings.height,
			anchor: {
				x: 0.5,
				y: 0.5
			},
			z: -4
		});
		this.scene.addChild(this.customBg);

		this.uiContainer = new ContainerObject({
			x: Settings.GameSettings.portraitMode ? 50 : Settings.applicationSettings.width / 2,
			y: Settings.GameSettings.portraitMode ? Settings.applicationSettings.height / 2 : 25,
			anchor: {
				x: 0.5,
				y: 0.5
			},
			rotation: Settings.GameSettings.portraitMode ? -1.571 : 0
		});

		this.score = 0;
		this.scoreDisplay = new Text({
			text: '12345',
			alpha: 0,
			anchor: {
				x: 0.5,
				y: 0.5
			},
			style: new PIXI.TextStyle({
				align: 'center',
				fontSize: osuScale(22),
				fontFamily: fnt_exo_20_black,
				fill: '#ff0000'
			})
		});
		this.uiContainer.addChild(this.scoreDisplay);

		this._currentComboMultiplier = 1;
		this.comboDisplay = new Text({
			text: 'x1',
			alpha: 0,
			y: 50,
			anchor: {
				x: 0.5,
				y: 0
			},
			style: new PIXI.TextStyle({
				align: 'center',
				fontSize: osuScale(16),
				fontFamily: fnt_exo_20_black,
				fill: '#ff0000'
			})
		});
		this.uiContainer.addChild(this.comboDisplay);
		this.scene.addChild(this.uiContainer);

		this._createDeathParticleSpawner();

		let loadingText = new Text({
			text: 'Loading audio file...',
			x: Settings.applicationSettings.width / 2,
			y: Settings.applicationSettings.height / 2,
			anchor: {
				x: 0.5,
				y: 0.5
			},
			style: new PIXI.TextStyle({
				align: 'center',
				fontSize: osuScale(22),
				fontFamily: fnt_exo_20_black,
				fill: '#ff0000'
			})
		});
		this.scene.addChild(loadingText);

		Application.stage.addChild(this.scene);

		if (props) Object.assign(this, props);

		AssetLoader.LoadAssetsFromAssetList(
			this._createAssetLoaderObjectFromRequiredFiles(this.activeTrack.data['RequiredFiles'])
		).then(resources => {
			AudioLoader(
				'./assets/tracks/' +
					_SELECTED_OSU_FILE +
					'/' +
					this.activeTrack.data['General']['AudioFilename']
			).then(buffer => {
				if (resources['BG']) {
					this.customBg.texture = resources['BG'].texture;

					if (Settings.GameSettings.portraitMode) {
						this.customBg.rotation = -1.571;

						const aspect =
							Settings.applicationSettings.width / this.customBg.texture.height;

						this.customBg.width = this.customBg.texture.width * aspect;
						this.customBg.height = Settings.applicationSettings.width;
					}
				}

				let self = this;

				self.scene.removeChild(loadingText);
				loadingText = null;

				this._easeOutScalarHack(
					() => {
						return self.customBg.alpha;
					},
					x => {
						self.customBg.alpha = x;
					},
					0.45,
					0.3,
					3000,
					() => {
						self._initializeAudio(buffer);

						self.scoreDisplay.alpha = 1;
						self.comboDisplay.alpha = 1;

						self._setTimingPointData(self.activeTrack.data['TimingPoints'][0]);
						self._createScheduler();
						self._scheduleHitObjectSpawns();
						self._scheduleTimingPoints();
						self._playTrack();
						self._updateScore();
					}
				);
			});
		});
	}

	_easeOutScalarHack(getter, setter, target, speed, duration, onComplete) {
		let hack = {
			get x() {
				return getter();
			},
			get y() {
				return 0;
			},
			set x(x) {
				setter(x);
			},
			set y(y) {}
		};

		Easing.easeOutQuadAsync(hack, { x: target, y: 0 }, speed, duration, onComplete);
	}

	_initializeAudio(buffer) {
		this.__AUDIOCTX = new AudioContext();
		this.__AUDIOGAIN = this.__AUDIOCTX.createGain();
		this.__AUDIOSRC = this.__AUDIOCTX.createBufferSource();
		this.__AUDIOSRC.buffer = buffer;
		this.__AUDIOSRC.connect(this.__AUDIOGAIN);
		this.__AUDIOGAIN.connect(this.__AUDIOCTX.destination);
	}

	_createDeathParticleSpawner() {
		this.emitterContainer = new PIXI.particles.ParticleContainer();
		this._activeEmitters = [];
		this.emitterContainer.setProperties({
			scale: true,
			position: true,
			rotation: true,
			uvs: true,
			alpha: true
		});
		this.scene.addChild(this.emitterContainer);
	}

	_spawnLargeExplosionParticle(x, y, props) {
		let config = {
			alpha: {
				start: 0.74,
				end: 0
			},
			scale: {
				start: 0.7,
				end: 0.1,
				minimumScaleMultiplier: 1
			},
			color: {
				start: '#e4f9ff',
				end: '#3fcbff'
			},
			speed: {
				start: 400,
				end: 0,
				minimumSpeedMultiplier: 1
			},
			acceleration: {
				x: 0,
				y: 0
			},
			maxSpeed: 0,
			startRotation: {
				min: 0,
				max: 360
			},
			noRotation: false,
			rotationSpeed: {
				min: 0,
				max: 200
			},
			lifetime: {
				min: 0.5,
				max: 1
			},
			blendMode: 'normal',
			ease: [
				{
					s: 0,
					cp: 0.329,
					e: 0.548
				},
				{
					s: 0.548,
					cp: 0.767,
					e: 0.876
				},
				{
					s: 0.876,
					cp: 0.985,
					e: 1
				}
			],
			frequency: 0.001,
			emitterLifetime: 0.1,
			maxParticles: 50,
			pos: {
				x: x,
				y: y
			},
			addAtBack: true,
			spawnType: 'point'
		};

		config = Object.assign(config, props);

		let particleEmitter = new __PIXIPARTICLES.Emitter(this.emitterContainer, t_spark, config);
		let index = this._activeEmitters.push(particleEmitter) - 1;
		EventHandler.ScheduleEvent(
			() => {
				particleEmitter.destroy();
				this._activeEmitters[index] = null;
			},
			500,
			false
		);
	}

	_createAssetLoaderObjectFromRequiredFiles(reqFiles) {
		let correctedFiles = {};
		for (let i = 0; i < reqFiles.length; i++) {
			// soft-hitclap3.wav
			// snd_soft_hitclap
			let key = 'snd_' + reqFiles[i].replace('-', '_');
			key = key.replace('.wav', '');
			key = key.replace('.mp3', '');
			key = key.replace('.ogg', '');

			correctedFiles[key] = 'tracks/' + _SELECTED_OSU_FILE + '/' + reqFiles[i];
		}
		correctedFiles['BG'] = 'tracks/' + _SELECTED_OSU_FILE + '/BG.jpg';
		return correctedFiles;
	}

	addScore(score) {
		this.score += Math.abs(score);
		this._updateScore();
	}

	_updateScore() {
		this.scoreDisplay.text = this.score.toString();
	}

	_updateCombo() {
		this.comboDisplay.text = 'x' + this._currentComboMultiplier.toString();
	}

	_playTrack() {
		this.__trackProgress = 0;
		this._trackClock.start();
		this.__trackInstance = this.__AUDIOSRC.start();
		this.__AUDIOGAIN.gain.setValueAtTime(PIXI.sound.volumeAll * 2, this.__AUDIOCTX.currentTime);
		//this.__trackInstance.on('progress', this._onProgress.bind(this));
	}

	static _calculatePreempt(difficulty) {
		let AR = difficulty['ApproachRate'] | Settings.osuDefaults.ApproachRate;

		if (AR < 5) {
			return 1200 + (600 * (5 - AR)) / 5;
		} else if (AR === 5) {
			return 1200;
		} else if (AR > 5) {
			return 1200 - (750 * (AR - 5)) / 5;
		}

		throw new Error('AR not a number!');
	}

	calculateScore(difficulty, timestamp, sliderVals) {
		return Game_legacy._calculateScore(
			difficulty,
			timestamp,
			sliderVals,
			this._currentComboMultiplier
		);
	}

	static _calculateFadein(difficulty) {
		let AR = difficulty['ApproachRate'] | Settings.osuDefaults.ApproachRate;

		if (AR < 5) {
			return 800 + (400 * (5 - AR)) / 5;
		} else if (AR === 5) {
			return 800;
		} else if (AR > 5) {
			return 800 - (500 * (AR - 5)) / 5;
		}

		throw new Error('AR not a number!');
	}

	static _calculateScoreThreshold(difficulty, timestamp) {
		let OD = difficulty['OverallDifficulty'];
		if (timestamp < 0) timestamp = Math.abs(timestamp);

		if (timestamp < 50 + (30 * (5 - OD)) / 5) {
			return 300;
		} else if (timestamp < 100 + (40 * (5 - OD)) / 5) {
			return 100;
		} else if (timestamp < 50 + (30 * (5 - OD)) / 5) {
			return 50;
		} else {
			return 0;
		}
	}

	calculateScoreThreshold(timestamp) {
		return Game_legacy._calculateScoreThreshold(this.difficulty, timestamp);
	}

	resetCombo() {
		this._currentComboMultiplier = 1;
		this._updateCombo();
	}

	incrementCombo() {
		this._currentComboMultiplier++;
		this._updateCombo();
	}

	/**
	 *
	 * @param difficulty
	 * @param timestamp In milliseconds, the time between click and the perfect hit
	 * @param {Array<Number>} sliderVals
	 * @returns {number}
	 * @private
	 */
	static _calculateScore(difficulty, timestamp, sliderVals, comboMult) {
		let hitValue = Game_legacy._calculateScoreThreshold(difficulty, timestamp);

		if (sliderVals) {
			for (let i = 0; i < sliderVals.length; i++) {
				hitValue += sliderVals[i];
			}
		}

		let diffMult =
			difficulty['CircleSize'] + difficulty['HPDrainRate'] + difficulty['OverallDifficulty'];
		if (diffMult < 5) {
			diffMult = 2;
		} else if (diffMult > 5 && diffMult < 13) {
			diffMult = 3;
		} else if (diffMult > 13 && diffMult < 18) {
			diffMult = 4;
		} else if (diffMult > 18 && diffMult < 24) {
			diffMult = 5;
		} else if (diffMult > 24) {
			diffMult = 6;
		}

		let modMult = 1;

		return Math.floor(hitValue + hitValue * ((comboMult * diffMult * modMult) / 25));
	}

	_createScheduler() {
		this._trackClock = new WebAudioScheduler({
			context: this.__AUDIOCTX,
			interval: 0.0125,
			aheadTime: 0.025
		});
	}

	async _scheduleHitObjectSpawns() {
		for (let k = 0; k < this.activeTrack.data['HitObjects'].length; k++) {
			let current = this.activeTrack.data['HitObjects'][k];

			let timestamp = current.time * 0.001 - this._preempt * 0.001;

			this._trackClock.insert(timestamp, () => {
				let diff = Math.abs(timestamp - this.__AUDIOCTX.currentTime);
				if (diff >= Settings.OSUSettings.timing_threshold) {
					console.warn('Out of timing by %ims', diff * 1000);
				}
				if (diff >= Settings.OSUSettings.timing_hard_threshold) {
					console.warn('Not spawning object because timing exceeds hard threshold');
					return;
				}

				switch (current.type.type) {
					case 'slider':
						this._spawnSlider(current, k);
						break;
					default:
					case 'circle':
						this._spawnCircle(current, k);
						break;
				}
			});
		}
	}

	async _scheduleTimingPoints() {
		for (let i = 1; i < this.activeTrack.data['TimingPoints'].length; i++) {
			let current = this.activeTrack.data['TimingPoints'][i];

			this._trackClock.insert(
				current.offset * 0.001,
				this._setTimingPointData.bind(this),
				current
			);
		}
	}

	_spawnSlider(current, index) {
		//if (current.path.sliderType === 'bezier') return;

		let pos = osuScale(current.x, current.y);
		pos.x += this._offset.x;
		pos.y += this._offset.y;

		if (current.type.isNewCombo) {
			this._currentComboCount = 0;
		}

		if (!index) index = 0;

		let sampleSet = this._activeSampleSet;
		if (
			current['extras'] &&
			current['extras']['sampleSet'] &&
			current['extras']['sampleSet'] !== 'auto'
		) {
			sampleSet = current['extras']['sampleSet'];
		}
		this._currentComboCount += 1;
		this.scene.addChild(
			new SliderHitObject(
				pos.x,
				pos.y,
				current.type,
				{
					comboNumber: this._currentComboCount,
					z: this.activeTrack.data['HitObjects'].length - index,
					offset: this._offset,
					fadein: this._fadein,
					preempt: this._preempt,
					path: current.path,
					circleSize: this._circleSize,
					repeat: current.repeat,
					mpb: this._activeMPB,
					tickRate: this.activeTrack.data['Difficulty']['SliderTickRate'],
					tickerSound: this._getTickerSound(),
					sliderSound: this._getSliderSound(current),
					edgeSounds: this._getEdgeHitSounds(current),
					defaultSound: global[('snd_' + sampleSet + '_hit' + 'normal').toLowerCase()],
					duration:
						(current.pixelLength /
							(100.0 * this.activeTrack.data['Difficulty']['SliderMultiplier'])) *
						this._activeMPB,
					playLargeParticleEffect: (x, y, color) => {
						this._spawnLargeExplosionParticle(x, y, color);
					}
				},
				{ game: this }
			)
		);
	}

	_spawnCircle(current, index) {
		let pos = osuScale(current.x, current.y);
		pos.x += this._offset.x;
		pos.y += this._offset.y;
		if (current.type.isNewCombo) {
			this._currentComboCount = 0;
		}
		if (!index) index = 0;

		this.scene.addChild(
			new CircleHitObject(
				pos.x,
				pos.y,
				current.type,
				{
					z: this.activeTrack.data['HitObjects'].length - index,
					offset: this._offset,
					fadein: this._fadein,
					preempt: this._preempt,
					comboNumber: ++this._currentComboCount,
					circleSize: this._circleSize,
					hitSounds: this._getHitSound(current),
					playLargeParticleEffect: (x, y, color) => {
						this._spawnLargeExplosionParticle(x, y, color);
					}
				},
				{ game: this }
			)
		);
	}

	_getHitSound(entry) {
		let result = [];

		for (let k in entry['hitSound']) {
			if (entry['hitSound'][k] === true || k === 'normal') {
				let sampleSet = this._activeSampleSet;
				if (
					entry['extras'] &&
					entry['extras']['sampleSet'] &&
					entry['extras']['sampleSet'] !== 'auto'
				) {
					sampleSet = entry['extras']['sampleSet'];
				}
				let file = (
					'snd_' +
					sampleSet +
					'_hit' +
					k +
					(this._activeSampleIndex <= 1 ? '' : this._activeSampleIndex.toString())
				).toLowerCase();

				if (global.hasOwnProperty(file)) {
					result.push(global[file]);
				} else {
					file = ('snd_' + this._activeSampleSet + '_hit' + k + '').toLowerCase();

					if (global.hasOwnProperty(file)) result.push(global[file]);
					else console.error('Hitsound invalid! ' + file);
				}
			}
		}

		return result;
	}

	_getTickerSound() {
		let file = ('snd_' + this._activeSampleSet + '_slidertick').toLowerCase();
		if (global.hasOwnProperty(file)) {
			return global[file];
		} else {
			console.error('Hitsound invalid! ' + file);
		}
	}

	_getSliderSound(entry) {
		let result = [];

		for (let k in entry['hitSound']) {
			if (entry['hitSound'][k] === true) {
				let file = ('snd_' + this._activeSampleSet + '_slider' + k).toLowerCase();

				if (global.hasOwnProperty(file)) {
					result.push(global[file]);
				} else {
					console.error('Hitsound invalid! ' + file);
				}
			}
		}

		return result;
	}

	_getEdgeHitSounds(entry) {
		let result = [];

		let sampleSet = this._activeSampleSet;
		if (
			entry['extras'] &&
			entry['extras']['sampleSet'] &&
			entry['extras']['sampleSet'] !== 'auto'
		) {
			sampleSet = entry['extras']['sampleSet'];
		}

		for (let i in entry['edgeHitsounds']) {
			result[i] = [];
			for (let k in entry['edgeHitsounds'][i]) {
				if (entry['edgeHitsounds'][i][k] === true && k !== 'normal') {
					let file = (
						'snd_' +
						sampleSet +
						'_hit' +
						k +
						(this._activeSampleIndex <= 1 ? '' : this._activeSampleIndex.toString())
					).toLowerCase();
					if (global.hasOwnProperty(file)) {
						result[i].push(global[file]);
					} else {
						file = ('snd_' + this._activeSampleSet + '_hit' + k + '').toLowerCase();

						if (global.hasOwnProperty(file)) result[i].push(global[file]);
						else console.error('Hitsound invalid! ' + file);
					}
				}
			}
		}

		return result;
	}

	_setTimingPointData(tpoint) {
		let tempTpoint = null;
		if (tpoint.args) tempTpoint = tpoint.args;
		else tempTpoint = tpoint;

		this._activeMPB = tempTpoint.mpb;
		this._activeMeter = tempTpoint.meter;
		this._activeSampleSet = tempTpoint.sampleSet;
		this._activeSampleIndex = tempTpoint.sampleIndex;

		if (PIXI.sound) PIXI.sound.volumeAll = tempTpoint.volume * 0.01 * this.globalVolume;

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

	get activeTrack() {
		return this._osuFile;
	}

	endStep(delta) {
		'use strict';
		super.endStep(delta);

		for (let i = 0; i < this._activeEmitters.length; i++) {
			if (this._activeEmitters[i]) {
				this._activeEmitters[i].update(delta * 0.001);
			}
		}

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

module.exports = Game_legacy;
