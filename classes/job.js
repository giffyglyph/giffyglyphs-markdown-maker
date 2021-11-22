/**
 * This class represents a MarkdownMaker job.
 * 
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

class Job {
	project = null;
	format = null;
	language = null;
	translator = null;
	debug = null;
	files = null;
	fragments = null;
	export = null;
	pages = null;
	task = null;
	output = {
		root: null,
		build: null,
		export: null
	};

	/**
	 * Basic constructor.
	 * @param {Object} options — Construction options.
	 */
	constructor(options) {
		Object.assign(this, options);
	}
}

export default Job;