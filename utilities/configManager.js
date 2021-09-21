/**
 * This utility is in charge of loading and validating the MarkdownMaker configuration file.
 * 
 * @module ConfigManager
 * @author Giffyglyph
 */

import path from 'path';
import url from 'url';
import semver from 'semver';

/**
 * Read, validate, and construct the MarkdownMaker configuration.
 * @async
 * @returns {Object} An object of configuration details (version, formats, projects, etc).
 * @throws {Error} Any error while loading the configuration.
 */
async function createConfig(options) {
	let validatedOptions = _validateMarkdownMakerOptions(options);
	let config = {
		name: "Giffyglyph's Markdown Maker",
		version: "1.0.0",
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
			format.src = format.src ? format.src : path.dirname(path.join(process.cwd(), x));
			return format;
		} catch (e) {
			e.message = `[Loading format ${x}] ${e.message}`;
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
			project.src = project.src ? project.src : path.dirname(path.join(process.cwd(), x));
			return project;
		} catch (e) {
			e.message = `[Loading project ${x}] ${e.message}`;
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
 * Validate the publisher config file.
 * @returns {Object} A publisher config file.
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
	if (typeof json.name === 'undefined') {
		throw new ReferenceError("Format is missing a name.");
	}
	if (typeof json.version === 'undefined') {
		throw new ReferenceError("Format is missing a version.");
	}
	if (typeof json.publisher === 'undefined') {
		throw new ReferenceError("Format is missing a MarkdownMaker compatibility version.");
	}
	if (!semver.satisfies(config.version, json.publisher)) {
		throw new RangeError(`Format isn't compatible with MarkdownMaker v${config.version} (requires v${json.publisher}).`);
	}
	if (typeof json.export === 'undefined') {
		throw new ReferenceError("Format is missing a list of MarkdownMaker export options.");
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
	if (typeof json.name === 'undefined') {
		throw new ReferenceError("Project is missing a name.");
	}
	if (typeof json.version === 'undefined') {
		throw new ReferenceError("Project is missing a version.");
	}
	if (!Array.isArray(json.formats)) {
		throw new TypeError("Project is missing a list of MarkdownMaker formats.");
	}
	if (json.formats.length == 0) {
		throw new RangeError("Project has zero MarkdownMaker formats.");
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

export { createConfig };
