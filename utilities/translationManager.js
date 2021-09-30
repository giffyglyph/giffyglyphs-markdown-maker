/**
 * This utility is in charge of applying translations.
 * 
 * @module TranslationManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import * as fileManager from './fileManager.js';

const messageKeys = {};

/**
 * Create a translator and load it with translation keys.
 * @param {Object} project - The target project.
 * @param {Object} format - The target format.
 * @param {string} language - The target language to translate into.
 * @returns {Object} A translator object that can be used repeatedly.
 */
function createTranslator(project, format, language) {
	const messages = _getMessageKeys (project, format, language);

	return {		
		getMessage: function(key, vars) {
			const message = messages.match(new RegExp(`${key}=(.*?)$`, 'm'));
			return message ? _applyVars(message[1], vars) : key;
		},
		replaceMessages: function(text) {
			return text.replace(/{{msg:(.*?)}}/g, function(match, p1) {
				const message = _getMessageKeys(project, format, language).match(new RegExp(`${p1}=(.*?)$`, 'm'));
				return message ? message[1] : match;
			});
		},
		hasKey: function(key) {
			const message = messages.match(new RegExp(`${key}=(.*?)$`, 'm'));
			return message ? true : false;
		}
	}
}

/**
 * Load translations from a file (if not already loaded) and return them.
 * @param {Object} project - The target project.
 * @param {Object} format - The target format.
 * @param {string} language - The target language to translate into.
 * @returns {string} A translation file.
 * @todo Should return an object of unique keys, not a single block of text.
 */
function _getMessageKeys(project, format, language) {
	if (!messageKeys[`${project.name}.${format.name}.${language}`]) {
		let keys = fileManager.findFile(project, format, 'translations', `${language}.txt`);
		messageKeys[`${project.name}.${format.name}.${language}`] = keys;
	}
	return messageKeys[`${project.name}.${format.name}.${language}`];
}

/**
 * Replace message placeholders with variables (e.g. "getting {0} messages").
 * @param {string} message - The current message.
 * @param {string[]} vars - A list of variables.
 * @returns {string} An updates message string.
 */
function _applyVars(message, vars) {
	if (vars) {
		let output = message;
		vars.forEach((x, i) => {
			output = output.replace(new RegExp("\\{" + i + "\\}", "g"), x);
		});
		return output;
	} else {
		return message;
	}
}

export { createTranslator };