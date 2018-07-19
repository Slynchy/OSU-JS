let GameObject = FBEngine.GameObject;

class ManiaNote extends GameObject {

	constructor(isHoldNote, props){
		super(t_white, {});

		this.fadein = 0;
		this.preempt = 0;
		this.lane = 0;
		this.progressPreempt = 0;

		this.height = 50;
		this.x = 1;
		this.y = -50;

		if(props){
			Object.assign(this,props);
		}
	}

	_playSFX() {
		if(this.hitSounds.length === 0) console.error('ARGH');
		for (let i = 0; i < this.hitSounds.length; i++) {
			if(this.hitSounds[i])
				this.hitSounds[i].play();
			else console.error("argh");
		}
	}

}

module.exports = ManiaNote;
