/**
 * This utility is in charge of creating jobs (i.e. "work to be done") from arguments.
 * 
 * @module JobManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import { default as Job } from '../classes/job.js';
import { listBuildTasks } from '../programs/build.js';
import * as logManager from './logManager.js';
import path from 'path';

/**
 * Get a list of jobs to perform.
 * @param {Object} config - The MarkdownMaker configuration file.
 * @param {Object} args - A collection of job arguments (projects, formats, files, etc).
 * @returns {Object[]} A list of jobs.
 */
function getBuildJobs(config, args) {
	return _createJobs(config, args, function(config, args, jobs, project, format, warnings) {
		let tasks = args.tasks ? [...new Set(args.tasks)] : listBuildTasks();
		tasks.forEach((task) => {
			if (task === "html") {
				let languages = args.languages ? [...new Set(args.languages)] : project.formats.find((x) => x.name == format.name)?.languages;
				if (!languages) {
					warnings.push(`No valid output languages specified for "${project.name}/${format.name}": skipping...`);
				} else {
					languages.forEach((language) => {
						jobs.push(_createJob(config, project, format, {
							debug: args.debug,
							language: language,
							files: args.files,
							fragments: args.fragments,
							task: task
						}));
					});
				}
			} else {
				jobs.push(_createJob(config, project, format, {
					debug: args.debug,
					files: args.files,
					task: task
				}));
			}
		});
	});
}

/**
 * Get a list of clean jobs to perform.
 * @param {Object} config - The MarkdownMaker configuration file.
 * @param {Object} args - A collection of job arguments (projects, formats, files, etc).
 * @returns {Object[]} A list of jobs.
 */
function getCleanJobs(config, args) {
	return _createJobs(config, args, function(config, args, jobs, project, format) {
		jobs.push(_createJob(config, project, format, {
			debug: args.debug
		}));
	});
}

/**
 * Get a list of export jobs to perform.
 * @param {Object} config - The MarkdownMaker configuration file.
 * @param {Object} args - A collection of job arguments (projects, formats, files, etc).
 * @returns {Object[]} A list of jobs.
 */
function getExportJobs(config, args) {
	return _createJobs(config, args, function(config, args, jobs, project, format, warnings) {
		if (args.export && !format.export[args.export]) {
			warnings.push(`"${project.name}/${format.name}" doesn't support export option "${args.export}": skipping...`);
		} else {
			jobs.push(_createJob(config, project, format, {
				debug: args.debug,
				files: args.files,
				export: args.export,
				pages: args.pages
			}));
		}
	});
}

/**
 * Get a list of jobs to perform.
 * @param {Object} config - The MarkdownMaker configuration file.
 * @param {Object} args - A collection of job arguments (projects, formats, files, etc).
 * @param {function} callback - A collection of job arguments (projects, formats, files, etc).
 * @returns {Object[]} A list of jobs.
 */
function _createJobs(config, args, callback) {
	let jobs = [];
	let warnings = [];
	let projects = (args.projects ? [...new Set(args.projects)] : config.projects.map((x) => x.name)).map((x) => config.projects.find((y) => y.name == x));
	projects.forEach((project) => {
		let formats = (args.formats ? [...new Set(args.formats)] : project.formats.map((x) => x.name)).map((x) => config.formats.find((y) => y.name == x));
		formats.forEach((format) => {
			if (!project.formats.find((x) => x.name == format.name)) {
				warnings.push(`Project "${project.name}" doesn't support format "${format.name}": skipping...`);
			} else {
				callback(config, args, jobs, project, format, warnings);
			}
		});
	});
	if (warnings.length > 0) {
		logManager.postEmptyLine();
		warnings.forEach((x) => logManager.postInfo(x));
	}
	return jobs;
}

/**
 * Create a job.
 * @param {Object} config - The MarkdownMaker configuration file.
 * @param {Object} project - A project.
 * @param {Object} format - A format.
 * @param {Object} options - A collection of additional options.
 * @returns {Object} A job.
 */
function _createJob(config, project, format, options) {
	let job = new Job({
		project: project,
		format: format,
		output: {
			root: config.outputDir,
			build: path.join(config.output.build, project.name, format.name),
			export: path.join(config.output.export, project.name, format.name)
		}
	});
	return Object.assign(job, options);
}

export { getBuildJobs, getCleanJobs, getExportJobs };