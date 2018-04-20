let Token = require("../engine/Token.js");
let ContainerObject = require('../engine/ContainerObject.js');

class LoadingScreen extends Token {

	constructor(props){
		super({});

		this.scene = new ContainerObject();
		Application.stage.addChild(this.scene);

		this.loadingBar = new PIXI.Graphics();
		this.loadingBar
			.lineStyle(5, 0xff0000)
			.moveTo(0, Settings.applicationSettings.height * 0.5)
			.lineTo(0, Settings.applicationSettings.height * 0.5);
		this.scene.addChild(this.loadingBar);

		if (props) Object.assign(this, props);
	}

	endStep(delta) {
		'use strict';
		// this function is called at the end of a frame

		this.loadingBar.clear();

		this.loadingBar
			.lineStyle(5, 0xff0000)
			.moveTo(0, Settings.applicationSettings.height * 0.5)
			.lineTo(
				Settings.applicationSettings.width * (PIXI.loader.progress * 0.01),
				Settings.applicationSettings.height * 0.5
			);

	}

	onRemove(){
		Application.stage.removeChild(this.scene);
	}
}

module.exports = LoadingScreen;