let GameObject = FBEngine.GameObject;
let ContainerObject = FBEngine.ContainerObject;
let Button = FBEngine.Button;

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

		// this.button = new Button(t_white, t_black, {
		//
		// });

		Object.assign(this, props);
		this.applyDefaultConfig(props);
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
