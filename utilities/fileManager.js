/**
 * This utility is in charge of reading files from the system and managine filepaths.
 * 
 * @module FileManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import gulp from 'gulp';
import path from 'path';
import fs from 'fs';
import glob from 'glob';

/**
 * Get a gulp stream of all files filtered by project/format/file.
 * @param {Object} project - A project.
 * @param {Object} format - A format.
 * @param {string} folder - A folder name.
 * @param {string} files - A file or filenames.
 * @param {string} filter - Any additional filters.
 * @returns {Object} A gulp stream of source files.
 */
function getSrc(project, format, folder, files, filter) {
	return gulp.src(
		path.join(format.src, `${folder}/**/${filter ? filter : ''}${files}`),
		{ base: path.join(format.src, `${folder}`) }
	).pipe(
		gulp.src(
			[
				path.join(project.src, `${folder}/**/${filter ? filter : ''}${files}`),
				`!${path.join(project.src, `${folder}/_*/**/${filter ? filter : ''}${files}`)}`
			],
			{ base: path.join(project.src, `${folder}`) }
		)
	).pipe(
		gulp.src(
			path.join(project.src, `formats/${format.name}/${folder}/**/${filter ? filter : ''}${files}`),
			{ base: path.join(project.src, `formats/${format.name}/${folder}`) }
		)
	);
}

/**
 * Find a file in one of three cascading folders: project+format, project, then format.
 * @param {Object} project - Project config details.
 * @param {Object} format - Format config details.
 * @param {string} filepath - A target file to find.
 * @returns {string|null} Returns either a file or null if no file is found.
 */
function findFile(project, format, filepath) {
	const paths = [
		path.join(project.src, "formats", format.name, filepath),
		path.join(project.src, filepath),
		path.join(format.src, filepath)
	];
	let file = null;
	paths.some((path) => {
		if (fs.existsSync(path)) {
			file = fs.readFileSync(path, 'utf8');
			return true;
		} else {
			return false;
		}
	});
	return file;
}

/**
 * List all filenames in a directory.
 * @param {string} dir - A directory path.
 * @returns {string[]} A list of filenames.
 */
function listFilenames(dir) {
	return glob.sync(dir).map((x) => path.basename(x));
}

/**
 * Create a path.
 * @param {string} path - A folder path. 
 */
function createPath(path) {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path, { recursive: true });
	}
}

export { getSrc, findFile, listFilenames, createPath };
