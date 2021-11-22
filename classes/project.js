/**
 * This class represents a MarkdownMaker project.
 * 
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

class Project {
	version = null;                       // project version 
	author = null;                        // project author
	description = null;                   // project description
	format = {};                          // required formats
	override = {
		processDomFragment: null,           // function(job, dom)
		processDomCollection: null          // function(job, dom, collection)
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