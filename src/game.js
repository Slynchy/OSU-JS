let Token = require('./engine/Token.js');
let GameObject = require('./engine/GameObject.js');
let Text = require('./engine/Text.js');
let ContainerObject = require('./engine/ContainerObject.js');
let Button = require('./engine/Button.js');

class Game extends Token {
	constructor(osuFile, props) {
		super({});

		/*
			Game variables go here
		 */
		this.name = 'Game';
		this.scene = new ContainerObject();
		this._osuFile = osuFile;

		this.bg = new GameObject(
			//this.activeTrack.bg,
			t_white,
			{
				width: Settings.applicationSettings.width,
				height: Settings.applicationSettings.height,
				z: 0
			}
		);
		this.scene.addChild(this.bg);

		Application.stage.addChild(this.scene);

		if (props) Object.assign(this, props);
	}

	get activeTrack() {
		return this._osuFile;
	}

	endStep(delta) {
		'use strict';
		super.endStep(delta);

		if (this.scene) this.scene.endStep(delta);
	}

	onDestroy() {
		'use strict';
		super.onDestroy();
	}

	onRemove() {
		'use strict';
		application.stage.removeChild(this.scene);
		FlowController.game = null;
	}

	onAdd() {
		'use strict';
		super.onAdd();
		Application.stage.addChild(this.scene);
	}

	physicsStep(dt) {}

	// Quits the game
	quit() {
		'use strict';
		this.destroy();
	}
}

module.exports = Game;
