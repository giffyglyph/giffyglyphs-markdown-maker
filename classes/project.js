/**
 * This class represents a MarkdownMaker project.
 * 
 * @module Project
 * @author Giffyglyph
 */

class Project {
	name = null;
	version = null;
	format = {};
	override = {
		processHtml: null
	};

	/**
	 * Basic constructor.
	 * @param {Object} options — Construction options.
	 */
	constructor(options) {
		Object.assign(this, options);
	}
}

export default Project;