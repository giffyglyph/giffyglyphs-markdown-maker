/**
 * This utility is in charge of rendering any blueprint blocks in the dom.
 * 
 * @module BlueprintManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import * as fileManager from './fileManager.js';
import YAML from 'yaml';

/**
 * Check the DOM for any blueprint elements and render them (if possible).
 * @param {Object} job - A specific job
 * @param {Object} dom - The dom element to parse and update.
 * @param {Object} collection - A collection file (optional).
 * @returns {Object} An updated dom.
 */
function renderBlueprints(job, dom, collection) {
	dom.querySelectorAll("[data-blueprint]").forEach((x) => {
		if (typeof job.format.blueprint[x.dataset.blueprint] !== "function") {
			throw new ReferenceError(`Blueprint type [${x.dataset.blueprint}] is missing a function`);
		}
		const config = _getConfig(_getData(job, x), x.dataset.language);
		const options = x.dataset.options ? JSON.parse(x.dataset.options) : {};
		x.outerHTML = job.format.blueprint[x.dataset.blueprint](job, config, options, dom, x, collection);
	});
	return dom;
}

/**
 * Parses data into a specific language. By default, expected configuration language is YAML.
 * @param {string} data - A string of configuration data.
 * @param {string} language - The expected language of the data (json/yaml/etc).
 * @returns {Object} A configuration object.
 */
function _getConfig(data, language) {
	switch (language) {
		case "json":
			return JSON.parse(data);
		case "plain":
			return data;
		case "yaml":
		default:
			return YAML.parse(data);
	}
}

/**
 * Gets blueprint data, either by loading a source file or returning the inner html.
 * @param {Object} job - A specific job.
 * @param {Object} element - The dom element to parse.
 * @returns {string} A string of configuration data.
 */
 function _getData(job, element) {
	if (element.dataset.src) {
		let file = fileManager.findFile(job.project, job.format, element.dataset.src);
		if (!file) {
			throw new ReferenceError(`Couldn't find blueprint src file [${element.dataset.src}]`);
		} else {
			return file;
		}
	} else {
		return element.innerHTML;
	}
}

export { renderBlueprints };