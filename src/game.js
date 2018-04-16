let Token = require('./engine/Token.js');
let GameObject = require('./engine/GameObject.js');
let Text = require('./engine/Text.js');
let ContainerObject = require('./engine/ContainerObject.js');
let Button = require('./engine/Button.js');
let CircleHitObject = require('./Objects/CircleHitObject.js');
let NineSliceObject = require('./engine/NineSliceObject.js');
let SliderHitObject = require('./Objects/SliderHitObject.js');

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
		this._circleSize = 54.4 - 4.48 * this.activeTrack.data['Difficulty']['CircleSize'];

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
							{}
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
							{}
						);
						break;
				}

				this.scene.addChild(obj);

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
