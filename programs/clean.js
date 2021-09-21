/**
 * This program is in charge of deleting build artifacts.
 * 
 * @module Clean
 * @author Giffyglyph
 */

import del from 'del';
import * as logManager from '../utilities/logManager.js';

/**
 * Delete build artifact folders for a selection of jobs.
 * @param {Object[]} jobs - A list of clean jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function clean(config, jobs) {
	try {
		if (jobs.length > 0) {
			console.log(config.output.build, config.output.export);
			logManager.postEmptyLine();
			logManager.postInfo(logManager.formatBg(`Deleting [${jobs.flatMap((x) => [ x.output.build, x.output.export ]).join(", ")}]`, "blue"));
			return del(jobs.flatMap((x) => [ x.output.build, x.output.export ]));
		}
		
	} catch (e) {
		return Promise.reject(e);
	}
}

export { clean }