let NineSliceObject = require('../engine/NineSliceObject.js');
let ContainerObject = require('../engine/ContainerObject.js');
let GameObject = require('../engine/GameObject.js');
let Text = require('../engine/Text.js');

class SliderHitObject extends ContainerObject {
	static get Directions() {
		return {
			FORWARD: false,
			BACKWARD: true
		};
	}

	constructor(x, y, type, metadata, props) {
		super({});

		this.fadein = 0;
		this.preempt = 0;
		this.circleSize = 0;
		this.repeat = 0;
		this.mpb = 0;
		this.edgeSounds = [];
		this.tickerSound = null;
		this.comboNumber = 0;
		Object.assign(this, metadata);

		this.ticks = [];
		this.numberOfTicks = Math.floor(
			this.duration / (this.mpb === 0 ? this.duration * 2 : this.mpb)
		);
		if (this.numberOfTicks > 0) {
			for (let i = 0; i < this.numberOfTicks; i++) {
				this.ticks.push({
					done: false,
					timestamp: this.mpb * i + 1
				});
			}
		}

		this._clicked = false;
		this._repeatCounter = 0;

		this.x = x;
		this.y = y;
		this._pointerDown = null;

		this.bg = new PIXI.Graphics();
		this.addChild(this.bg);
		if (this.path['end']) {
			this.path['end'] = osuScale(this.path['end']);

			// todo FIX THIS
			this.bg
				.lineStyle(5, 0xff0000)
				.moveTo(0, 0)
				.lineTo(this.path['end'].x - this.x, this.path['end'].y - this.y);
		}

		if (this.repeat > 1) {
			this.currentArrow = new GameObject(t_arrows, {
				x: this.path['end'].x - this.x,
				y: this.path['end'].y - this.y,
				_sliderPos: 'end',
				rotation:
					Math.atan2(this.path['end'].y - this.y, this.path['end'].x - this.x) - Math.PI
			});
			this.currentArrow.anchor.y = 0.5;
			this.currentArrow.scale.x = osuScale(0.2, 0.2).x;
			this.currentArrow.scale.y = osuScale(0.2, 0.2).y;
			this.addChild(this.currentArrow);
		}

		this.target = new GameObject(t_whiteCircle, {
			width: this.circleSize,
			height: this.circleSize,
			interactive: true
		});
		this.target.on('pointerdown', this._handlePointerDown.bind(this));
		this.target.on('pointerup', this._handlePointerUp.bind(this));
		this.target.on('pointerupoutside', this._handlePointerUp.bind(this));
		this.target.on('pointerout', this._handlePointerOut.bind(this));
		this.target.on('pointermove', this._handlePointerMove.bind(this));
		this.target.anchor.y = 0.5;
		this.target.anchor.x = 0.5;
		this.target._progress = 0;
		this.addChild(this.target);

		this.emitterContainer = new PIXI.particles.ParticleContainer();
		this.emitterContainer.setProperties({
			scale: true,
			position: true,
			rotation: true,
			uvs: true,
			alpha: true
		});
		this.particleEmitter = new __PIXIPARTICLES.Emitter(this.emitterContainer, t_spark, {
			alpha: {
				start: 1,
				end: 0
			},
			scale: {
				start: 0.5,
				end: 0.3,
				minimumScaleMultiplier: 1
			},
			color: {
				start: '#e4f9ff',
				end: '#3fcbff'
			},
			speed: {
				start: 50,
				end: 50,
				minimumSpeedMultiplier: 1
			},
			acceleration: {
				x: 0,
				y: 0
			},
			maxSpeed: 0,
			startRotation: {
				min: 0,
				max: 360
			},
			noRotation: false,
			rotationSpeed: {
				min: 0,
				max: 0
			},
			lifetime: {
				min: 0.2,
				max: 0.7
			},
			blendMode: 'normal',
			frequency: 0.001,
			emitterLifetime: -1,
			maxParticles: 500,
			pos: {
				x: 0,
				y: 0
			},
			addAtBack: false,
			spawnType: 'circle',
			spawnCircle: {
				x: 0,
				y: 0,
				r: 0
			}
		});
		this.addChild(this.emitterContainer);

		this.glow = new GameObject(t_circle_glow, {});
		this.target.addChild(this.glow);
		this.glow.width *= 0.9;
		this.glow.height *= 0.9;
		this.glow.x = -(this.glow.width / 2);
		this.glow.y = -(this.glow.height / 2);

		this.comboText = new Text({
			text: this.comboNumber.toString(),
			style: new PIXI.TextStyle({
				align: 'center',
				fontSize: osuScale(18)
			})
		});
		this.addChild(this.comboText);

		this.direction = SliderHitObject.Directions.FORWARD;

		this.alpha = 0;
		this._progressFadeIn = 0;
		this._progressPreempt = 0;

		this.outline = new GameObject(t_circleOutline, {
			width: this.target.width,
			height: this.target.height
		});
		this.outline.scale.x = 3;
		this.outline.scale.y = 3;
		this.outline.anchor.x = 0.5;
		this.outline.anchor.y = 0.5;
		this.target.addChild(this.outline);

		if (props) Object.assign(this, props);
	}

	expire() {
		console.warn('expire');
		this.destroy();
	}

