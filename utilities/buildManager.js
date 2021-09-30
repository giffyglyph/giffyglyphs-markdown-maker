/**
 * This utility is in charge of building HTML fragments from .md files and collections from .json files.
 * 
 * @module BuildManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import * as fileManager from './fileManager.js';
import * as logManager from './logManager.js';
import * as markdownManager from './markdownManager.js';
import * as translationManager from './translationManager.js';
import * as jsonManager from './jsonManager.js';
import beautify from 'gulp-beautify';
import dom from 'gulp-dom';
import gulp from 'gulp';
import gulpif from 'gulp-if';
import path from 'path';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import through2 from 'through2';
import using from 'gulp-using';

/**
 * Build HTML fragments from markdown.
 * @param {Object} job - A specific job to perform.
 * @param {string} language - A specific language to output.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
 function buildHtmlFragments(job, language) {
	return new Promise((resolve, reject) => {
		let stream = fileManager.getSrc(job.project, job.format, 'fragments', (job.files ? `@(${job.files.join('|')})` : '*.md'))
			.pipe(plumber({ errorHandler: reject }))
			.pipe(gulpif(job.debug, using()))
			.pipe(through2.obj((chunk, enc, callback) => {
				let fragmentFilename = path.basename(chunk.path);
				try {
					// Render the markdown into HTML
					let html = markdownManager.renderAsHtml(job, fragmentFilename, chunk.contents.toString());

					// Wrap the page in HTML head/body tags
					if (typeof job.format.override.renderHtmlFragmentWrapper === 'function') {
						html = job.format.override.renderHtmlFragmentWrapper(job, fragmentFilename, html);
					} else {
						html = `<html><head></head><body>${html}</body></html>`;
					}
					chunk.contents = Buffer.from(html);
					callback(null, chunk);
				} catch (e) {
					e.message = `[Building ${job.project.name}/fragments/${fragmentFilename}] ${e.message}`;
					reject(e);
				}
			}))
			.pipe(dom(function() {
				// Apply format and project-specific HTML adjustments
				if (typeof job.format.processHtml === 'function') {
					job.format.processHtml(this);
				}
				if (typeof job.project.processHtml === 'function') {
					job.project.processHtml(this);
				}
				// Run JSON renderers (if any)
				jsonManager.renderJson(job, this);
				// Apply translations (if any)
				let translator = translationManager.createTranslator(job.project, job.format, language);
				this.head.innerHTML = translator.replaceMessages(this.head.innerHTML);
				this.body.innerHTML = translator.replaceMessages(this.body.innerHTML);
				return this;
			}))
			.pipe(beautify.html({ indent_with_tabs: true }));

		// Save the fragment
		if (typeof job.format.override.saveHtmlFragment === 'function') {
			job.format.override.saveHtmlFragment(job, language, stream);
		} else {
			stream.pipe(rename((path) => {
				path.basename += (language ? `_${language}` : ``);
				path.extname = '.html';
				logManager.postInfo(logManager.formatTask(job.project.name, job.format.name, path.basename + path.extname, "Built HTML fragment"));
			}))
			.pipe(gulp.dest(path.join(job.output.build, 'html')));
		}
		
		stream.on('end', resolve).on('error', reject);
	});
}

/**
 * Build HTML collections from json configuration files.
 * @param {Object} job - A specific job to perform.
 * @param {string} language - A specific language to output.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
function buildHtmlCollections(job, language) {
	return new Promise((resolve, reject) => {
		let filename = '';
		let version = job.project.version;
		let stream = fileManager.getSrc(job.project, job.format, 'collections', (job.files ? `@(${job.files.join('|')})` : '*.json'))
			.pipe(plumber({ errorHandler: reject }))
			.pipe(gulpif(job.debug, using()))
			.pipe(through2.obj((chunk, enc, callback) => {
				let collectionFilename = path.basename(chunk.path);
				try {
					let json = JSON.parse(chunk.contents.toString());

					// Validate collection file
					if (typeof job.format.override.validateCollectionJson === 'function') {
						json = job.format.override.validateCollectionJson(json)
					} else {
						json = _validateCollectionJson(json);
					}

					// Get filename (used when saving)
					filename = json.filename;

					// Render the collection contents into a single HTML string
					let html = "";
					if (typeof job.format.override.renderCollectionJson === 'function') {
						html = job.format.override.renderCollectionJson(job, json);
					} else {
						html = json.contents.map((x) => {
							let fragment = fileManager.findFile(job.project, job.format, 'fragments', `${x}.md`);
							if (!fragment) {
								throw new ReferenceError(`Fragment file "${x}.md" does not exist.`);
							}
							return fragment;
						}).filter((x) => x != null).join('\n');
					}

					// Render the markdown into HTML
					html = markdownManager.renderAsHtml(job, collectionFilename, html);

					// Wrap the collection in HTML head/body tags
					if (typeof job.format.override.renderHtmlCollectionWrapper === 'function') {
						html = job.format.override.renderHtmlCollectionWrapper(job, collectionFilename, html);
					} else {
						html = `<html><head></head><body>${html}</body></html>`;
					}
					chunk.contents = Buffer.from(html);
					callback(null, chunk);
				} catch (e) {
					e.message = `[Building ${job.project.name}/collections/${collectionFilename}] ${e.message}`;
					reject(e);
				}
			}))
			.pipe(dom(function() {
				// Apply format and project-specific HTML adjustments
				if (typeof job.format.processHtml === 'function') {
					job.format.processHtml(this);
				}
				if (typeof job.project.processHtml === 'function') {
					job.project.processHtml(this);
				}
				// Run JSON renderers (if any)
				jsonManager.renderJson(job, this);
				// Apply translations (if any)
				let translator = translationManager.createTranslator(job.project, job.format, language);
				this.head.innerHTML = translator.replaceMessages(this.head.innerHTML);
				this.body.innerHTML = translator.replaceMessages(this.body.innerHTML);
				return this;
			}))
			.pipe(beautify.html({ indent_with_tabs: true }));

		// Save the collection
		if (typeof job.format.override.saveHtmlCollection === 'function') {
			job.format.override.saveHtmlCollection(job, language, stream);
		} else {
			stream.pipe(rename((path) => {
				path.basename = filename + `_v${version.replace(/\./g, '-')}` + (language ? `_${language}` : '');
				path.extname = '.html';
				logManager.postInfo(logManager.formatTask(job.project.name, job.format.name, path.basename + path.extname, "Built HTML collection"));
			}))
			.pipe(gulp.dest(path.join(job.output.build, 'html')));
		}
		
		stream.on('end', resolve).on('error', reject);
	});
}

/**
 * Validate a collection config file.
 * @param {Object} json - Contents of the collection config file.
 * @returns {Object} A validated json object.
 * @throws {Error} Any validation error.
 */
 function _validateCollectionJson(json) {
	if (typeof json.filename === 'undefined') {
		throw new ReferenceError("Collection is missing an output name.");
	}
	if (!Array.isArray(json.contents)) {
		throw new TypeError("Collection is missing a list of contents.");
	}
	if (json.contents.length == 0) {
		throw new RangeError("Collection has zero listed contents.");
	}
	return json;
}

export { buildHtmlCollections, buildHtmlFragments };