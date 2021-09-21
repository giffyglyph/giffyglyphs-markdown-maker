/**
 * This utility is in charge of turning markdown into HTML.
 * 
 * @module MarkdownManager
 * @author Giffyglyph
 */

import * as logManager from './logManager.js';
import marked from 'marked';

const extensions = [
	{
		name: 'pagebreak',
		level: 'block',
		start(src) { return src.match(/^\\pagebreak/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\pagebreak/);
			if (match) {
				const token = {
					type: 'pagebreak',
					raw: match[0]
				};
				return token;
			}
		},
		renderer(token) {
			let options = this.parser.options;
			if (typeof options.renderOverrides?.pagebreak === 'function') {
				return options.renderOverrides.pagebreak(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				return `<pagebreak></pagebreak>`;
			}
		}
	},
	{
		name: 'colbreak',
		level: 'block',
		start(src) { return src.match(/^\\columnbreak/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\columnbreak/);
			if (match) {
				const token = {
					type: 'colbreak',
					raw: match[0]
				};
				return token;
			}
		},
		renderer(token) {
			let options = this.parser.options;
			if (typeof options.renderOverrides?.colbreak === 'function') {
				return options.renderOverrides.colbreak(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				return `<colbreak></colbreak>`;
			}
		}
	},
	{
		name: 'layout',
		level: 'block',
		start(src) { return src.match(/^\\layoutBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\layoutBegin *({.*?})?[\n$](.*?)\\layoutEnd.*?[\n$]?/s);
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: 'layout',
					raw: match[0],
					text: match[2]?.trim(),
					tags: tags,
					tokens: []
				};
				this.lexer.blockTokens(token.text, token.tokens);
				return token;
			}
		},
		renderer(token) {
			let options = this.parser.options;
			if (typeof options.renderOverrides?.layout === 'function') {
				return options.renderOverrides.layout(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				return `
					<div${token.tags?.id ? ` id="${token.tags.id}"` : ''} class="layout${token.tags?.class ? ` ${token.tags.class}` : ''}"${token.tags["_data"] ? token.tags["_data"] : ''}>
						${this.parser.parse(token.tokens)}
					</div>
				`;
			}
		}
	},
	{
		name: 'page',
		level: 'block',
		start(src) { return src.match(/^\\pageBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\pageBegin *({.*?})?[\n$](.*?)\\pageEnd.*?[\n$]?/s);
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: 'page',
					raw: match[0],
					text: match[2]?.trim(),
					tags: tags,
					tokens: []
				};
				this.lexer.blockTokens(token.text, token.tokens);
				return token;
			}
		},
		renderer(token) {
			let options = this.parser.options;
			if (typeof options.renderOverrides?.page === 'function') {
				return options.renderOverrides.page(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				return `
					<div${token.tags?.id ? ` id="${token.tags.id}"` : ''} class="page${token.tags?.class ? ` ${token.tags.class}` : ''}"${token.tags["_data"] ? token.tags["_data"] : ''}>
						${this.parser.parse(token.tokens)}
					</div>
				`;
			}
		}
	},
	{
		name: 'example',
		level: 'block',
		start(src) { return src.match(/^\\exampleBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\exampleBegin *({.*?})?[\n$](.*?)\\exampleEnd.*?[\n$]?/s);
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: 'example',
					raw: match[0],
					text: match[2]?.trim(),
					tags: tags,
					tokens: []
				};
				this.lexer.blockTokens(token.text, token.tokens);
				return token;
			}
		},
		renderer(token) {
			let options = this.parser.options;
			if (typeof options.renderOverrides?.example === 'function') {
				return options.renderOverrides.example(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				return `
					<div${token.tags?.id ? ` id="${token.tags.id}"` : ''} class="panel panel--example${token.tags?.class ? ` ${token.tags.class}` : ''}"${token.tags["_data"] ? token.tags["_data"] : ''}>
						<section class="panel__body">
							${this.parser.parse(token.tokens)}
						</section>
					</div>
				`;
			}
		}
	},
	{
		name: 'panel',
		level: 'block',
		start(src) { return src.match(/^\\panelBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\panelBegin *({.*?})?[\n$](.*?)\\panelEnd.*?[\n$]?/s);
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: 'panel',
					raw: match[0],
					text: match[2]?.trim(),
					tags: tags,
					tokens: []
				};
				this.lexer.blockTokens(token.text, token.tokens);
				return token;
			}
		},
		renderer(token) {
			let options = this.parser.options;
			if (typeof options.renderOverrides?.panel === 'function') {
				return options.renderOverrides.panel(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				return `
					<div${token.tags?.id ? ` id="${token.tags.id}"` : ''} class="panel${token.tags.panelType ? ` panel--${token.tags.panelType}` : ``}${token.tags?.class ? ` ${token.tags.class}` : ''}"${token.tags["_data"] ? token.tags["_data"] : ''}>
						${token.tags?.title ? `<header class="panel__header"><h4 class="panel__title">${token.tags.title}</h4></header>` : ""}
						<section class="panel__body">
							${this.parser.parse(token.tokens)}
						</section>
					</div>
				`;
			}
		}
	}
];

const renderer = {
  heading(text, level) {
		const match = text.replace(/&quot;/g, '"').match(/^(.*?) *?({.*?})? *?$/m);
		if (match) {
			let title = match[1];
			let tags = match[2] ? _parseTags(match[2]) : {};
			if (typeof this.options.renderOverrides?.heading === 'function') {
				return this.options.renderOverrides.heading(level, title, tags);
			} else {
				return `
				<h${level}${tags.id ? ` id="${tags.id}"` : ""}>${tags.index ? `<span class="index">${tags.index}</span>` : ``}${title}</h${level}>
			`;
			}
		} else {
			return `
				<h${level}>${text}</h${level}>
			`;
		}
  }
};

/**
 * Initialise the markdown engine with custom extensions.
 * This is required because marked.use() affects *all* instances of marked {@link https://github.com/markedjs/marked/issues/907}.
 * This stops us from having one marker per format and format-specific extensions.
 * Instead, we set up a core set of extenders and allow formats to override the rendering if needed.
 */
function initialise() {
	marked.use({ extensions: extensions });
	marked.use({ renderer });
}

/**
 * Parse markdown text and convert it into HTML.
 * @param {string} text - Markdown text.
 * @param {string} text - Markdown text.
 * @returns {string} HTML string.
 */
function renderAsHtml(job, filename, text) {
	return marked(text, { renderOverrides: job.format.renderer, renderJob: job, renderFilename: filename });
}

/**
 * Parse a stringified list of tags and return a key/value object.
 * @param {string} json - A JSON string.
 * @returns {Object} A JSON object.
 */
function _parseTags(json) {
	try {
		let tags = JSON.parse(json);
		let dataAttributes = _renderDataTags(tags);
		tags["_data"] = dataAttributes ? dataAttributes : '';
		return tags;
	} catch (e) {
		logManager.postWarning({ message: `Couldn't parse json [${json}]`, stack: e.stack });
		return {};
	}
}

/**
 * Parse a set of tags for data attributes and return a string.
 * @param {Object} json - A JSON object.
 * @returns {string} A string of data attributes.
 */
function _renderDataTags(json) {
	let tags = [];
	if (json) {
		Object.entries(json).forEach(([x, y]) => {
			if (x.match(/^data-/)) {
				tags.push(`${x}="${y}"`);
			}
		});
	}
	return (tags.length == 0) ? '' : ` ${tags.join(" ")}`;
}

export { initialise, renderAsHtml };