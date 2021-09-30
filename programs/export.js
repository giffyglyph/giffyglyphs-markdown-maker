/**
 * This program is in charge of exporting artifacts.
 * 
 * @module Export
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import * as exportManager from '../utilities/exportManager.js';
import * as fileManager from '../utilities/fileManager.js';
import * as logManager from '../utilities/logManager.js';
import path from 'path';

/**
 * Run export processes for a set of jobs.
 * @param {Object[]} jobs - A list of export jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function exportFiles(jobs) {
	if (jobs.length > 0) {
		logManager.postEmptyLine();
		logManager.postInfo(logManager.formatBg(`Exporting [${jobs.map((x) => `${x.project.name}/${x.format.name}`).join(", ")}]`, "blue"));
		logManager.postEmptyLine();
	}
	return Promise.allSettled(jobs.flatMap((job) => {
		switch (job.export) {
			case "pdf":
				return _exportPdfs(job);
			case "png":
				return _exportPngs(job);
			case "jpg":
				return _exportJpgs(job);
			case "zip":
				return _exportZip(job);
			default:
				return Promise.reject(`${job.export} is not a valid export format`);
		}
	})).then((results) => { return _filterResults(results); });
}

/**
 * List all the valid export options.
 * @returns {string[]} A list of valid export options.
 */
function listExportFormats() {
	return [
		"pdf",
		"png",
		"jpg",
		"zip"
	];
}

/**
 * Export HTML as a pdf file.
 * @param {Object} job - A job to perform.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
function _exportPdfs(job) {
	let files = fileManager.listFilenames(path.join(job.output.build, "html", `${job.files ? `@(${job.files.join("|")})` : '*.html'}`));
	if (files.length > 0) {
		_startJob(job, `Exporting ${files.length} PDF(s)...`);
		return Promise.allSettled(files.flatMap((file) => {
			try {
				let promise = null;
				let options = Object.assign({}, job.format.export["pdf"], { pageRanges: job.pages });
				if (typeof job.format.override.exportPdf === 'function') {
					promise = job.format.override.exportPdf(job, file, options);
				} else {
					promise = exportManager.exportPdf(job, file, options);
				}
				return promise;
			} catch (e) {
				return Promise.reject(e);
			}
		})).then((results) => { return _filterResults(results); }).then(() => { _finishJob(job, "Exported PDFs"); }, () => {});
	} else {
		return Promise.resolve();
	}
}

/**
 * Export HTML as png files.
 * @param {Object} job - A job to perform.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
function _exportPngs(job) {
	let files = fileManager.listFilenames(path.join(job.output.build, "html", `${job.files ? `@(${job.files.join("|")})` : '*.html'}`));
	if (files.length > 0) {
		_startJob(job, `Exporting PNGs for ${files.length} file(s)...`);
		return Promise.allSettled(files.flatMap((file) => {
			try {
				let promise = null;
				let options = Object.assign({}, job.format.export["png"], { pageRanges: job.pages });
				if (typeof job.format.override.exportPngs === 'function') {
					promise = job.format.override.exportPngs(job, file, options);
				} else {
					promise = exportManager.exportPngs(job, file, options);
				}
				return promise;
			} catch (e) {
				return Promise.reject(e);
			}
		})).then((results) => { return _filterResults(results); }).then(() => { _finishJob(job, "Exported PNGs"); }, () => {});
	} else {
		return Promise.resolve();
	}
}

/**
 * Export HTML as jpg files.
 * @param {Object} job - A job to perform.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
function _exportJpgs(job) {
	let files = fileManager.listFilenames(path.join(job.output.build, "html", `${job.files ? `@(${job.files.join("|")})` : '*.html'}`));
	if (files.length > 0) {
		_startJob(job, `Exporting JPGs for ${files.length} file(s)...`);
		return Promise.allSettled(files.flatMap((file) => {
			try {
				let promise = null;
				let options = Object.assign({}, job.format.export["jpg"], { pageRanges: job.pages });
				if (typeof job.format.override.exportJpgs === 'function') {
					promise = job.format.override.exportJpgs(job, file, options);
				} else {
					promise = exportManager.exportJpgs(job, file, options);
				}
				return promise;
			} catch (e) {
				return Promise.reject(e);
			}
		})).then((results) => { return _filterResults(results); }).then(() => { _finishJob(job, "Exported JPGs"); }, () => {});
	} else {
		return Promise.resolve();
	}
}

/**
 * Export artifacts as ZIP file.
 * @param {Object} job - A job to perform.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
 function _exportZip(job) {
	_startJob(job, `Exporting ZIP...`);
	let promise = null;
	if (typeof job.format.override.exportZip === 'function') {
		promise = job.format.override.exportZip(job);
	} else {
		promise = exportManager.exportZip(job);
	}
	return promise.then((result) => { _finishJob(job, result); }).then(() => { _finishJob(job, "Exported ZIP"); }, () => {});
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

export { exportFiles, listExportFormats };