let Token = FBEngine.Token;
let Text = FBEngine.Text;
let ContainerObject = FBEngine.ContainerObject;
let ToggleButton = FBEngine.ToggleButton;
let GameObject = FBEngine.GameObject;

class MainMenu extends Token {
	constructor(onClose, props) {
		super({});

		this.scene = new ContainerObject();
		Application.stage.addChild(this.scene);

		this.onClose = onClose;

		this.createUI();

		if (props) Object.assign(this, props);
	}

	createUI() {
		this.bg = new GameObject(t_white, {
			alpha: 0.2,
			width: Settings.applicationSettings.width,
			height: Settings.applicationSettings.height
		});
		this.scene.addChild(this.bg);

		this.playButton = new Text({
			text: 'Tap here\nto play!',
			x: Settings.applicationSettings.width / 2,
			y: Settings.applicationSettings.height / 2,
			anchor: {
				x: 0.5,
				y: 0.5
			},
			style: new PIXI.TextStyle({
				align: 'center',
				fontSize: 48,
				fontFamily: fnt_exo_20_black,
				fill: '#ff0000'
			}),
			interactive: true
		});
		this.playButton.on('pointerup', this._onClose.bind(this));
		this.scene.addChild(this.playButton);
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
