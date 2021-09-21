/**
 * This class represents a MarkdownMaker format.
 * 
 * @module Format
 * @author Giffyglyph
 */

class Format {
	name = null;                           // format name
	version = null;                        // format version 
	publisher = null;                      // required publisher version
	export = {
		pdf: null,
		png: null,
		jpg: null,
		zip: null
	};
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
		processHtml: null,                  // function(html)
		saveHtmlFragment: null,             // function(job, language, stream)
		saveHtmlCollection: null,           // function(job, language, stream)
		validateCollectionJson: null,       // function(json), returns Object
		renderCollectionJson: null          // function(job, json), returns string
	};
	renderer = {
		pagebreak: null,                  // function(job, filename, token, tags), returns string
		colbreak: null,                   // function(job, filename, token, tags), returns string
		layout: null,                     // function(job, filename, token, tags), returns string
		page: null,                       // function(job, filename, token, tags), returns string
		example: null,                    // function(job, filename, token, tags), returns string
		panel: null,                      // function(job, filename, token, tags), returns string
		heading: null                     // function(level, title, tags), returns string
	}

	/**
	 * Basic constructor.
	 * @param {Object} options — Construction options.
	 */
	constructor(options) {
		Object.assign(this, options);
	}
}

export default Format;