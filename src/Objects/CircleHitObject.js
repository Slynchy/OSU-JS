let GameObject = require('../engine/GameObject.js');

class CircleHitObject extends GameObject {
	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 * @param type
	 * @param {PIXI.Sound | string} [hitsound]
	 * @param metadata
	 * @param {Object} [props]
	 */
	constructor(x, y, type, hitsound, metadata, props) {
		super(t_circleOutline);

		this.fadein = 0;
		this.preempt = 0;
		this.circleSize = 0;
		this._startTime = Date.now();
		Object.assign(this, metadata);

		this.interactive = true;

		this.anchor.x = 0.5;
		this.anchor.y = 0.5;

		this.x = x;
		this.y = y;
		this.z = 50;
		this.type = type;
		this.hitsound = hitsound;
		this.alpha = 0;
		this._progressPreempt = 0;

		this.width = this.height = this.circleSize;

		this.outline = new GameObject(t_circleOutline, {
			width: this.width,
			height: this.height
		});
		this.outline.scale.x = 3;
		this.outline.scale.y = 3;
		this.outline.anchor.x = 0.5;
		this.outline.anchor.y = 0.5;
		this.addChild(this.outline);

		this.on('pointerdown', this.onClick);

		if (props) {
			Object.assign(this, props);
		}
	}

	onClick() {
		snd_hitclap.sound.play();

		if (this.game) {
			this.game.addScore(50);
		} else {
			throw new Error('No game reference on object!');
		}

		this.destroy();
	}

	endStep(dt) {
		if (this.alpha < 1) this.alpha += dt / this.fadein;
		else this.alpha = 1;

		if (this._progressPreempt < 1) this._progressPreempt += dt / this.preempt;
		else {
			this._progressPreempt = 1;
		}

		this.outline.scale.x = 3 - 2 * this._progressPreempt;
		this.outline.scale.y = 3 - 2 * this._progressPreempt;

		if (Date.now() - this._startTime >= this.preempt) {
			this.destroy();
		}
	}
}

module.exports = CircleHitObject;
