/**
 * This utility is in charge of building HTML fragments from .md files and collections from .json files.
 * 
 * @module BuildManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import * as blueprintManager from './blueprintManager.js';
import * as fileManager from './fileManager.js';
import * as logManager from './logManager.js';
import * as markdownManager from './markdownManager.js';
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
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
 function buildHtmlFragments(job) {
	return new Promise((resolve, reject) => {
		let filename = '';
		const stream = fileManager.getSrc(job.project, job.format, `fragments/${job.language}`, (job.files ? `@(${job.files.join('|')})` : '*.md'))
			.pipe(plumber({ errorHandler: reject }))
			.pipe(gulpif(job.debug, using()))
			.pipe(through2.obj((chunk, enc, callback) => {
				filename = path.basename(chunk.path, ".md");
				try {
					// Render the markdown into HTML
					let html = markdownManager.renderAsHtml(job, filename, chunk.contents.toString());

					// Wrap the page in HTML head/body tags
					if (typeof job.format.override.renderHtmlFragmentWrapper === 'function') {
						html = job.format.override.renderHtmlFragmentWrapper(job, filename, html);
					} else {
						html = `<html><head></head><body>${html}</body></html>`;
					}
					chunk.contents = Buffer.from(html);
					callback(null, chunk);
				} catch (e) {
					e.message = `[Building ${job.project.name}/fragments/${job.language}/${filename}] ${e.message}`;
					reject(e);
				}
			}))
			.pipe(dom(function() {
				// Apply format and project-specific HTML adjustments
				if (typeof job.format.override.processDomFragment === 'function') {
					job.format.override.processDomFragment(job, this);
				}
				if (typeof job.project.override.processDomFragment === 'function') {
					job.project.override.processDomFragment(job, this);
				}
				// Run blueprint renderers (if any)
				blueprintManager.renderBlueprints(job, this);
				// Apply translations (if any)
				job.translator.processDom(job, this);
				return this;
			}))
			.pipe(beautify.html({ indent_with_tabs: true }));

		// Save the fragment
		if (typeof job.format.override.saveFragment === 'function') {
			job.format.override.saveFragment(job, filename, stream);
		} else {
			stream.pipe(rename((path) => {
				path.basename = filename + (job.language ? `_${job.language}` : ``);
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
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
function buildHtmlCollections(job) {
	return new Promise((resolve, reject) => {
		let filename = '';
		let collection = null;
		const stream = fileManager.getSrc(job.project, job.format, `collections/${job.language}`, (job.files ? `@(${job.files.join('|')})` : '*.json'))
			.pipe(plumber({ errorHandler: reject }))
			.pipe(gulpif(job.debug, using()))
			.pipe(through2.obj((chunk, enc, callback) => {
				let collectionFilename = path.basename(chunk.path);
				try {
					collection = JSON.parse(chunk.contents.toString());

					// Validate collection file
					if (typeof job.format.override.validateCollectionJson === 'function') {
						collection = job.format.override.validateCollectionJson(collection)
					} else {
						collection = _validateCollectionJson(collection);
					}

					// Get filename (used when saving)
					filename = collection.filename;

					// Render the collection contents into a single HTML string
					let html = "";
					if (typeof job.format.override.renderCollectionJson === 'function') {
						html = job.format.override.renderCollectionJson(job, collection);
					} else {
						html = collection.contents.map((x) => {
							let fragment = fileManager.findFile(job.project, job.format, `fragments/${job.language}/${x}.md`);
							if (!fragment) {
								throw new ReferenceError(`Fragment file "${job.language}/${x}.md" does not exist.`);
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
					e.message = `[Building ${job.project.name}/collections/${job.language}/${collectionFilename}] ${e.message}`;
					reject(e);
				}
			}))
			.pipe(dom(function() {
				// Apply format and project-specific HTML adjustments
				if (typeof job.format.override.processDomCollection === 'function') {
					job.format.override.processDomCollection(job, this, collection);
				}
				if (typeof job.project.override.processDomCollection === 'function') {
					job.project.override.processDomCollection(job, this, collection);
				}
				// Run blueprint renderers (if any)
				blueprintManager.renderBlueprints(job, this, collection);
				// Apply translations (if any)
				job.translator.processDom(job, this, collection);
				return this;
			}))
			.pipe(beautify.html({ indent_with_tabs: true }));

		// Save the collection
		if (typeof job.format.override.saveCollection === 'function') {
			job.format.override.saveCollection(job, filename, stream);
		} else {
			stream.pipe(rename((path) => {
				path.basename = filename + `_v${job.project.version.replace(/\./g, '-')}` + (job.language ? `_${job.language}` : '');
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