	endStep(dt) {
		this.comboText.x = this.target.x - 7;
		this.comboText.y = this.target.y - 15;

		if (this.particleEmitter && this._clicked) {
			this.particleEmitter.updateSpawnPos(this.target.x, this.target.y);
			this.particleEmitter.update(dt * 0.001);
		}

		if (this._progressPreempt < 1) {
			if (this.alpha < 1) this.alpha += dt / this.fadein;
			else this.alpha = 1;
		} else {
			this.alpha = 3 - 2 * this._progressPreempt;
		}

		if (!this._clicked) {
			this._progressPreempt += dt / this.preempt;
			this.outline.scale.x = this.outline.scale.y = 3 - 2 * this._progressPreempt;

			if (this.outline.scale.x <= 0) {
				this.expire();
				return;
			}
		} else {
			this.outline.alpha = 0;
		}

		if (this._clicked) {
			this.target._progress += dt / this.duration;

			if (this.target._progress >= 1) {
				if (this._repeatCounter + 1 >= this.repeat) {
					this.score();
					return;
				} else {
					this.reverseDirection();
				}
			}

			if (this.direction === SliderHitObject.Directions.FORWARD) {
				this.target.x = lerp(0, this.path['end'].x - this.x, this.target._progress);
				this.target.y = lerp(0, this.path['end'].y - this.y, this.target._progress);
			} else if (this.direction === SliderHitObject.Directions.BACKWARD) {
				this.target.x = lerp(this.path['end'].x - this.x, 0, this.target._progress);
				this.target.y = lerp(this.path['end'].y - this.y, 0, this.target._progress);
			}

			for (let i = 0; i < this.numberOfTicks; i++) {
				if (
					this.target._progress * this.duration > this.ticks[i].timestamp &&
					this.ticks[i].done === false
				) {
					this.ticks[i].done = true;
				}
			}
		}
	}

	onDestroy() {
		this._stopTickerSFX();
	}

	reverseDirection() {
		this.direction = !this.direction;
		this.target._progress = 0;
		this._playHitSFX(++this._repeatCounter);

		if (this._repeatCounter + 1 < this.repeat) {
			this._reverseArrow();
		} else {
			this.currentArrow.alpha = 0;
		}
	}

	_reverseArrow() {
		if (this.currentArrow._sliderPos === 'start') {
			this.currentArrow._sliderPos = 'end';
		} else {
			this.currentArrow._sliderPos = 'start';
		}
		//  x: this.path['end'].x - this.x,
		// 	y: this.path['end'].y - this.y,
		// 	_sliderPos: 'end',
		// 	rotation:
		//  Math.atan2(this.path['end'].y - this.y, this.path['end'].x - this.x) - Math.PI

		this.currentArrow.x =
			this.currentArrow._sliderPos === 'start' ? 0 : this.path['end'].x - this.x;
		this.currentArrow.y =
			this.currentArrow._sliderPos === 'start' ? 0 : this.path['end'].y - this.y;
		this.currentArrow.rotation =
			this.currentArrow._sliderPos === 'start'
				? Math.atan2(this.path['end'].y - this.y, this.path['end'].x - this.x)
				: Math.atan2(this.path['end'].y - this.y, this.path['end'].x - this.x) - Math.PI;
	}

	score(timeOffset) {
		if (this.game) {
			//this.game.addScore(this.game._calculateScore(this.game.overallDifficulty, timeOffset));
			this.game.addScore(50);
		} else {
			throw new Error('No game reference on object!');
		}

		this._playHitSFX(this._repeatCounter + 1);

		this.destroy();
	}

	isPointerDown() {
		return !!this._pointerDown;
	}

	_handlePointerOut(ev) {
		//if (!this.isPointerDown()) return;
		//this._pointerDown = null;
		//this.expire();
	}

	_handlePointerDown(ev) {
		this._pointerDown = {
			x: ev.data.global.x,
			y: ev.data.global.y
		};

		if (this.tickerSound.length > 0) console.log(this.tickerSound);

		this._playHitSFX(this._repeatCounter);
		this._playTickerSFX();

		this._clicked = true;
	}

	_handlePointerUp(ev) {
		if (!this.isPointerDown()) return;
		this._pointerDown = null;

		if (this.target._progress >= Settings.OSUSettings.slider_reward_threshold) {
			this.score();
		} else {
			this.expire();
		}
	}

	_playHitSFX(counter) {
		if (!this.edgeSounds[counter]) return;
		for (let i = 0; i < this.edgeSounds[counter].length; i++) {
			this.edgeSounds[counter][i].sound.play();
		}
	}

	_playTickerSFX() {
		if (!Array.isArray(this.tickerSound)) {
			let temp = this.tickerSound;
			this.tickerSound = [temp];
		}

		for (let i = 0; i < this.tickerSound.length; i++) {
			this.tickerSound[i].sound.loop = true;
			this.tickerSound[i].sound.play();
		}
	}

	_stopTickerSFX() {
		for (let i = 0; i < this.tickerSound.length; i++) {
			//if(this.tickerSound[i].sound.isPlaying){
			this.tickerSound[i].sound.stop();
			//}
		}
	}

	_handlePointerMove(ev) {
		if (!this.isPointerDown()) return;

		// let a = this.x + this.target.x - ev.data.global.x;
		// let b = this.y + this.target.y - ev.data.global.y;
		// let dist = Math.sqrt(a * a + b * b);
		// if (dist > this.circleSize) {
		// 	this.expire();
		// 	return;
		// }

		let delta = {
			x: this._pointerDown.x - ev.data.global.x,
			y: this._pointerDown.y - ev.data.global.y
		};

		this._pointerDown = {
			x: ev.data.global.x,
			y: ev.data.global.y
		};
	}
}

module.exports = SliderHitObject;
