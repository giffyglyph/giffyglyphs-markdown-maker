/**
 * This utility is in charge of reading files from the system and managine filepaths.
 * 
 * @module FileManager
 * @author Giffyglyph
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
			path.join(project.src, `${folder}/_${format.name}/**/${filter ? filter : ''}${files}`),
			{ base: path.join(project.src, `${folder}/_${format.name}`) }
		)
	);
}

/**
 * Find a file in one of three cascading folders: project+format, project, then format.
 * @param {Object} project - Project config details.
 * @param {Object} format - Format config details.
 * @param {string} folder - A target folder to search in.
 * @param {string} filename - A target file to find.
 * @returns {string|null} Returns either a file or null if no file is found.
 */
function findFile(project, format, folder, filename) {
	const paths = [
		path.join(project.src, folder, `_${format.name}`, filename),
		path.join(project.src, folder, filename),
		path.join(format.src, folder, filename)
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
 * Create a series of folders.
 * @param {string[]} folders - A list of folders to create in sequence. 
 */
function createPath(folders) {
	let target = '';
	folders.forEach((folder) => {
		target = path.join(target, folder);
		if (!fs.existsSync(target)) {
			fs.mkdirSync(target);
		}
	});
}

export { getSrc, findFile, listFilenames, createPath };
