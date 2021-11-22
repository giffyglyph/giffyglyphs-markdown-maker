/**
 * This program is in charge of deleting build artifacts.
 * 
 * @module Clean
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import del from 'del';
import * as logManager from '../utilities/logManager.js';

/**
 * Delete build artifact folders for a selection of jobs.
 * @param {Object[]} jobs - A list of clean jobs to perform.
 * @returns {Promise} Promise that represents the success/failure states of all jobs.
 */
function clean(jobs) {
	try {
		if (jobs.length > 0) {
			let folders = jobs.flatMap((x) => [ x.output.build, x.output.export ]);
			logManager.postEmptyLine();
			logManager.postInfo(logManager.formatBg(`Deleting [${folders.join(", ")}]`, "blue"));
			return del(folders);
		}
	} catch (e) {
		return Promise.reject(e);
	}
}

export { clean }