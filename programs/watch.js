/**
 * This program is in charge of watching folders and—on any changes—retriggering build processes.
 * 
 * @module Watch
 * @author Giffyglyph
 */

import * as build from "./build.js";
import * as logManager from "../utilities/logManager.js";
import gulp from "gulp";

/**
 * Watch all folders for changes and retrigger build processes.
 * @param {Object[]} jobs - A list of watch jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function watch(jobs) {
	if (jobs.length > 0) {
		logManager.postEmptyLine();
		logManager.postInfo(logManager.formatBg(`Watching [${jobs[0].tasks.join(', ')}] for changes`, "blue"));
		logManager.postEmptyLine();
		jobs.filter((x) => x.tasks.includes("fonts")).forEach((x) => _watchFolders(x, 'fonts/**/*.*', build.buildFonts));
		jobs.filter((x) => x.tasks.includes("html")).forEach((x) => _watchFolders(x, '{fragments,collections,translations}/**/*.*', build.buildHtml));
		jobs.filter((x) => x.tasks.includes("images")).forEach((x) => _watchFolders(x, 'images/**/*.+(jpg|jpeg|gif|png|svg)', build.buildImages));
		jobs.filter((x) => x.tasks.includes("scripts")).forEach((x) => _watchFolders(x, 'scripts/**/*.js', build.buildScripts));
		jobs.filter((x) => x.tasks.includes("stylesheets")).forEach((x) => _watchFolders(x, 'stylesheets/**/*.scss', build.buildStylesheets));
		jobs.filter((x) => x.tasks.includes("vendors")).forEach((x) => _watchFolders(x, 'vendors/**/*.*', build.buildVendors));
	}
}

/**
 * Watch all folders for changes and retrigger build processes.
 * @param {Object[]} jobs - A list of watch jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function _watchFolders(job, path, cb) {
	gulp.watch(_listFolders(job, path)).on('all', async() => { 
		await cb([job]).catch((e) => {
			e.forEach((x) => logManager.postError(x));
		});
	});
}

/**
 * Get a list of folders to watch for a specific job/path combination.
 * @param {Object} jobs - A job.
 * @param {string} path - A glob folder/file filter.
 * @returns {string[]} A list of folders.
 */
function _listFolders(job, path) {
	return [
		`${job.format.src.replace(/\\/g, "/")}/src/${path}`,
		`${job.project.src.replace(/\\/g, "/")}/src/${path}`
	];
}

export { watch };