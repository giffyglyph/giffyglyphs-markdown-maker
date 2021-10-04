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
	{
		name: 'layout',
		level: 'block',
		start(src) { return src.match(/^\\layoutBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\layoutBegin *({.*?})?[\n$](.*?)\n\\layoutEnd.*?[\n$]?/s);
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
				let id = token.tags?.id ? `id="${token.tags.id}"` : '';
				let css = token.tags?.class ? token.tags.class : '';
				let tags = token.tags && token.tags["_data"] ? token.tags["_data"] : '';
				return `
					<div ${id} class="layout ${css}" ${tags}>
						${this.parser.parse(token.tokens)}
					</div>
				`;
			}
		}
	},
	{
		name: 'content',
		level: 'block',
		start(src) { return src.match(/^\\contentBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\contentBegin *({.*?})?[\n$](.*?)\n\\contentEnd.*?[\n$]?/s);
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: 'content',
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
			if (typeof options.renderOverrides?.content === 'function') {
				return options.renderOverrides.content(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				let id = token.tags?.id ? `id="${token.tags.id}"` : '';
				let css = token.tags?.class ? token.tags.class : '';
				let tags = token.tags && token.tags["_data"] ? token.tags["_data"] : '';
				return `
					<section ${id} class="${css}" ${tags}>
						${this.parser.parse(token.tokens)}
					</section>
				`;
			}
		}
	},
	{
		name: 'example',
		level: 'block',
		start(src) { return src.match(/^\\exampleBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\exampleBegin *({.*?})?[\n$](.*?)\n\\exampleEnd.*?[\n$]?/s);
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
				let id = token.tags?.id ? `id="${token.tags.id}"` : '';
				let css = token.tags?.class ? token.tags.class : '';
				let tags = token.tags && token.tags["_data"] ? token.tags["_data"] : '';
				return `
					<div ${id} class="example ${css}" ${tags}>
						<section class="example__body">
							${this.parser.parse(token.tokens)}
						</section>
					</div>
				`;
			}
		}
	},
	{
		name: 'tablewrap',
		level: 'block',
		start(src) { return src.match(/^\\tableBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\tableBegin *({.*?})?[\n$](.*?)\n\\tableEnd.*?[\n$]?/s);
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: 'tablewrap',
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
			if (typeof options.renderOverrides?.tablewrap === 'function') {
				return options.renderOverrides.tablewrap(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				let id = token.tags?.id ? `id="${token.tags.id}"` : '';
				let css = token.tags?.class ? token.tags.class : '';
				let tags = token.tags && token.tags["_data"] ? token.tags["_data"] : '';
				let title = token.tags?.title ? token.tags.title : '';
				return `
					<div ${id} class="table ${css}" ${tags}>
						${title ? `<header class="table__header"><h4 class="table__title">${title}</h4></header>` : ''}
						<section class="table__body">
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
			const match = src.match(/^\\panelBegin *({.*?})?[\n$](.*?)\n\\panelEnd.*?[\n$]?/s);
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
				let id = token.tags?.id ? `id="${token.tags.id}"` : '';
				let panelType = token.tags.panelType ? ` panel--${token.tags.panelType}` : '';
				let css = token.tags?.class ? token.tags.class : '';
				let tags = token.tags && token.tags["_data"] ? token.tags["_data"] : '';
				let title = token.tags?.title ? `<header class="panel__header"><h4 class="panel__title">${token.tags.title}</h4></header>` : '';
				return `
					<div ${id} class="panel ${panelType} ${css}" ${tags}>
						${title}
						<section class="panel__body">
							${this.parser.parse(token.tokens)}
						</section>
					</div>
				`;
			}
		}
	},
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
				let caption = token.tags?.caption ? `<figcaption>${token.tags.caption}</figcaption>` : '';
				return `
					<figure ${id} class="figure ${css}" ${tags}>
						${this.parser.parse(token.tokens)}
						${caption}
					</figure>
				`;
			}
		}
	},
	{
		name: 'card',
		level: 'block',
		start(src) { return src.match(/^\\cardBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\cardBegin *({.*?})?[\n$](.*?)\n\\cardEnd.*?[\n$]?/s);
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: 'card',
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
			if (typeof options.renderOverrides?.card === 'function') {
				return options.renderOverrides.card(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				let id = token.tags?.id ? `id="${token.tags.id}"` : '';
				let css = token.tags?.class ? token.tags.class : '';
				let tags = token.tags && token.tags["_data"] ? token.tags["_data"] : '';
				let img = token.tags?.img ? `<img class="card__image" src="${token.tags.img}">` : '';
				return `
					<div ${id} class="card ${css}" ${tags}>
						${img}
						<div class="card__body">
							${this.parser.parse(token.tokens)}
						</div>
					</div>
				`;
			}
		}
	},
	{
		name: 'section',
		level: 'block',
		start(src) { return src.match(/^\\sectionBegin/)?.index; },
		tokenizer(src) {
			const match = src.match(/^\\sectionBegin *({.*?})?[\n$](.*?)\n\\sectionEnd.*?[\n$]?/s);
			if (match) {
				const tags = match[1] ? _parseTags(match[1]) : {};
				const token = {
					type: 'section',
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
			if (typeof options.renderOverrides?.section === 'function') {
				return options.renderOverrides.section(options.renderJob, options.renderFilename, token, this.parser.parse(token.tokens));
			} else {
				let id = token.tags?.id ? `id="${token.tags.id}"` : '';
				let css = token.tags?.class ? token.tags.class : '';
				let tags = token.tags && token.tags["_data"] ? token.tags["_data"] : '';
				return `
					<section ${id} class="section ${css}" ${tags}>
						${this.parser.parse(token.tokens)}
					</section>
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
				let id = `id="${tags.id ? tags.id : title.replace(/<(span|i).*?>.*?<\/(span|i)>/g,"").trim().replace(/ /g, '-').toLowerCase()}"`;
				let css = tags.class ? tags.class : '';
				let data = tags["_data"] ? tags["_data"] : '';
				return `
					<h${level} ${id} class="${css}" ${data}>${tags.index ? `<span class="index">${tags.index}</span>` : ``}${title}</h${level}>
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
				tags.push(`${x}="${y}"`);
			}
		});
	}
	return (tags.length == 0) ? '' : `${tags.join(" ")}`;
}

export { initialise, renderAsHtml };