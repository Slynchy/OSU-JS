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
		super(t_whiteCircle);

		this.interactive = true;

		this.x = x;
		this.y = y;
		this.z = 50;
		this.type = type;
		this.hitsound = hitsound;

		this.width = 100;
		this.height = 100;
		this.alpha = 0;

		this.fadein = 0;
		this.preempt = 0;
		this._startTime = Date.now();
		Object.assign(this, metadata);

		this.on('pointerdown', this.onClick);

		if (props) {
			Object.assign(this, props);
		}
	}

	onClick() {
		this.destroy();
	}

	endStep(dt) {
		if (this.alpha < 1) this.alpha += dt / this.fadein;
		else this.alpha = 1;

		if (Date.now() - this._startTime >= this.preempt) {
			this.destroy();
		}
	}
}

module.exports = CircleHitObject;
