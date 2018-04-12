class FlowController {
	constructor() {
		this.finishedLoading = false;
		this.game = null;

		if (!this.entry) {
			throw new Error('FlowController requires an entrypoint (FlowController.entry())!');
		}

		this._currentAction = this.entry;
	}

	get currentAction() {
		return this._currentAction;
	}

	/**
	 * @param {Function} val
	 */
	set currentAction(val) {
		if (typeof val !== 'function') throw new Error('Must be function param');
		this._currentAction = val;
	}

	/**
	 * Every implementation of FlowController MUST have an entry() function
	 */
	entry() {
		console.log('[flowController] entry');
		this.currentAction = this.startLoading;
	}

	startLoading() {
		console.log('[flowController] startLoading');
		AssetLoader.LoadAssetsFromAssetList(Settings.resources).then(
			() => {
				console.log('success');
			},
			() => {
				console.error('error');
			}
		);
		this.currentAction = this.waitForLoading;
	}

	waitForLoading() {}
}

module.exports = new FlowController();
