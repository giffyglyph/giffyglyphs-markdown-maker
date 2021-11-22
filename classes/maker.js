/**
 * This class represents a MarkdownMaker configuration file.
 * 
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

class Maker {
	output = {
		build: null,
		export: null
	};
	formats = [];
	projects = [];

	/**
	 * Basic constructor.
	 * @param {Object} options — Construction options.
	 */
	constructor(options) {
		Object.assign(this, options);
	}
}

export default Maker;