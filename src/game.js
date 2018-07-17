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

		if(this.activeTrack.data['General']['Mode'] != 3){
			//throw new Error("Not mania mode!");
		}

		this._isSetup = false;
		this._currentComboCount = 0;
		this._difficulty = this.activeTrack.data['Difficulty'];
		this._numOfLanes = this._difficulty['CircleSize'];
		this._overallDifficulty = this._difficulty['OverallDifficulty'];
		this._fadein = OsuCommon.calculateFadein(this.activeTrack.data['Difficulty']);
		this._preempt = OsuCommon.calculatePreempt(this.activeTrack.data['Difficulty']);
		this._activeMPB = 1000;
		this._activeSampleSet = 'normal';
		this._activeSampleIndex = 0;
		this._lanes = [];

		OsuCommon.createDeathParticleSpawner(this.scene, this);
		this.createLanes(this._numOfLanes);

		document.addEventListener("keypress", (e)=>{
			let lane;
			if(e.keyCode-49 >= this._lanes.length) return;
			else {
				lane = this._lanes[e.keyCode-49];
			}
			lane._hitNote();
			lane.button.setTexture(lane.button.downstateTexture);
		});

		document.addEventListener("keyup", (e)=>{
			let lane;
			if(e.keyCode-49 >= this._lanes.length) return;
			else {
				lane = this._lanes[e.keyCode-49];
			}
			lane.button.setTexture(lane.button.upstateTexture);
		});

		if (props) Object.assign(this, props);
	}

	loadRequiredAssets(reqFiles, hitobjects) {
		return AssetLoader.LoadAssetsFromAssetList(
			OsuCommon.createAssetLoaderObjectFromRequiredFiles(reqFiles,hitobjects)
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
		this.loadRequiredAssets(
			this.activeTrack.data['RequiredFiles'],
			this.activeTrack.data['HitObjects']
		).then(resources => {
			console.log(resources);
			this._requiredAssets = resources;
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

				let lane = Math.clamp(
					Math.floor(current.x / Math.floor(512 / this._numOfLanes)),
					0,
					this._numOfLanes
				);

				let isHoldNote = current.type.isOsuMania;

				//console.log("Spawning object %O in lane %i", current, lane);
				//console.log();
				this.spawnNote(lane, isHoldNote, current);
			});
		}
	}

	spawnNote(lane, isHoldNote, data){
		console.log(`Spawning note with sampleset ${this._activeSampleSet}, sample index ${this._activeSampleIndex}, with the following sounds:`);
		return this._lanes[lane].spawnNote(isHoldNote, {
			spawnTime: Date.now(),
			hitSounds: OsuCommon.getHitSound(data, this._activeSampleSet, this._activeSampleIndex, this._requiredAssets),
			fadein: this._fadein,
			preempt: this._preempt
		});
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
				numOfLanes: numOfLanes,
				game: this
			});
			tempLane.x = tempLane.width * i;
			this.scene.addChild(tempLane);
			this._lanes.push(tempLane);
		}
	}

	onAdd() {
		Application.stage.addChild(this.scene);
		this.setup();
	}

	endStep(dt){
		this.scene.endStep(dt);
	}

	onRemove() {
		Application.stage.removeChild(this.scene);
		FlowController.game = null;
	}
}

module.exports = Game;
