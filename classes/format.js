/**
 * This class represents a MarkdownMaker format.
 * 
 * @module Format
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

class Format {
	version = null;                       // format version
	type = null;                          // format type
	author = null;                        // format author
	description = null;                   // format description
	markdownMaker = null;                 // required markdownMaker version
	export = {
		pdf: null,
		png: null,
		jpg: null,
		zip: null
	};
	processHtml = null;                   // function(dom)
	override = {
		buildHtml: null,                    // function(jobs), returns Promise
		buildHtmlFragments: null,           // function(job, language), returns Promise
		buildHtmlCollections: null,         // function(job, language), returns Promise
		buildScripts: null,                 // function(jobs), returns Promise
		buildStylesheets: null,             // function(jobs), returns Promise
		buildImages: null,                  // function(jobs), returns Promise
		buildFonts: null,                   // function(jobs), returns Promise
		buildVendors: null,                 // function(jobs), returns Promise
		exportPdf: null,                    // function(job, file, options)
		exportPngs: null,                   // function(job, file, options)
		exportJpgs: null,                   // function(job, file, options)
		exportZip: null,                    // function(job)
		renderHtmlFragmentWrapper: null,    // function(job, filename, html), returns string
		renderHtmlCollectionWrapper: null,  // function(job, filename, html), returns string
		saveHtmlFragment: null,             // function(job, language, stream)
		saveHtmlCollection: null,           // function(job, language, stream)
		validateCollectionJson: null,       // function(json), returns Object
		renderCollectionJson: null          // function(job, json), returns string
	};
	markdown = {
		colbreak: null,                     // function(job, filename, token, tags), returns string
		banner: null,                       // function(job, filename, token, tags), returns string
		banners: null,                      // function(job, filename, token, tags), returns string
		sidebar: null,                      // function(job, filename, token, tags), returns string
		sidebars: null,                     // function(job, filename, token, tags), returns string
		page: null,                         // function(job, filename, token, tags), returns string
		pages: null,                        // function(job, filename, token, tags), returns string
		card: null,                         // function(job, filename, token, tags), returns string
		cards: null,                        // function(job, filename, token, tags), returns string
		poster: null,                       // function(job, filename, token, tags), returns string
		posters: null,                      // function(job, filename, token, tags), returns string
		content: null,                      // function(job, filename, token, tags), returns string
		contents: null,                     // function(job, filename, token, tags), returns string
		panel: null,                        // function(job, filename, token, tags), returns string
		panels: null,                       // function(job, filename, token, tags), returns string
		example: null,                      // function(job, filename, token, tags), returns string
		examples: null,                     // function(job, filename, token, tags), returns string
		region: null,                       // function(job, filename, token, tags), returns string
		regions: null,                      // function(job, filename, token, tags), returns string
		figure: null,                       // function(job, filename, token, tags), returns string
		figures: null,                      // function(job, filename, token, tags), returns string
		heading: null                       // function(level, title, tags), returns string
	};
	json = {};

	/**
	 * Basic constructor.
	 * @param {Object} options — Construction options.
	 */
	constructor(options) {
		Object.assign(this, options);
	}
}

export default Format;