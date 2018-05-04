let Token = require('../engine/Token.js');
let Text = require('../engine/Text.js');
let ContainerObject = require('../engine/ContainerObject.js');

class MainMenu extends Token {
	constructor(onClose, props) {
		super({});

		this.scene = new ContainerObject();
		Application.stage.addChild(this.scene);

		this.onClose = onClose;

		this.playButton = new Text({
			text: 'Click here\nto play!',
			x: Settings.applicationSettings.width / 2,
			y: Settings.applicationSettings.height / 2,
			style: new PIXI.TextStyle({
				align: 'center',
				fontSize: osuScale(22),
				fill: '#ff0000'
			}),
			interactive: true
		});
		this.playButton.anchor.x = 0.5;
		this.playButton.anchor.y = 0.5;
		this.playButton.on('pointerup', this._onClose.bind(this));
		this.scene.addChild(this.playButton);

		if (props) Object.assign(this, props);
	}

	endStep(delta) {
		'use strict';
		// this function is called at the end of a frame
	}

	_onClose() {
		this.onClose();
	}

	onRemove() {
		Application.stage.removeChild(this.scene);
	}
}

module.exports = MainMenu;
