let PIXI = require('pixi.js');

class OSZHandler {
	constructor() {
		throw new Error("don't instantiate this");
	}

	/**
	 * @param {Object} osujson The output from an osu file parsed with osu-json
	 * @constructor
	 */
	static HandleOSUFile(osujson) {
		if (typeof AssetLoader === 'undefined')
			throw new Error('Asset loader must be initialized!');

		return new Promise((resolve, reject) => {
			// assume there's a video for now
			let result = {};

			//result.videoTexture = PIXI.Texture.fromVideoUrl('assets/STYX_HELIX/VIDEO.flv');

			AssetLoader.LoadAssetsFromAssetList({
				//STYX_HELIX_MP3: 'STYX_HELIX/' + osujson['General']['AudioFilename'],
				STYX_HELIX_BG: 'STYX_HELIX/BG.jpg'
			})
				.then(resources => {
					result.track = null; //STYX_HELIX_MP3;
					result.bg = STYX_HELIX_BG;
					result.data = osujson;
					resolve(result);
				})
				.catch(err => {
					console.error(err);
					reject(err);
				});
		});
	}
}

module.exports = OSZHandler;
