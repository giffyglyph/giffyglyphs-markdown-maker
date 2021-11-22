/**
 * This utility is in charge of applying translations.
 * 
 * @module TranslationManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import * as fileManager from './fileManager.js';
import i18next from 'i18next';
import YAML from 'yaml';

const messageKeys = {};

/**
 * Create a translator that can be used to translate a HTML DOM.
 * @param {Object} project - The target project.
 * @param {Object} format - The target format.
 * @param {string} language - The target language to translate into.
 * @returns {Object} A translator object.
 */
function createTranslator(project, format, language) {
	const translator = i18next.createInstance();
	translator.init({
		lng: language,
		fallbackLng: 'en',
		resources: {
			en: {
				translation: _getMessageKeys(project, format, 'en')
			},
			[language]: {
				translation: _getMessageKeys(project, format, language)
			}
		}
	});
	translator.processDom = function(job, dom) {
		dom.querySelectorAll("[data-i18n]").forEach((x) => {
			if (this.exists(x.dataset.i18n)) {
				let options = {};
				try {
					if (x.dataset.i18nOptions) {
						options = JSON.parse(x.dataset.i18nOptions);
					}
				} catch (e) {
					e.message  = `[Parsing ${x.dataset.i18nOptions}] ${e.message}`;
					throw e;
				}
				let translation = this.t(x.dataset.i18n, options);
				switch (x.dataset.i18nTransform) {
					case "lowercase":
						translation = translation.toLowerCase();
						break;
					case "uppercase":
						translation = translation.toUpperCase();
						break;
				}
				switch (x.dataset.i18nDisplay) {
					case "inner":
						x.innerHTML = translation;
						break;
					case "outer":
					default:
						x.outerHTML = translation;
						break;
				}
			}
		});
	};
	return translator;
}

/**
 * Delete all loaded message keys.
 */
function deleteMessageKeys() {
	Object.keys(messageKeys).forEach((x) => {
		delete messageKeys[x];
	});
}

/**
 * Load translations from a file (if not already loaded) and return them.
 * @param {Object} project - The target project.
 * @param {Object} format - The target format.
 * @param {string} language - The target language to translate into.
 * @returns {string} A translation file.
 */
function _getMessageKeys(project, format, language) {
	if (!messageKeys[`${project.name}.${format.name}.${language}`]) {
		let translations = fileManager.getFileVariants(project, format, `translations/${language}.yml`);
		if (translations.length > 0) {
			translations = translations.map((x) => YAML.parse(x)).reverse().reduce((x, y) => Object.assign(x, y), {});
		}
		messageKeys[`${project.name}.${format.name}.${language}`] = translations;
	}
	return messageKeys[`${project.name}.${format.name}.${language}`];
}

export { createTranslator, deleteMessageKeys };