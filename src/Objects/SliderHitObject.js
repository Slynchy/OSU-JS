let NineSliceObject = require('../engine/NineSliceObject.js');
let ContainerObject = require('../engine/ContainerObject.js');
let GameObject = require('../engine/GameObject.js');

class SliderHitObject extends ContainerObject {
	constructor(x, y, type, hitsound, metadata, props) {
		super({});

		this.fadein = 0;
		this.preempt = 0;
		this.circleSize = 0;
		this._startTime = Date.now();
		Object.assign(this, metadata);

		this.x = x;
		this.y = y;
		this._pointerDown = null;

		// this.bg = new NineSliceObject(
		// 	t_redbg9s,
		// 	{
		// 		width: 125,
		// 		height: 125,
		// 		y: -62.5
		// 	},
		// 	20,
		// 	20,
		// 	20,
		// 	20
		// );
		this.bg = new PIXI.Graphics();
		this.addChild(this.bg);

		this.target = new GameObject(t_whiteCircle, {
			width: this.circleSize * 2,
			height: this.circleSize * 2,
			interactive: true
		});
		this.target.on('pointerdown', this._handlePointerDown.bind(this));
		this.target.on('pointerup', this._handlePointerUp.bind(this));
		this.target.on('pointermove', this._handlePointerMove.bind(this));
		this.target.anchor.y = 0.5;
		this.target.anchor.x = 0.5;
		this.addChild(this.target);

		//this.rotation = Math.atan2(metadata.path['end'].y - y, metadata.path['end'].x - x);

		// let normalisedWidth = metadata.path['end'].x - x;
		// if (normalisedWidth < 0) normalisedWidth *= -1;
		// this.bg.width += normalisedWidth;

		this.bg
			.lineStyle(5, 0xff0000)
			.moveTo(0, 0)
			.lineTo(this.path['end'].x - this.x, this.path['end'].y - this.y);

		this.alpha = 0;

		if (props) Object.assign(this, props);
	}

	expire() {
		this.destroy();
	}

	endStep(dt) {
		if (this.alpha < 1) this.alpha += dt / this.fadein;
		else this.alpha = 1;

		if (Date.now() - this._startTime >= this.preempt) {
			this.expire();
		}
	}

	score() {
		this.destroy();
	}

	isPointerDown() {
		return !!this._pointerDown;
	}

	_handlePointerDown(ev) {
		this._pointerDown = {
			x: ev.data.global.x,
			y: ev.data.global.y
		};
	}

	_handlePointerUp(ev) {
		console.log(ev);
		this._pointerDown = null;
		this.score();
	}

	_handlePointerMove(ev) {
		if (!this.isPointerDown()) return;

		let delta = {
			x: this._pointerDown.x - ev.data.global.x,
			y: this._pointerDown.y - ev.data.global.y
		};

		// find closest point on path to the mouse
		let closest = SliderHitObject.getClosestPointOnLines(
			//ev.data.global,
			{
				x: ev.data.global.x - this.x,
				y: ev.data.global.y - this.y
			},
			[
				{
					x: 0,
					y: 0
				},
				{
					x: this.path['end'].x - this.x,
					y: this.path['end'].y - this.y
				}
			]
		);

		this.target.x = closest.x;
		this.target.y = closest.y;

		this._pointerDown = {
			x: ev.data.global.x,
			y: ev.data.global.y
		};

		let a = this.x + this.target.x - this.path['end'].x;
		let b = this.y + this.target.y - this.path['end'].y;
		let dist = Math.sqrt(a * a + b * b);

		if (dist < 1) {
			this.score();
		}
	}

	/* desc Static function. Find point on lines nearest test point
	test point pXy with properties .x and .y
	lines defined by array aXys with nodes having properties .x and .y
	return is object with .x and .y properties and property i indicating nearest segment in aXys
	and property fFrom the fractional distance of the returned point from aXy[i-1]
	and property fTo the fractional distance of the returned point from aXy[i]   */
	static getClosestPointOnLines(pXy, aXys) {
		let minDist;
		let fTo;
		let fFrom;
		let x;
		let y;
		let i;
		let dist;

		if (aXys.length > 1) {
			for (let n = 1; n < aXys.length; n++) {
				if (aXys[n].x != aXys[n - 1].x) {
					let a = (aXys[n].y - aXys[n - 1].y) / (aXys[n].x - aXys[n - 1].x);
					let b = aXys[n].y - a * aXys[n].x;
					dist = Math.abs(a * pXy.x + b - pXy.y) / Math.sqrt(a * a + 1);
				} else dist = Math.abs(pXy.x - aXys[n].x);

				// length^2 of line segment
				let rl2 =
					Math.pow(aXys[n].y - aXys[n - 1].y, 2) + Math.pow(aXys[n].x - aXys[n - 1].x, 2);

				// distance^2 of pt to end line segment
				let ln2 = Math.pow(aXys[n].y - pXy.y, 2) + Math.pow(aXys[n].x - pXy.x, 2);

				// distance^2 of pt to begin line segment
				let lnm12 = Math.pow(aXys[n - 1].y - pXy.y, 2) + Math.pow(aXys[n - 1].x - pXy.x, 2);

				// minimum distance^2 of pt to infinite line
				let dist2 = Math.pow(dist, 2);

				// calculated length^2 of line segment
				let calcrl2 = ln2 - dist2 + lnm12 - dist2;

				// redefine minimum distance to line segment (not infinite line) if necessary
				if (calcrl2 > rl2) dist = Math.sqrt(Math.min(ln2, lnm12));

				if (minDist == null || minDist > dist) {
					if (calcrl2 > rl2) {
						if (lnm12 < ln2) {
							fTo = 0; //nearer to previous point
							fFrom = 1;
						} else {
							fFrom = 0; //nearer to current point
							fTo = 1;
						}
					} else {
						// perpendicular from point intersects line segment
						fTo = Math.sqrt(lnm12 - dist2) / Math.sqrt(rl2);
						fFrom = Math.sqrt(ln2 - dist2) / Math.sqrt(rl2);
					}
					minDist = dist;
					i = n;
				}
			}

			let dx = aXys[i - 1].x - aXys[i].x;
			let dy = aXys[i - 1].y - aXys[i].y;

			x = aXys[i - 1].x - dx * fTo;
			y = aXys[i - 1].y - dy * fTo;
		}

		return { x: x, y: y, i: i, fTo: fTo, fFrom: fFrom };
	}
}

module.exports = SliderHitObject;
