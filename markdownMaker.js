/**
 * Main entry point to the application. This module takes input from the client and runs programs to create artifacts.
 * 
 * @module MarkdownMaker
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import { build, listBuildTasks } from './programs/build.js';
import { clean } from './programs/clean.js';
import { default as Format } from './classes/format.js';
import { default as Maker } from './classes/maker.js';
import { default as Project } from './classes/project.js';
import { exportFiles } from './programs/export.js';
import { InvalidArgumentError, program } from 'commander';
import { watch } from './programs/watch.js';
import * as configManager from './utilities/configManager.js';
import * as jobManager from './utilities/jobManager.js';
import * as logManager from './utilities/logManager.js';
import * as markdownManager from './utilities/markdownManager.js';

/**
* Main process. Parse input from the client and (if valid) run a program.
* @param {Object} options - MarkdownMaker configuration details.
*/
async function run(options) {
	try {
		let config = await configManager.createConfig(options);
		_initialiseLogger(config);
		markdownManager.initialise();
		_initialisePrograms(config);
		await program.parseAsync(process.argv);
	} catch (e) {
		logManager.postFatal(e);
	}
 }

/**
 * Clear the console screen and post a summary of the MarkdownMaker configuration file.
 * @param {Object} config - MarkdownMaker configuration details.
 */
function _initialiseLogger(config) {
	logManager.clearScreen();
	logManager.postLog(logManager.formatBg(config.title ? config.title : `Starting application`, "green"));
	logManager.postSuccess(`Loaded ${config.name} v${config.version}`);
	if (config.formats.length > 0) {
		logManager.postSuccess(`Loaded ${config.formats.length} format(s): ${config.formats.map((x) => `${x.name} v${x.version}`).join(", ")}`);
	} else {
		logManager.postSuccess(`Loaded 0 formats`);
	}
	if (config.projects.length > 0) {
		logManager.postSuccess(`Loaded ${config.projects.length} project(s): ${config.projects.map((x) => `${x.name} v${x.version}`).join(", ")}`);
	} else {
		logManager.postSuccess(`Loaded 0 projects`);
	}
 }

/**
 * Initialise all runnable programs.
 * @param {Object} config - Program options.
 */
function _initialisePrograms(config) {
	program
		.command('build')
		.description('Compile and deploy your project files.')
		.option('-p, --projects <name...>', 'Project names', (value, previous) => { return _validateProjectName(config, value, previous); })
		.option('-f, --formats <name...>', 'Format names', (value, previous) => { return _validateFormatName(config, value, previous); })
		.option('-l, --languages <code...>', 'Language codes')
		.option('-t, --tasks <task...>', 'Tasks to perform', _validateTaskName)
		.option('-fi, --files <name...>', 'Files to bind')
		.option('-fr, --fragments', 'Build fragments, not collections')
		.option('-c, --clean', 'Delete prebuilt content')
		.option('-w, --watch', 'Watch for changes')
		.option('-d, --debug', 'Show debug information')
		.option('-di, --discrete', 'Minimal colors & graphics in logs')
		.action(async function(args) {
			let buildJobs = jobManager.getBuildJobs(config, args);
			await _startProgram(args, process.argv, buildJobs)
				.then(() => {
					if (args.clean) {
						let cleanJobs = jobManager.getCleanJobs(config, args);
						return clean(cleanJobs);
					}
				})
				.then(() => { return build(buildJobs); })
				.then(() => { if (args.watch) { return watch(buildJobs); } else { _postProgramSuccess(buildJobs); }})
				.catch((x) => { _postProgramError(x); });
		});

	program
		.command('clean')
		.description('Delete any/all built content.')
		.option('-p, --projects <name...>', 'Project names', (value, previous) => { return _validateProjectName(config, value, previous); })
		.option('-f, --formats <name...>', 'Format names', (value, previous) => { return _validateFormatName(config, value, previous); })
		.option('-d, --debug', 'Show debug information')
		.option('-di, --discrete', 'Minimal colors & graphics in logs')
		.action(async function(args) {
			let jobs = jobManager.getCleanJobs(config, args);
			await _startProgram(args, process.argv, jobs)
				.then(() => { return clean(jobs); })
				.then(() => { _postProgramSuccess(jobs) })
				.catch((x) => { _postProgramError(x); });
		});

	program
		.command('watch')
		.description('Watch folders for changes.')
		.option('-p, --projects <name...>', 'Project names', (value, previous) => { return _validateProjectName(config, value, previous); })
		.option('-f, --formats <name...>', 'Format names', (value, previous) => { return _validateFormatName(config, value, previous); })
		.option('-l, --languages <code...>', 'Language codes')
		.option('-t, --tasks <task...>', 'Tasks to perform', _validateTaskName)
		.option('-fi, --files <name...>', 'Files to watch')
		.option('-fr, --fragments', 'Build fragments, not collections')
		.option('-d, --debug', 'Show debug information')
		.option('-di, --discrete', 'Minimal colors & graphics in logs')
		.action(async function(args) {
			let jobs = jobManager.getBuildJobs(config, args);
			await _startProgram(args, process.argv, jobs)
				.then(() => { return watch(jobs); })
				.catch((x) => { _postProgramError(x); });
		});

	program
		.command('export')
		.description('Export built HTML as pdfs/jpgs/pngs/zips.')
		.option('-p, --projects <name...>', 'Project names', (value, previous) => { return _validateProjectName(config, value, previous); })
		.option('-f, --formats <name...>', 'Format names', (value, previous) => { return _validateFormatName(config, value, previous); })
		.option('-fi, --files <name...>', 'HTML files to render (or all files if none specified)')
		.requiredOption('-ex, --export <type>', 'Export type (pdf, jpg, png, or zip)')
		.option('-pg, --pages <pages>', 'Page ranges to render')
		.option('-d, --debug', 'Show debug information')
		.option('-di, --discrete', 'Minimal colors & graphics in logs')
		.action(async function(args) {
			let jobs = jobManager.getExportJobs(config, args);
			await _startProgram(args, process.argv, jobs)
				.then(() => { return exportFiles(jobs); })
				.then(() => { _postProgramSuccess(jobs) })
				.catch((x) => { _postProgramError(x); });
		});

	program
		.command('check')
		.description('Check that the software and configuration are working correctly.')
		.action(async function(args) {
			await _startProgram(args, process.argv, null)
				.then(() => { logManager.postSuccess(logManager.formatBg(`Set up is correct`, "green")); })
				.catch((x) => { _postProgramError(x); });
		});
}

