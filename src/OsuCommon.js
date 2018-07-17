let WebAudioScheduler = require('web-audio-scheduler');

/**
 * Class of common functions between Osu! game types (currently legacy/regular and osu!mania)
 */
class OsuCommon {
	constructor() {
		console.warn('OsuCommon should not be instantiated!');
	}

	static log(str) {
		if (Settings.DEBUG.enabled === true) {
			console.log(`[OsuCommon] - ${str}`);
		}
	}

	static warn(str) {
		if (Settings.DEBUG.enabled === true) {
			console.warn(`[OsuCommon] - ${str}`);
		}
	}

	static error(str) {
		if (Settings.DEBUG.enabled === true) {
			console.error(`[OsuCommon] - ${str}`);
		}
	}

	/**
	 * @param entry
	 * @param activeSampleSet
	 * @param activeSampleIndex
	 * @param requiredAssets
	 * @returns {Array}
	 * @private
	 */
	static getHitSound(entry, activeSampleSet, activeSampleIndex, requiredAssets) {
		let result = [];
		if(!requiredAssets) requiredAssets = {};

		for (let k in entry['hitSound']) {
			if (entry['hitSound'][k] === true || k === 'normal') {
				let sampleSet = activeSampleSet;
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
					(activeSampleIndex <= 1 ? '' : activeSampleIndex.toString())
				).toLowerCase();

				if(entry['extras'] && entry['extras']['filename'].indexOf('.wav') !== -1 && requiredAssets.hasOwnProperty(entry['extras']['filename'])){
					result.push(requiredAssets[entry['extras']['filename']].sound);
				} else if (requiredAssets.hasOwnProperty(file)) {
					result.push(requiredAssets[file].sound);
				} else if(global.hasOwnProperty(file)){
					result.push(global[file]);
				} else {
					file = ('snd_' + activeSampleIndex + '_hit' + k + '').toLowerCase();

					if (global.hasOwnProperty(file)) result.push(global[file]);
					else console.error('Hitsound invalid! ' + file);
				}
			}
		}

		return result;
	}

	static initializeAudioCTX(buffer, context) {
		if (!context) throw new Error('Requires context!');

		(function _initializeAudioCTX() {
			OsuCommon.log('initializeAudioCTX');
			this.__AUDIOCTX = new AudioContext();
			this.__AUDIOGAIN = this.__AUDIOCTX.createGain();
			this.__AUDIOSRC = this.__AUDIOCTX.createBufferSource();
			this.__AUDIOSRC.buffer = buffer;
			this.__AUDIOSRC.connect(this.__AUDIOGAIN);
			this.__AUDIOGAIN.connect(this.__AUDIOCTX.destination);
		}.bind(context)());
	}

	static createDeathParticleSpawner(container, context) {
		(function _createDeathParticleSpawner() {
			if (this.emitterContainer) {
				console.warn('Already created death particle spawner!');
				return;
			}

			this.emitterContainer = new PIXI.particles.ParticleContainer();
			this._activeEmitters = [];
			this.emitterContainer.setProperties({
				scale: true,
				position: true,
				rotation: true,
				uvs: true,
				alpha: true
			});
			container.addChild(this.emitterContainer);
		}.bind(context)());
	}

	static calculatePreempt(difficulty) {
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

	static calculateScoreThreshold(difficulty, timestamp) {
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

	static calculateFadein(difficulty) {
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

	static createAssetLoaderObjectFromRequiredFiles(reqFiles, hitobjects) {
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

		if(hitobjects){
			for(let i = 0; i < hitobjects.length; i++){
				let current = hitobjects[i].extras;
				if(!current) continue;

				if(current.filename.indexOf('.wav') === -1){
					continue;
				}

				if(!correctedFiles.hasOwnProperty(current.filename)){
					correctedFiles[current.filename] = 'tracks/' + _SELECTED_OSU_FILE + '/' + current.filename;
				}
			}
		}

		correctedFiles['BG'] = 'tracks/' + _SELECTED_OSU_FILE + '/BG.jpg';
		return correctedFiles;
	}

	static createScheduler(context) {
		(function _createScheduler() {
			OsuCommon.log('createScheduler');
			if (!this.__AUDIOCTX) {
				throw new Error('Requires audioCTX to be initialized!');
			}
			this._trackClock = new WebAudioScheduler({
				context: this.__AUDIOCTX,
				interval: 0.0125,
				aheadTime: 0.025
			});
		}.bind(context)());
	}

	static playTrack(volume, context) {
		(function _playTrack() {
			OsuCommon.log('playTrack');
			this.__trackProgress = 0;
			this._trackClock.start();
			this.__trackInstance = this.__AUDIOSRC.start();
			this.__AUDIOGAIN.gain.setValueAtTime(volume, this.__AUDIOCTX.currentTime);
		}.bind(context)());
	}

	static setTimingPointData(tpoint, context) {
		(function _setTimingPointData() {
			OsuCommon.log('setTimingPointData');
			let tempTpoint = null;
			if (tpoint.args) tempTpoint = tpoint.args;
			else tempTpoint = tpoint;

			this._activeMPB = tempTpoint.mpb;
			this._activeMeter = tempTpoint.meter;
			this._activeSampleSet = tempTpoint.sampleSet;
			this._activeSampleIndex = tempTpoint.sampleIndex;

			if (PIXI.sound) PIXI.sound.volumeAll = tempTpoint.volume * 0.01 * 1;//this.globalVolume;

			tpoint.done = true;
		}.bind(context)());
	}
}

module.exports = OsuCommon;
