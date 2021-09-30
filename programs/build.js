/**
 * This program is in charge of building projects.
 * 
 * @module Build
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import * as fileManager from '../utilities/fileManager.js';
import * as logManager from '../utilities/logManager.js';
import * as buildManager from '../utilities/buildManager.js';
import gulp from 'gulp';
import gulpif from 'gulp-if';
import path from 'path';
import plumber from 'gulp-plumber';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import using from 'gulp-using';

/**
 * Run all build tasks for all jobs.
 * @param {Object[]} jobs - A list of build jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function build(jobs) {
	if (jobs.length > 0) {
		logManager.postEmptyLine();
		logManager.postInfo(logManager.formatBg(`Building [${jobs[0].tasks.join(", ")}]`, "blue"));
		logManager.postEmptyLine();
	}
	return Promise.allSettled([
			buildImages(jobs.filter((x) => x.tasks.includes("images"))),
			buildScripts(jobs.filter((x) => x.tasks.includes("scripts"))),
			buildStylesheets(jobs.filter((x) => x.tasks.includes("stylesheets"))),
			buildVendors(jobs.filter((x) => x.tasks.includes("vendors"))),
			buildHtml(jobs.filter((x) => x.tasks.includes("html"))),
			buildFonts(jobs.filter((x) => x.tasks.includes("fonts"))),
	])
	.then((results) => { return _filterResults(results); });
}

/**
 * Build HTML files from markdown. If the format module contains a buildHtml function, run that instead.
 * @param {Object[]} jobs - A list of build jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function buildHtml(jobs) {
	return Promise.allSettled(jobs.flatMap((job) => {
		try {
			_startJob(job, "Building HTML...");
			let promise = null;
			if (typeof job.format.override.buildHtml === 'function') {
				promise = job.format.override.buildHtml(job);
			} else {
				promise = Promise.allSettled(job.languages.flatMap((language) => {
					try {
						if (job.fragments) {
							if (typeof job.format.override.buildHtmlFragments === 'function') {
								return job.format.override.buildHtmlFragments(job, language);
							} else {
								return buildManager.buildHtmlFragments(job, language);
							}
						} else {
							if (typeof job.format.override.buildHtmlCollections === 'function') {
								return job.format.override.buildHtmlCollections(job, language);
							} else {
								return buildManager.buildHtmlCollections(job, language);
							}
						}
					} catch (e) {
						return Promise.reject(e);
					}
				}));
			}
			return promise.then((results) => { return _filterResults(results); }).then(() => { _finishJob(job, "Built HTML"); });
		} catch (e) {
			return Promise.reject(e);
		}
	})).then((results) => { return _filterResults(results); });
}

/**
 * Deploy scripts from both project and format folders. If the format module contains a buildScripts function, run that instead.
 * @param {Object[]} jobs - A list of build jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function buildScripts(jobs) {
	return Promise.allSettled(jobs.flatMap((job) => {
		try {
			_startJob(job, "Deploying scripts...");
			let promise = null;
			if (typeof job.format.override.buildScripts === 'function') {
				promise = job.format.override.buildScripts(job);
			} else {
				promise = new Promise((resolve, reject) => {
					fileManager.getSrc(job.project, job.format, 'scripts', (job.files ? `@(${job.files.join('|')})` : '*.js'))
						.pipe(plumber({ errorHandler: reject }))
						.pipe(gulpif(job.debug, using()))
						.pipe(gulp.dest(path.join(job.output.build, 'scripts')))
						.on('end', resolve)
						.on('error', reject);
				});
			}
			return promise.then(() => { _finishJob(job, "Deployed scripts"); }).catch(() => { });
		} catch (e) {
			return Promise.reject(e);
		}
	})).then((results) => { return _filterResults(results); });
}

/**
 * Deploy images from both project and format folders. If the format module contains a buildImages function, run that instead.
 * @param {Object[]} jobs - A list of build jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function buildImages(jobs) {
	return Promise.allSettled(jobs.flatMap((job) => {
		try {
			_startJob(job, "Deploying images...");
			let promise = null;
			if (typeof job.format.module?.buildImages === 'function') {
				promise = job.format.override.buildImages(job);
			} else {
				promise = new Promise((resolve, reject) => {
					fileManager.getSrc(job.project, job.format, 'images', (job.files ? `@(${job.files.join('|')})` : '*.+(jpg|jpeg|gif|png|svg)'))
						.pipe(plumber({ errorHandler: reject }))
						.pipe(gulpif(job.debug, using()))
						.pipe(gulp.dest(path.join(job.output.build, 'images')))
						.on('end', resolve)
						.on('error', reject);
				});
			}
			promise.then(() => { _finishJob(job, "Deployed images"); }).catch(() => { });
			return promise;
		} catch (e) {
			return Promise.reject(e);
		}
	})).then((results) => { return _filterResults(results); });
}

/**
 * Deploy fonts from both project and format folders. If the format module contains a buildFonts function, run that instead.
 * @param {Object[]} jobs - A list of build jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function buildFonts(jobs) {
	return Promise.allSettled(jobs.flatMap((job) => {
		try {
			_startJob(job, "Deploying fonts...");
			let promise = null;
			if (typeof job.format.override.buildFonts === 'function') {
				promise = job.format.override.buildFonts(job);
			} else {
				promise = new Promise((resolve, reject) => {
					fileManager.getSrc(job.project, job.format, 'fonts', (job.files ? `@(${job.files.join('|')})` : '*.*'))
						.pipe(plumber({ errorHandler: reject }))
						.pipe(gulpif(job.debug, using()))
						.pipe(gulp.dest(path.join(job.output.build, 'fonts')))
						.on('end', resolve)
						.on('error', reject);
				});
			}
			promise.then(() => { _finishJob(job, "Deployed fonts"); }).catch(() => { });
			return promise;
		} catch (e) {
			return Promise.reject(e);
		}
	})).then((results) => { return _filterResults(results); });
}

/**
 * Build and deploy sass stylesheets from both project and format folders. If the format module contains a buildStylesheets function, run that instead.
 * @param {Object[]} jobs - A list of build jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function buildStylesheets(jobs) {
	return Promise.allSettled(jobs.flatMap((job) => {
		try {
			_startJob(job, "Building stylesheets...");
			let promise = null;
			if (typeof job.format.override.buildStylesheets === 'function') {
				promise = job.format.override.buildStylesheets(job);
			} else {
				promise = new Promise((resolve, reject) => {
					fileManager.getSrc(job.project, job.format, 'stylesheets', (job.files ? `@(${job.files.join('|')})` : '*.scss'))
						.pipe(plumber({ errorHandler: reject }))
						.pipe(gulpif(job.debug, using()))
						.pipe(gulpif(job.debug, sourcemaps.init()))
						.pipe(gulpif(job.debug, sass({ outputStyle: 'compressed' }), sass()))
						.pipe(gulpif(job.debug, sourcemaps.write()))
						.pipe(gulp.dest(path.join(job.output.build, 'stylesheets')))
						.on('end', resolve)
						.on('error', reject);
				});
			}
			promise.then(() => { _finishJob(job, "Deployed stylesheets"); }).catch(() => { });
			return promise;
		} catch (e) {
			return Promise.reject(e);
		}
	})).then((results) => { return _filterResults(results); });
}

/**
 * Deploy vendor files from both project and format folders. If the format module contains a buildVendors function, run that instead.
 * @param {Object[]} jobs - A list of build jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function buildVendors(jobs) {
	return Promise.allSettled(jobs.flatMap((job) => {
		try {
			_startJob(job, "Deploying vendors...");
			let promise = null;
			if (typeof job.format.override.buildVendors === 'function') {
				promise = job.format.override.buildVendors(job);
			} else {
				promise = new Promise((resolve, reject) => {
					fileManager.getSrc(job.project, job.format, 'vendors', (job.files ? `@(${job.files.join('|')})` : '*.*'))
						.pipe(plumber({ errorHandler: reject }))
						.pipe(gulpif(job.debug, using()))
						.pipe(gulp.dest(path.join(job.output.build, 'vendors')))
						.on('end', resolve)
						.on('error', reject);
				});
			}
			promise.then(() => { _finishJob(job, "Deployed vendors"); }).catch(() => { });
			return promise;
		} catch (e) {
			return Promise.reject(e);
		}
	})).then((results) => { return _filterResults(results); });
}

/**
 * List all the valid build task options.
 * @returns {string[]} A list of valid tasks.
 */
function listBuildTasks() {
	return [
		"fonts",
		"html",
		"images",
		"scripts",
		"stylesheets",
		"vendors"
	];
}

/**
 * Notify user that a job is starting.
 * @param {Object} job - A job.
 * @param {string} text - Any additional text (i.e. task).
 */
function _startJob(job, text) {
	logManager.postDebug(logManager.formatTask(job.project.name, job.format.name, null, text));
}

/**
 * Notify user that a job has finished.
 * @param {Object} job - A job.
 * @param {string} text - Any additional text (i.e. task).
 */
function _finishJob(job, text) {
	logManager.postSuccess(logManager.formatTask(job.project.name, job.format.name, null, text));
}

/**
 * Parse a list of promises for any errors—return a rejection if any errors are detected.
 * @param {Promise[]} results - A collection of Promises.
 * @returns {Promise} Promise that represents the success/failure state of the results.
 */
function _filterResults(results) {
	let errors = results.filter((x) => x.status == 'rejected').flatMap((x) => x.reason);
	if (errors.length > 0) {
		return Promise.reject(errors);
	} else {
		return Promise.resolve();
	}
}

export { build, buildFonts, buildHtml, buildImages, buildScripts, buildStylesheets, buildVendors, listBuildTasks };