/**
 * Initialise the main logger and set the reporting state.
 * @param {Object} args - Program options.
 * @param {string[]} argv - Command line input arguments.
 */
function _startProgram(args, argv, jobs) {
	try {
		logManager.setIsDiscrete(args.discrete);
		logManager.setLoggingLevel(args.debug ? 6 : 3);
		logManager.postEmptyLine();
		logManager.postInfo(`Running program: ${logManager.formatBg(argv.splice(2).join(" "), 'blue')}`);
		if (Array.isArray(jobs)) {
			logManager.postInfo(`Number of jobs: ${jobs.length}`);
		}
		return Promise.resolve();
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * Log any errors.
 * @param {(string|string[])} error - One or more errors.
 */
function _postProgramError(error) {
	if (Array.isArray(error)) {
		error.forEach((x) => logManager.postError(x));
	} else {
		logManager.postError(error);
	}
	let failures = Array.isArray(error) ? error.length : 1;
	logManager.postWarning(`Program failed with ${failures} error(s)`);
}

/**
 * Post a success message.
 */
function _postProgramSuccess(jobs) {
	logManager.postEmptyLine();
	if (jobs.length == 0) {
		logManager.postSuccess(logManager.formatBg(`Program did zero work`, "green"));
	} else {
		logManager.postSuccess(logManager.formatBg(`Program is complete`, "green"));
	}
}

/**
 * Validate a project name. Is used to validate program arguments before running a job.
 * @param {Object} config - A publisher config file.
 * @param {string} projectName - Target project name.
 * @param {string[]} previous - Array of previously validated project names.
 * @returns {string[]} List of validated project names.
 * @throws {InvalidArgumentError} Project must be listed in config.
 */
function _validateProjectName(config, projectName, previous) {
	let projects = previous ? previous : [];
	if (!config.projects.find((x) => x.name == projectName)) {
		throw new InvalidArgumentError(`Project must be one of [${config.projects.map((x) => x.name).join(", ")}].`);
	}
	projects.push(projectName);
	return projects;
}

/**
 * Validate a format name. Is used to validate program arguments before running a job.
 * @param {Object} config - A publisher config file.
 * @param {string} formatName - Target format name.
 * @param {string[]} previous - Array of previously validated format names.
 * @returns {string[]} List of validated format names.
 * @throws {InvalidArgumentError} Format must be listed in config.
 */
function _validateFormatName(config, formatName, previous) {
	let formats = previous ? previous : [];
	if (!config.formats.find((x) => x.name == formatName)) {
		throw new InvalidArgumentError(`Format must be one of [${config.formats.map((x) => x.name).join(", ")}].`);
	}
	formats.push(formatName);
	return formats;
}

/**
 * Validate a task name. Is used to validate program arguments before running a job.
 * @param {string} taskName - Target task name.
 * @param {string[]} previous - Array of previously validated task names.
 * @returns {string[]} List of validated task names.
 * @throws {InvalidArgumentError} Task must be one of fonts/images/html/scripts/stylesheets/vendors.
 */
function _validateTaskName(taskName, previous) {
	let tasks = previous ? previous : [];
	if (!listBuildTasks().includes(taskName)) {
		throw new InvalidArgumentError(`Task must be one of [${listBuildTasks().join(", ")}].`);
	}
	tasks.push(taskName);
	return tasks;
}

export { run, Format, Project, Maker };