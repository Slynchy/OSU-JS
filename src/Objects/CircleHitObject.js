let GameObject = require('../engine/GameObject.js');

class CircleHitObject extends GameObject {
	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 * @param type
	 * @param metadata
	 * @param {Object} [props]
	 */
	constructor(x, y, type, metadata, props) {
		super(t_circleOutline);

		this.fadein = 0;
		this.preempt = 0;
		this.circleSize = 0;
		this.hitsound = null;
		Object.assign(this, metadata);

		this.interactive = true;

		this.anchor.x = 0.5;
		this.anchor.y = 0.5;

		this.x = x;
		this.y = y;
		this.z = 50;
		this.type = type;
		this.alpha = 0;
		this._progressPreempt = 0;

		this.width = this.height = this.circleSize;

		// this.hitRadius = new GameObject(t_circleOutline, {
		// 	width: this.width,
		// 	height: this.height
		// });
		// this.hitRadius.scale.x = this.hitRadius.scale.y = 3 - (2 * (this.fadein / this.preempt));
		// this.hitRadius.anchor.x = this.hitRadius.anchor.y = 0.5;
		// this.hitRadius.alpha = 0.5;
		// this.addChild(this.hitRadius);

		this.outline = new GameObject(t_circleOutline, {
			width: this.width,
			height: this.height
		});
		this.outline.scale.x = this.outline.scale.y = 3;
		this.outline.anchor.x = this.outline.anchor.y = 0.5;
		this.addChild(this.outline);

		this.on('pointerdown', this.onClick);

		if (props) {
			Object.assign(this, props);
		}
	}

	onClick() {

		if(this.hitsound)
			this.hitsound.play();

		let timeOffset = this.preempt * this._progressPreempt;
		timeOffset = this.preempt - timeOffset;
		// if timeOffset is negative it's fine

		let score = this.game.calculateScore(this.game.overallDifficulty, timeOffset);

		if (this.game) {
			this.game.addScore(score);
		} else {
			throw new Error('No game reference on object!');
		}

		this.destroy();
	}

	endStep(dt) {

		if(this._progressPreempt < 1){
			if (this.alpha < 1) this.alpha += dt / this.fadein;
			else this.alpha = 1;
		} else {
			this.alpha = 3 - 2 * this._progressPreempt;
		}

		this._progressPreempt += dt / this.preempt;

		this.outline.scale.x = this.outline.scale.y = 3 - 2 * this._progressPreempt;

		if (this.outline.scale.x <= 0) {
			this.destroy();
		}
	}
}

module.exports = CircleHitObject;
