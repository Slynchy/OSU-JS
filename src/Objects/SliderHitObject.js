let NineSliceObject = require('../engine/NineSliceObject.js');
let ContainerObject = require('../engine/ContainerObject.js');
let GameObject = require('../engine/GameObject.js');
let Text = require('../engine/Text.js');
let CircularArcApproximator = require('../CircularArcApproximator.js');

class SliderHitObject extends ContainerObject {
	static get Directions() {
		return {
			FORWARD: false,
			BACKWARD: true
		};
	}

	_applyOffset(input){
		if(input.x){
			input.x += this.offset.x;
		}
		if(input.y){
			input.y += this.offset.y;
		}
		return input;
	}

	constructor(x, y, type, metadata, props) {
		super({});

		this.x = x;
		this.y = y;

		this.fadein = 0;
		this.preempt = 0;
		this.circleSize = 0;
		this.repeat = 0;
		this.mpb = 0;
		this.edgeSounds = null;
		this.tickerSound = null;
		this.sliderSound = null;
		this.comboNumber = 0;
		this.type = type;
		this.offset = {
			x: 0,
			y: 0
		}
		Object.assign(this, metadata);

		this.perfectScore = true;

		if (!this.playLargeParticleEffect) this.playLargeParticleEffect = () => {};

		this.hitTimestamp = 0;
		this.sliderScores = [];

		this.path['end'] = osuScale(this.path['end']);
		this._applyOffset(this.path['end']);

		if (this.path.sliderType === 'perfect') {
			this.path['passthrough'] = osuScale(this.path['passthrough']);
			this._applyOffset(this.path['passthrough']);
			this.perfPath = CircularArcApproximator.CreateArc(
				{ x: this.x, y: this.y },
				{ x: this.path['passthrough'].x, y: this.path['passthrough'].y },
				{ x: this.path['end'].x, y: this.path['end'].y },
				0.1
			);
		}

		this.bg = new PIXI.Graphics();
		this.addChild(this.bg);

		switch (this.path.sliderType) {
			case 'perfect':
				this.bg.lineStyle(5, 0xff0000).moveTo(0, 0);
				for (let i = 0; i < this.perfPath.length; i++) {
					this.bg.lineTo(this.perfPath[i].x - this.x, this.perfPath[i].y - this.y);
				}
				break;
			case 'linear':
			case 'bezier':
			case 'catmull':
			default:
				if (this.path['end']) {
					// todo FIX THIS
					this.bg
						.lineStyle(5, 0xff0000)
						.moveTo(0, 0)
						.lineTo(this.path['end'].x - this.x, this.path['end'].y - this.y);
				}
				break;
		}

		this.ticks = [];
		this.numberOfTicks = Math.floor(
			this.duration / (this.mpb + 0.001) // hack
		);

		if (this.numberOfTicks > 0) {
			for (let i = 0; i < this.numberOfTicks; i++) {
				for (let r = 1; r <= this.repeat; r++) {
					this.ticks.push({
						done: false,
						timestamp: this.mpb * (i + 1) * r
					});
				}
			}
		}

		this.tickerObjects = [];
		for (let i = 0; i < this.numberOfTicks; i++) {
			let x = 0,
				y = 0;
			if (!this.perfPath) {
				x = lerp(0, this.path['end'].x - this.x, 1 / (this.numberOfTicks + 1) * (i + 1));
				y = lerp(0, this.path['end'].y - this.y, 1 / (this.numberOfTicks + 1) * (i + 1));
			} else {
				x =
					this.perfPath[
						Math.floor(this.perfPath.length * (1 / (this.numberOfTicks + 1) * (i + 1)))
					].x - this.x;
				y =
					this.perfPath[
						Math.floor(this.perfPath.length * (1 / (this.numberOfTicks + 1) * (i + 1)))
					].y - this.y;
			}

			let tempTick = new GameObject(t_white, {
				x: x,
				y: y,
				width: 10,
				height: 10
			});
			tempTick.anchor.x = 0.5;
			tempTick.anchor.y = 0.5;
			this.tickerObjects.push(tempTick);
			this.addChild(this.tickerObjects[this.tickerObjects.length - 1]);
		}

		this._clicked = false;
		this._repeatCounter = 0;
		this._pointerDown = null;

		if (this.repeat > 1) {
			let rotation;
			if (this.perfPath) {
				rotation =
					Math.atan2(
						this.perfPath[this.perfPath.length - 1].y -
							this.perfPath[this.perfPath.length - 2].y,
						this.perfPath[this.perfPath.length - 1].x -
							this.perfPath[this.perfPath.length - 2].x
					) - Math.PI;
			} else {
				rotation =
					Math.atan2(this.path['end'].y - this.y, this.path['end'].x - this.x) - Math.PI;
			}
			this.currentArrow = new GameObject(t_arrows, {
				x: this.path['end'].x - this.x,
				y: this.path['end'].y - this.y,
				_sliderPos: 'end',
				rotation: rotation
			});
			this.currentArrow.anchor.y = 0.5;
			this.currentArrow.scale.x = osuScale(0.2, 0.2).x;
			this.currentArrow.scale.y = osuScale(0.2, 0.2).y;
			this.addChild(this.currentArrow);
		}

		this.target = new GameObject(t_whiteCircle, {
			width: this.circleSize,
			height: this.circleSize,
			interactive: true,
			interactiveChildren: false
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
				y: 600
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
				max: 0.5
			},
			blendMode: 'normal',
			frequency: 0.001,
			emitterLifetime: -1,
			maxParticles: 275,
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
		if (this.game)
			this.game.resetCombo();
		this.destroy();
	}

	endStep(dt) {
		this.comboText.x = this.target.x - 7;
		this.comboText.y = this.target.y - 15;

		if (this.particleEmitter && this._clicked) {
			this.particleEmitter.updateSpawnPos(this.target.x, this.target.y);
			this.particleEmitter.update(dt * 0.001);
		}

		if (!this._clicked) {
			if (this._progressPreempt < 1) {
				if (this.alpha < 1) this.alpha += dt / this.fadein;
				else this.alpha = 1;
			} else {
				this.alpha = 3 - 2 * this._progressPreempt;
			}

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
					if (this.isPointerOver() === true) {
						this._playHitSFX(this._repeatCounter + 1);
						this.sliderScores.push(30);
					} else {
						this.perfectScore = false;
					}
					this.score();
					return;
				} else {
					++this._repeatCounter;
					this.reverseDirection();
					if (this.isPointerOver() === true) {
						this._playHitSFX(this._repeatCounter);
						this.sliderScores.push(30);
					} else {
						this.perfectScore = false;
					}
				}
			}

			if (this.path.sliderType !== 'perfect') {
				if (this.direction === SliderHitObject.Directions.FORWARD) {
					this.target.x = lerp(0, this.path['end'].x - this.x, this.target._progress);
					this.target.y = lerp(0, this.path['end'].y - this.y, this.target._progress);
				} else if (this.direction === SliderHitObject.Directions.BACKWARD) {
					this.target.x = lerp(this.path['end'].x - this.x, 0, this.target._progress);
					this.target.y = lerp(this.path['end'].y - this.y, 0, this.target._progress);
				}
			} else {
				this._handlePerfCircleMovement();
			}

			for (let i = 0; i < this.ticks.length; i++) {
				if (
					this.target._progress * (this._repeatCounter + 1) * this.duration >
						this.ticks[i].timestamp &&
					this.ticks[i].done === false
				) {
					this.ticks[i].done = true;

					if (this.isPointerOver() === true) {
						this.sliderScores.push(10);
						if (this.tickerSound) this.tickerSound.play();
					} else {
						this.perfectScore = false;
					}
				}
			}
		}
	}

	_handlePerfCircleMovement() {
		let pos = { x: 0, y: 0 };
		if (this.direction === SliderHitObject.Directions.FORWARD) {
			if (
				Math.floor(this.perfPath.length * this.target._progress) + 1 >=
				this.perfPath.length
			)
				return;
			pos.x = lerp(
				this.perfPath[Math.floor(this.perfPath.length * this.target._progress)].x - this.x,

				this.perfPath[Math.floor(this.perfPath.length * this.target._progress) + 1].x -
					this.x,

				(this.perfPath.length * this.target._progress) % 1
			);
			pos.y = lerp(
				this.perfPath[Math.floor(this.perfPath.length * this.target._progress)].y - this.y,

				this.perfPath[Math.floor(this.perfPath.length * this.target._progress) + 1].y -
					this.y,

				(this.perfPath.length * this.target._progress) % 1
			);
		} else if (this.direction === SliderHitObject.Directions.BACKWARD) {
			if (
				Math.floor(
					this.perfPath.length * this.target._progress * -1 + this.perfPath.length
				) -
					1 <=
				0
			)
				return;

			pos.x = lerp(
				this.perfPath[
					Math.floor(
						this.perfPath.length * this.target._progress * -1 +
							(this.perfPath.length - 1)
					)
				].x - this.x,

				this.perfPath[
					Math.floor(
						this.perfPath.length * this.target._progress * -1 +
							(this.perfPath.length - 1)
					) - 1
				].x - this.x,

				(this.perfPath.length * this.target._progress) % 1
			);
			pos.y = lerp(
				this.perfPath[
					Math.floor(
						this.perfPath.length * this.target._progress * -1 +
							(this.perfPath.length - 1)
					)
				].y - this.y,

				this.perfPath[
					Math.floor(
						this.perfPath.length * this.target._progress * -1 +
							(this.perfPath.length - 1)
					) - 1
				].y - this.y,

				(this.perfPath.length * this.target._progress) % 1
			);
		}

		this.target.x = pos.x;
		this.target.y = pos.y;
	}

	onDestroy() {
		this._stopSliderSFX();
	}

	reverseDirection() {
		this.direction = !this.direction;
		this.target._progress = 0;

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

		this.currentArrow.x =
			this.currentArrow._sliderPos === 'start' ? 0 : this.path['end'].x - this.x;
		this.currentArrow.y =
			this.currentArrow._sliderPos === 'start' ? 0 : this.path['end'].y - this.y;

		if (this.currentArrow._sliderPos === 'start') {
			if (this.perfPath) {
				this.currentArrow.rotation =
					Math.atan2(
						this.perfPath[this.perfPath.length - 1].y -
							this.perfPath[this.perfPath.length - 2].y,
						this.perfPath[this.perfPath.length - 1].x -
							this.perfPath[this.perfPath.length - 2].x
					) - Math.PI;
			} else {
				this.currentArrow.rotation = Math.atan2(
					this.path['end'].y - this.y,
					this.path['end'].x - this.x
				);
			}
		} else {
			if (this.perfPath) {
				this.currentArrow.rotation =
					Math.atan2(this.perfPath[0].y - this.y, this.perfPath[0].x - this.x) - Math.PI;
			} else {
				this.currentArrow.rotation =
					Math.atan2(this.path['end'].y - this.y, this.path['end'].x - this.x) - Math.PI;
			}
		}
	}

	/**
	 * https://stackoverflow.com/questions/8331243/circle-collision-javascript
	 * @param p1x
	 * @param p1y
	 * @param r1
	 * @param p2x
	 * @param p2y
	 * @param r2
	 * @returns {boolean}
	 * @private
	 */
	_collision(p1x, p1y, r1, p2x, p2y, r2) {
		let a;
		let x;
		let y;

		a = r1 + r2;
		x = p1x - p2x;
		y = p1y - p2y;

		return a > Math.sqrt(x * x + y * y);
	}

	isPointerOver() {
		if (this.isPointerDown() === false) return false;
		else
			return this._collision(
				this._pointerDown.x,
				this._pointerDown.y,
				6,
				this.target.x + this.x,
				this.target.y + this.y,
				this.circleSize
			);
	}

	score() {
		this.sliderScores.push(30);

		if (this.perfectScore) {
			this.playLargeParticleEffect(this.target.x + this.x, this.target.y + this.y, {
				color: {
					start: '#f4ff95',
					end: '#ffd748'
				}
			});
		} else {
			this.playLargeParticleEffect(this.target.x + this.x, this.target.y + this.y);
		}

		if (this.game) {
			if(!this.perfectScore){
				this.game.resetCombo();
			} else {
				this.game.incrementCombo();
			}

			this.game.addScore(
				this.game.calculateScore(this.game.difficulty, this.hitTimestamp, this.sliderScores)
			);
			//this.game.addScore(50);
		} else {
			throw new Error('No game reference on object!');
		}

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

		this.alpha = 1;

		this.hitTimestamp = this.preempt * this._progressPreempt;
		this.hitTimestamp = this.preempt - this.hitTimestamp;

		this.sliderScores.push(30);

		this._playHitSFX(this._repeatCounter);
		this._playSliderSFX();

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
		if (!this.edgeSounds[counter] || this.edgeSounds[counter].length === 0) {
			//console.warn('Does not have enough edge sounds!');
		} else {
			for (let i = 0; i < this.edgeSounds[counter].length; i++) {
				this.edgeSounds[counter][i].play();
			}
		}

		this.defaultSound.play();
	}

	_playSliderSFX() {
		if (!Array.isArray(this.sliderSound)) {
			let temp = this.sliderSound;
			this.sliderSound = [temp];
		}

		if (this.sliderSound.length !== 0) {
			console.log('Playing %i Slider sounds');
		}

		for (let i = 0; i < this.sliderSound.length; i++) {
			this.sliderSound[i].loop = true;
			this.sliderSound[i].play();
		}
	}

	_stopSliderSFX() {
		for (let i = 0; i < this.sliderSound.length; i++) {
			this.sliderSound[i].stop();
		}
	}

	_handlePointerMove(ev) {
		if (!this.isPointerDown()) return;

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
