/**
 * This utility is in charge of turning markdown into HTML.
 * 
 * @module MarkdownManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import * as logManager from './logManager.js';
import marked from 'marked';

const extensions = [
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
	_createBlockExtension("banner"),
	_createBlockExtension("banners"),
	_createBlockExtension("sidebar"),
	_createBlockExtension("sidebars"),
	_createBlockExtension("page"),
	_createBlockExtension("pages"),
	_createBlockExtension("card"),
	_createBlockExtension("cards"),
	_createBlockExtension("poster"),
	_createBlockExtension("posters"),
	_createBlockExtension("content"),
	_createBlockExtension("contents"),
	_createBlockExtension("panel"),
	_createBlockExtension("panels"),
	_createBlockExtension("example"),
	_createBlockExtension("examples"),
	_createBlockExtension("region"),
	_createBlockExtension("regions"),
	{
		name: 'figure',
		level: 'block',
		start(src) { return src.match(/^\\figureBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\figureBegin *({.*?})?[\n$](.*?)\n\\figureEnd.*?[\n$]?/s);
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: 'figure',
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
			if (typeof options.renderOverrides?.figure === 'function') {
				return options.renderOverrides.figure(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				let id = token.tags?.id ? `id="${token.tags.id}"` : '';
				let css = token.tags?.class ? token.tags.class : '';
				let tags = token.tags && token.tags["_data"] ? token.tags["_data"] : '';
				return `
					<figure ${id} class="figure ${css}" ${tags}>
						${this.parser.parse(token.tokens)}
						${token.tags?.caption ? `<figcaption>${token.tags.caption}</figcaption>` : ''}
					</figure>
				`;
			}
		}
	},
	_createBlockExtension("figures")
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
				let id = `id="${tags.id ? tags.id : title.replace(/<(span|i).*?>.*?<\/(span|i)>/g,"").trim().replace(/ /g, '-').toLowerCase()}"`;
				let css = tags.class ? tags.class : '';
				let data = tags["_data"] ? tags["_data"] : '';
				return `
					<h${level} ${id} class="${css}" ${data}>${tags.icon ? `<span class="icon">${tags.icon}</span>` : ``}${tags.index ? `<span class="index">${tags.index}</span>` : ``}${title}</h${level}>
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
	return marked(text, { renderOverrides: job.format.markdown, renderJob: job, renderFilename: filename });
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
				if (typeof y === 'object') {
					tags.push(`${x}='${JSON.stringify(y)}'`);
				} else {
					tags.push(`${x}="${y}"`);
				}
			}
		});
	}
	return (tags.length == 0) ? '' : `${tags.join(" ")}`;
}

/**
 * Creates a common block extension based on a target element name.
 * @param {string} name - An element name.
 * @returns {Object} A marked.js extension defintion.
 */
function _createBlockExtension(name) {
	return {
		name: name,
		level: 'block',
		start(src) {
			return src.match(new RegExp(`^\\\\${name}Begin`))?.index;
		},
		tokenizer(src) {
			const match = src.match(new RegExp(`^\\\\${name}Begin *({.*?})?[\\n$](.*?)\\n\\\\${name}End.*?[\\n$]?`, "s"));
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: name,
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
			if (options.renderOverrides && typeof options.renderOverrides[name] === 'function') {
				return options.renderOverrides[name](options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				let id = token.tags?.id ? `id="${token.tags.id}"` : '';
				let css = token.tags?.class ? token.tags.class : '';
				let tags = token.tags && token.tags["_data"] ? token.tags["_data"] : '';
				let type = token.tags?.type ? `${name}--${token.tags.type}` : '';
				let titleElement = token.tags?.titleElement ? token.tags.titleElement : "div";
				let title = token.tags?.title ? `<${titleElement} class="${name}__title">${token.tags.title}</${titleElement}>` : '';
				let subtitle = token.tags?.subtitle ? `<div class="${name}__subtitle">${token.tags.subtitle}</div>` : '';
				return `
					<div ${id} class="${name} ${type} ${css}" ${tags}>
						${(title || subtitle) ? `
							<div class="${name}__header">
								${title}
								${subtitle}
							</div>
						` : ''}
						<div class="${name}__body">
							${token.tags?.lines > 0 ? "<p>&nbsp;</p>".repeat(token.tags.lines) : ''}
							${this.parser.parse(token.tokens)}
						</div>
					</div>
				`;
			}
		}
	}
}

export { initialise, renderAsHtml };