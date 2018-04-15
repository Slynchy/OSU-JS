let Token = require('./engine/Token.js');
let GameObject = require('./engine/GameObject.js');
let Text = require('./engine/Text.js');
let ContainerObject = require('./engine/ContainerObject.js');
let Button = require('./engine/Button.js');
let CircleHitObject = require('./Objects/CircleHitObject.js');

class Game extends Token {
	constructor(osuFile, props) {
		super({});

		/*
			Game variables go here
		 */
		this.name = 'Game';
		this.scene = new ContainerObject();
		this._osuFile = osuFile;

		this._fadein = this._calculateFadein(this.activeTrack.data['Difficulty']);
		this._preempt = this._calculatePreempt(this.activeTrack.data['Difficulty']);

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

		this.__trackProgress = 0;
		this.__trackInstance = this.activeTrack.track.play();
		this.__trackInstance.on('progress', this._onProgress.bind(this));

		Application.stage.addChild(this.scene);

		if (props) Object.assign(this, props);
	}

	_calculatePreempt(difficulty) {
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

	_calculateFadein(difficulty) {
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

	_onProgress(progress) {
		this.__trackProgress = progress;

		let time = this.__trackProgress * this.activeTrack.track.duration;

		for (let k in this.activeTrack.data['HitObjects']) {
			let current = this.activeTrack.data['HitObjects'][k];

			//if(current.type.type !== 'circle') continue;

			if (Math.floor(time * 1000) > current.time - 0 && !current.spawned) {
				console.log(current.type.type);
				this.scene.addChild(
					new CircleHitObject(
						current.x,
						current.y,
						current.type,
						'hitsound',
						{
							fadein: this._fadein,
							preempt: this._preempt
						},
						{}
					)
				);
				current.spawned = true;
			}
		}
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
