/**
 * This utility is in charge of creating jobs (i.e. "work to be done") from arguments.
 * 
 * @module JobManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import path from 'path';
import * as logManager from './logManager.js';
import { listBuildTasks } from '../programs/build.js';
import { default as Job } from '../classes/job.js';

/**
 * Get a list of jobs to perform.
 * @param {Object} config - The MarkdownMaker configuration file.
 * @param {Object} args - A collection of job arguments (projects, formats, files, etc).
* @returns {Object[]} A list of jobs.
 */
function getJobs(config, args) {
	let jobs = [];
	let warnings = [];
	let projects = args.projects ? [...new Set(args.projects)] : config.projects.map((x) => x.name);
	if (projects) {
		projects.forEach((project) => {
			let projectConfig = config.projects.find((x) => x.name == project);
			let formats = args.formats ? [...new Set(args.formats)] : projectConfig.formats.map((x) => x.name);
			if (formats) {
				formats.forEach((format) => {
					if (!projectConfig.formats.find((x) => x.name == format)) {
						warnings.push(`Project "${projectConfig.name}" doesn't support format "${format}": skipping...`);
					} else {
						let formatConfig = config.formats.find((x) => x.name == format);
						if (args.export && !formatConfig.export[args.export]) {
							warnings.push(`"${projectConfig.name}/${format}" doesn't support export option "${args.export}": skipping...`);
						} else {
							let languages = args.languages ? [...new Set(args.languages)] : projectConfig.formats.find((x) => x.name == format)?.languages;
							if (!languages) {
								warnings.push(`No output languages specified for "${projectConfig.name}/${format}": skipping...`);
							} else {
								jobs.push(new Job({
									project: projectConfig,
									format: formatConfig,
									languages: languages,
									files: args.files,
									fragments: args.fragments,
									export: args.export,
									pages: args.pages,
									debug: args.debug,
									tasks: args.tasks ? [...new Set(args.tasks)] : listBuildTasks(),
									output: {
										root: config.outputDir,
										build: path.join(config.output.build, projectConfig.name, formatConfig.name),
										buildRoute: [config.output.build, projectConfig.name, formatConfig.name],
										export: path.join(config.output.export, projectConfig.name, formatConfig.name),
										exportRoute: [config.output.export, projectConfig.name, formatConfig.name]
									}
								}));
							}
						}
					}
				});
			}
		});
	}
	if (warnings.length > 0) {
		logManager.postEmptyLine();
		warnings.forEach((x) => logManager.postInfo(x));
	}
	return jobs;
}

export { getJobs };