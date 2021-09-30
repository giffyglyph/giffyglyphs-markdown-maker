/**
 * This utility is in charge of loading and validating the MarkdownMaker configuration file.
 * 
 * @module ConfigManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import path from 'path';
import url from 'url';
import semver from 'semver';
import fs from 'fs';

/**
 * Read, validate, and construct the MarkdownMaker configuration.
 * @async
 * @returns {Object} An object of configuration details (version, formats, projects, etc).
 * @throws {Error} Any error while loading the configuration.
 */
async function createConfig(options) {
	let validatedOptions = _validateMarkdownMakerOptions(options);
	let config = {
		title: validatedOptions.title ? validatedOptions.title : null,
		name: "Giffyglyph's Markdown Maker",
		version: _getPackageVersion(),
		output: validatedOptions.output,
		warnings: []
	};
	await _loadFormatsIntoConfig(validatedOptions.formats, config);
	await _loadProjectsIntoConfig(validatedOptions.projects, config);
	return config;
}

/**
 * Load all formats and any associated modules into the config file.
 * @async
 * @param {string[]} formatPaths - A list of relative paths to format folders.
 * @throws {Error} Any error while loading a format.
 */
async function _loadFormatsIntoConfig(formatPaths, config) {
	let formats = await Promise.allSettled(formatPaths.map(async(x) => {
		try {
			let format = _validateFormat((await import(url.pathToFileURL(path.join(process.cwd(), x)))).default, config);
			format.name = path.basename(x, '.js');
			format.src = format.src ? format.src : path.dirname(path.join(process.cwd(), x));
			return format;
		} catch (e) {
			e.message = `[Loading ${x}] ${e.message} Update the format or remove it from the configuration.`;
			throw e;
		}
	}));
	let error = formats.find((x) => x.status == "rejected");
	if (error) {
		throw error.reason;
	}
	config.formats = formats.map((x) => x.value).filter((x) => x != null);
}

/**
 * Load all projects and any associated modules into the config file.
 * @async
 * @param {string[]} projectPaths - A list of relative paths to project folders.
 * @throws {Error} Any error while loading a project.
 */
async function _loadProjectsIntoConfig(projectPaths, config) {
	let projects = await Promise.allSettled(projectPaths.map(async(x) => {
		try {
			let project = _validateProject((await import(url.pathToFileURL(path.join(process.cwd(), x)))).default, config);
			project.name = path.basename(x, '.js');
			project.src = project.src ? project.src : path.dirname(path.join(process.cwd(), x));
			return project;
		} catch (e) {
			e.message = `[Loading ${x}] ${e.message} Update the project or remove it from the configuration.`;
			throw e;
		}
	}));
	let error = projects.find((x) => x.status == "rejected");
	if (error) {
		throw error.reason;
	}
	config.projects = projects.map((x) => x.value).filter((x) => x != null);
}

/**
 * Validate the markdown maker config file.
 * @returns {Object} A markdown maker config file.
 * @returns {Object} A validated json object.
 * @throws {Error} Any validation error.
 */
function _validateMarkdownMakerOptions(options) {
	if (typeof options.output?.build === 'undefined') {
		throw new ReferenceError("MarkdownMaker is missing a build output directory.");
	}
	if (typeof options.output?.export === 'undefined') {
		throw new ReferenceError("MarkdownMaker is missing an export output directory.");
	}
	if (options.output.build == options.output.export) {
		throw new ReferenceError("MarkdownMaker build and export directories can't be the same.");
	}
	if (!Array.isArray(options.formats)) {
		throw new ReferenceError("MarkdownMaker is missing a list of formats.");
	}
	if (!Array.isArray(options.projects)) {
		throw new ReferenceError("MarkdownMaker is missing a list of projects.");
	}
	return options;
}

/**
 * Validate a format config file.
 * @param {string} src - Path to the format folder (relative to MarkdownMaker).
 * @param {Object} json - Contents of the format config file.
 * @param {Object} config - A MarkdownMaker config file.
 * @returns {Object} A validated json object.
 * @throws {Error} Any validation error.
 */
function _validateFormat(json, config) {
	if (typeof json.version === 'undefined') {
		throw new ReferenceError("This format is missing a version.");
	}
	if (typeof json.markdownMaker === 'undefined') {
		throw new ReferenceError("This format is missing a MarkdownMaker compatibility version.");
	}
	if (!semver.satisfies(config.version, json.markdownMaker)) {
		throw new RangeError(`This format requires MarkdownMaker v${json.markdownMaker} (v${config.version} installed).`);
	}
	if (typeof json.export === 'undefined') {
		throw new ReferenceError("This format is missing a list of MarkdownMaker export options.");
	}
	return json;
}

/**
 * Validate a project config file.
 * @param {string} src - Path to the project folder (relative to MarkdownMaker).
 * @param {Object} json - Contents of the project config file.
 * @param {Object} config - A MarkdownMaker config file.
 * @returns {Object} A validated json object.
 * @throws {Error} Any validation error.
 */
function _validateProject(json, config) {
	if (typeof json.version === 'undefined') {
		throw new ReferenceError("This project is missing a version.");
	}
	if (!Array.isArray(json.formats)) {
		throw new TypeError("This project is missing a list of MarkdownMaker formats.");
	}
	if (json.formats.length == 0) {
		throw new RangeError("This project has zero MarkdownMaker formats.");
	}
	json.formats.forEach((x, i) => {
		if (typeof x.name === 'undefined') {
			throw new ReferenceError(`Project format[${i}] is missing a name.`);
		}
		if (typeof x.version === 'undefined') {
			throw new ReferenceError(`Project format[${i}] is missing a version.`);
		}
		if (!Array.isArray(x.languages)) {
			throw new ReferenceError(`Project format[${i}] is missing a list of languages.`);
		}
		let format = config.formats.find((y) => y.name == x.name);
		if (!format) {
			throw new ReferenceError(`Project format[${i}] "${x.name}" hasn't been loaded into MarkdownMaker.`);
		}
		if (!semver.satisfies(format.version, x.version)) {
			throw new ReferenceError(`Project format[${i}] "${x.name}" isn't compatible with loaded format v${format.version} (requires v${x.version}).`);
		}
	});
	return json;
}

/**
 * Get the package version.
 * @returns {string} A package version.
 */
function _getPackageVersion() {
	const packagePath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "../package.json");
	const json = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	return json.version;
}

export { createConfig };
