let Token = require("./engine/Token.js");
let GameObject = require("./engine/GameObject.js");
let Text = require('./engine/Text.js');
let ContainerObject = require('./engine/ContainerObject.js');
let Button = require("./engine/Button.js");

class Game extends Token {
	constructor(props) {
		super({});

		/*
			Game variables go here
		 */
		this.name = "Game";
		this.scene = new ContainerObject();

		if(props)
			Object.assign(this, props);
	}

	endStep(delta) {
		"use strict";
		super.endStep(delta);

		if(this.scene)
			this.scene.endStep(delta);
	}

	onDestroy() {
		"use strict";
		super.onDestroy();
	}

	onRemove(){
		"use strict";
		application.stage.removeChild(this.scene);
		FlowController.game = null;
	}

	onAdd() {
		"use strict";
		super.onAdd();
		Application.stage.addChild(this.scene);
	}

	physicsStep(dt){}

	// Quits the game
	quit() {
		"use strict";
		this.destroy();
	}
}

module.exports = Game;