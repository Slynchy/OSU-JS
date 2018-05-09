let GameObject = require('../engine/GameObject.js');
let Text = require('../engine/Text.js');

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
		super(t_whiteCircle);

		this.fadein = 0;
		this.preempt = 0;
		this.circleSize = 0;
		this.comboNumber = 0;
		this.hitSounds = null;
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

		this.glow = new GameObject(t_circle_glow, {});
		this.addChild(this.glow);
		this.glow.width *= 0.9;
		this.glow.height *= 0.9;
		this.glow.x = -(this.glow.width / 2);
		this.glow.y = -(this.glow.height / 2);

		this.comboText = new Text({
			text: this.comboNumber.toString(),
			style: new PIXI.TextStyle({
				align: 'center',
				fontSize: osuScale(54)
			})
		});
		this.addChild(this.comboText);

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

	_playSFX() {
		for (let i = 0; i < this.hitSounds.length; i++) {
			this.hitSounds[i].play();
		}
	}

	onClick() {
		this._playSFX();

		let timeOffset = this.preempt * this._progressPreempt;
		timeOffset = this.preempt - timeOffset;
		// if timeOffset is negative it's fine

		let score = this.game.calculateScore(this.game.difficulty, timeOffset);

		if (this.game) {
			this.game.addScore(score);
		} else {
			throw new Error('No game reference on object!');
		}

		this.destroy();
	}

	endStep(dt) {
		if (this._progressPreempt < 1) {
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
