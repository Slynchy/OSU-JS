let GameObject = FBEngine.GameObject;
let ContainerObject = FBEngine.ContainerObject;
let Button = FBEngine.Button;
let ManiaNote = require("./ManiaNote.js");
let OsuCommon = require("../OsuCommon.js");

class ManiaLane extends ContainerObject {
	static get DefaultConfig() {
		return Settings.OsuManiaSettings.ManiaLaneDefaults;
	}

	/**
	 *
	 * @param {Integer} index The index of the lane
	 * @param {Object} props
	 */
	constructor(index, props) {
		super({});

		this.name = `Lane${index}`;
		this.laneWidth = props.laneWidth || 0;
		this.game = null;
		this._notes = [];

		this._sideLineL = new GameObject(t_white, {
			x: 0,
			y: 0,
			width: 1,
			height: Settings.applicationSettings.height
		});
		this.addChild(this._sideLineL);

		this._sideLineR = new GameObject(t_white, {
			x: ManiaLane.calculateWidth(props.numOfLanes) - 1,
			y: 0,
			width: 1,
			height: Settings.applicationSettings.height
		});
		this.addChild(this._sideLineR);

		this.hitzone = new GameObject(t_red, {
			x: 1,
			y: Settings.applicationSettings.height - 200,
			z: 500,
			width: ManiaLane.calculateWidth(props.numOfLanes) - 2,
			height: 50,
			anchor: {
				x:0,
				y:1
			},
			onClick: ()=>{
				this._hitNote();
			}
		});
		this.addChild(this.hitzone);

		this.button = new Button(t_blue, t_red, {
			x: 1,
			y: Settings.applicationSettings.height - 200,
			z: 500,
			width: ManiaLane.calculateWidth(props.numOfLanes) - 2,
			height: 200,
			onClick: ()=>{
				this._hitNote();
			}
		});
		this.addChild(this.button);

		Object.assign(this, props);
		this.applyDefaultConfig(props);
	}

	spawnNote(isHoldNote, props){
		let note = new ManiaNote(isHoldNote, props);
		note.width = this._sideLineR.x;
		this._notes.push(note);
		this.addChild(note);
		return note;
	}

	_destroyNote(i){
		this._notes[i].destroy();
		this._notes[i] = null;
		this._notes.splice(i, 1);
	}

	endStep(dt){
		for(let i = this._notes.length - 1; i >= 0; i--){
			// move down
			this._notes[i].progressPreempt += ((dt / this._notes[i].preempt) * 0.5);

			this._notes[i].y = ((
					Settings.applicationSettings.height - 150 - this._notes[i].height
				)
			* this._notes[i].progressPreempt) + (-50);

			if(this._notes[i].y > Settings.applicationSettings.height || this._notes[i].progressPreempt >= 1.5){
				this._destroyNote(i);
			}
		}

		if(!this._notes[0]) return;

		for(let i = 0; i < this._notes.length; i++) {
			if(this._notes[i].progressPreempt < 0.9) {
				this.hitzone.setTexture(t_red);
			} // if the first one is less than 0.9 then we can ignore all of them

			if (this._notes[i].progressPreempt > 0.9 && this._notes[i].progressPreempt < 1.1) {
				this.hitzone.setTexture(t_green);
			} else {
				this.hitzone.setTexture(t_red);
			}
		}
	}

	_hitNote(){
		// check note hit
		for(let i = this._notes.length - 1; i >= 0; i--){
			let curr = this._notes[i];
			//if(!curr) return;

			if(curr.progressPreempt > 0.8 && curr.progressPreempt < 1.2){
				let score = OsuCommon.calculateScoreThreshold(
					this.game._difficulty,
					(curr.preempt * curr.progressPreempt) - curr.preempt
				);
				this.game.addScore(score);
				curr._playSFX();
				return;
			} else {
				console.log(curr.progressPreempt);
			}
		}
		console.log("Failed hit!");
	}

	applyDefaultConfig(props) {
		const defaultconfig = ManiaLane.DefaultConfig;
		for (let k in defaultconfig) {
			// noinspection JSUnfilteredForInLoop
			if (!props.hasOwnProperty(k)) {
				// noinspection JSUnfilteredForInLoop
				this[k] = defaultconfig[k];
			}
		}
	}

	static calculateWidth(numOfLanes) {
		if (!numOfLanes) {
			return ManiaLane.DefaultConfig.laneWidth;
		} else {
			return Settings.applicationSettings.width / numOfLanes;
		}
	}
}

module.exports = ManiaLane;
