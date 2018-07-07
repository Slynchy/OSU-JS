let Token = FBEngine.Token;
let GameObject = FBEngine.GameObject;
let Text = FBEngine.Text;
let ContainerObject = FBEngine.ContainerObject;
let Button = FBEngine.Button;
let AudioLoader = require('audio-loader');
const OsuCommon = require('./OsuCommon.js');

class Game extends Token {
	constructor(osuFile, props){
		super({});

		this._osuFile = osuFile;
		this.name = 'osu!mania token';
		this.scene = new ContainerObject();
		this.sfxVolume = Settings.audioSettings.sfxVolume;
		this.musicVolume = Settings.audioSettings.musicVolume;

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

		if (props)
			Object.assign(this, props);
	}

	loadRequiredAssets(reqFiles){
		return AssetLoader.LoadAssetsFromAssetList(
			OsuCommon.createAssetLoaderObjectFromRequiredFiles(reqFiles)
		);
	}

	loadAudioBuffer(path){
		return AudioLoader(path);
	}

	get activeTrack(){
		return this._osuFile;
	}

	/**
	 * @deprecated
	 * @static
	 * @param {number} val
	 */
	static set volume(val){
		if (PIXI.sound)
			PIXI.sound.volumeAll = val;
	}

	setup(){
		let self = this;
		this.loadRequiredAssets(this.activeTrack.data['RequiredFiles'])
			.then((resources)=>{
				this.loadAudioBuffer(
					`./assets/tracks/${
						_SELECTED_OSU_FILE
					}/${
						this.activeTrack.data['General']['AudioFilename']
					}`)
						.then((buffer)=>{
							OsuCommon.initializeAudioCTX(buffer, self);

							OsuCommon.setTimingPointData(self.activeTrack.data['TimingPoints'][0], self);
							OsuCommon.createScheduler(self);
							//self._scheduleHitObjectSpawns();
							//self._scheduleTimingPoints();
							OsuCommon.playTrack(self.musicVolume, self);
							//self._updateScore();
							console.log("SETUP! (∩´∀｀)∩");
						}
					);
			}
		);
	}

	onAdd(){
		Application.stage.addChild(this.scene);

		this.setup();
	}

	onRemove(){
		Application.stage.removeChild(this.scene);
		FlowController.game = null;
	}
}

module.exports = Game;