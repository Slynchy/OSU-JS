let Token = FBEngine.Token;
let GameObject = FBEngine.GameObject;
let Text = FBEngine.Text;
let ContainerObject = FBEngine.ContainerObject;
let Button = FBEngine.Button;
let ManiaLane = require('./Objects/ManiaLane.js');
let AudioLoader = require('audio-loader');
const OsuCommon = require('./OsuCommon.js');

class Game extends Token {
	constructor(osuFile, props) {
		super({});

		this._osuFile = osuFile;
		this.name = 'osu!mania token';
		this.scene = new ContainerObject();
		this.sfxVolume = Settings.audioSettings.sfxVolume;
		this.musicVolume = Settings.audioSettings.musicVolume;

		this._numOfLanes = 3;
		this._isSetup = false;
		this._currentComboCount = 0;
		this._difficulty = this.activeTrack.data['Difficulty'];
		this._overallDifficulty = this.activeTrack.data['Difficulty']['OverallDifficulty'];
		this._fadein = OsuCommon.calculateFadein(this.activeTrack.data['Difficulty']);
		this._preempt = OsuCommon.calculatePreempt(this.activeTrack.data['Difficulty']);
		this._activeMPB = 1000;
		this._activeSampleSet = 'normal';
		this._activeSampleIndex = 0;

		OsuCommon.createDeathParticleSpawner(this.scene, this);
		this.createLanes(this._numOfLanes);

		if (props) Object.assign(this, props);
	}

	loadRequiredAssets(reqFiles) {
		return AssetLoader.LoadAssetsFromAssetList(
			OsuCommon.createAssetLoaderObjectFromRequiredFiles(reqFiles)
		);
	}

	getLane(index) {
		if (index >= this._lanes.length) {
			throw new Error("Can't access out of bounds lane");
		} else return this._lanes[index];
	}

	loadAudioBuffer(path) {
		return AudioLoader(path);
	}

	get activeTrack() {
		return this._osuFile;
	}

	/**
	 * @deprecated
	 * @static
	 * @param {number} val
	 */
	static set volume(val) {
		if (PIXI.sound) PIXI.sound.volumeAll = val;
	}

	setup() {
		let self = this;
		this.loadRequiredAssets(this.activeTrack.data['RequiredFiles']).then(resources => {
			this.loadAudioBuffer(
				`./assets/tracks/${_SELECTED_OSU_FILE}/${
					this.activeTrack.data['General']['AudioFilename']
				}`
			).then(buffer => {
				OsuCommon.initializeAudioCTX(buffer, self);

				OsuCommon.setTimingPointData(self.activeTrack.data['TimingPoints'][0], self);
				OsuCommon.createScheduler(self);
				self._scheduleHitObjectSpawns(self).then(() => {
					console.log('Hitobjects scheduled');
				});
				self._scheduleTimingPoints(self).then(() => {
					console.log('Tpoints scheduled');
				});
				OsuCommon.playTrack(self.musicVolume, self);
				//self._updateScore();
				console.log('SETUP! (∩´∀｀)∩');
			});
		});
	}

	async _scheduleHitObjectSpawns(context) {
		for (let k = 0; k < context.activeTrack.data['HitObjects'].length; k++) {
			let current = context.activeTrack.data['HitObjects'][k];

			let timestamp = current.time * 0.001 - context._preempt * 0.001;

			context._trackClock.insert(timestamp, () => {
				let diff = Math.abs(timestamp - context.__AUDIOCTX.currentTime);
				if (diff >= Settings.OSUSettings.timing_threshold) {
					console.warn('Out of timing by %ims', diff * 1000);
				}
				if (diff >= Settings.OSUSettings.timing_hard_threshold) {
					console.warn('Not spawning object because timing exceeds hard threshold');
					return;
				}

				// TODO: spawncode
			});
		}
	}

	async _scheduleTimingPoints(context) {
		for (let i = 1; i < context.activeTrack.data['TimingPoints'].length; i++) {
			let current = context.activeTrack.data['TimingPoints'][i];

			let data = Object.assign({}, current);
			data.context = context;

			context._trackClock.insert(current.offset * 0.001, context._setTimingPointData, data);
		}
	}

	/**
	 * Hacky function to fix arguments problems with web audio tracker module
	 * @param {Object} data
	 * @param {Object} data.args
	 * @param {Object} data.context
	 * @private
	 */
	_setTimingPointData(data) {
		OsuCommon.setTimingPointData(data.args, data.args.context);
	}

	createLanes(numOfLanes) {
		this._lanes = [];

		for (let i = 0; i < numOfLanes; i++) {
			let tempLane = new ManiaLane(i, {
				numOfLanes: numOfLanes
			});
			tempLane.x = tempLane.width * i;
			this._lanes.push(this.scene.addChild(tempLane));
		}
	}

	onAdd() {
		Application.stage.addChild(this.scene);
		this.setup();
	}

	onRemove() {
		Application.stage.removeChild(this.scene);
		FlowController.game = null;
	}
}

module.exports = Game;
