/**
 * This utility is in charge of logging information to the console screen.
 * 
 * @module LogManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import clear from 'console-clear';
import consola from 'consola';
import chalk from 'chalk';

let isDiscrete = false;

/**
 * Clear the console screen.
 */
function clearScreen() {
	clear();
}

/**
 * Post a generic message.
 * @param {*} message - The message to print.
 */
function postLog(message) {
	consola.log(message);
}

/**
 * Post a warning message.
 * @param {*} message - The message to print.
 */
function postWarning(message) {
	consola.warn(message);
}

/**
 * Post an error message.
 * @param {*} message - The message to print.
 */
function postError(message) {
	consola.error(message);
}

/**
 * Post an informative message.
 * @param {*} message - The message to print.
 */
function postInfo(message) {
	consola.info(message);
}

/**
 * Post a debug message.
 * @param {*} message - The message to print.
 */
function postDebug(message) {
	consola.debug(message);
}

/**
 * Post an fatal message.
 * @param {*} message - The message to print.
 */
function postFatal(message) {
	consola.fatal(message);
}

/**
 * Post a success message.
 * @param {*} message - The message to print.
 */
function postSuccess(message) {
	consola.success(message);
}

/**
 * Set the logging level.
 * @param {number} level - The logging level in the range -1 (silent) to 5 (trace).
 */
function setLoggingLevel(level) {
	consola.level = level;
}

/**
 * Post an empty line.
 */
function postEmptyLine() {
	consola.log("");
}

/**
 * Format a MarkdownMaker task with consistent coloring. If the logger is set to discrete, wraps the text in brackets instead.
 * @param {string} [project] - The project name.
 * @param {string} [format] - The format name.
 * @param {string} [file] - The file name.
 * @param {string} text - Additional task information.
 * @returns {string} A formatted string.
 */
function formatTask(project, format, file, text) {
  let tags = [];
  if (project) {
    tags.push(formatFg(project, 'yellow'));
  }
  if (format) {
    tags.push(formatFg(format, 'aqua'));
  }
  if (file) {
    tags.push(formatFg(file, 'fuchsia'));
  }
  return (tags.length > 0 ? `${tags.join('/')}: ` : '') + text;
}

/**
 * Set the discrete status of the logger.
 * @param {boolean} discrete - True to be discrete (minimal colors and effects).
 */
function setIsDiscrete(discrete) {
	isDiscrete = discrete;
}

/**
 * Set the background color of a string. If the logger is set to discrete, wraps the text in brackets instead.
 * @param {string} text - The text to format.
 * @returns {string} A formatted string.
 */
function formatBg(text, color) {
	if (isDiscrete) {
		return `[${text}]`;
	} else {
		try {
			return chalk.bgKeyword(color).bold(` ${text} `);
		} catch (e) {
			return `[${text}]`;
		}
	}
}

/**
 * Set the foreground color of a string. If the logger is set to discrete, returns the plain text instead.
 * @param {string} text - The text to format.
 * @returns {string} A formatted string.
 */
 function formatFg(text, color) {
	if (isDiscrete) {
		return text;
	} else {
		try {
			return chalk.keyword(color)(`${text}`);
		} catch (e) {
			return text;
		}
	}
}

export { clearScreen, postLog, postWarning, postInfo, postDebug, postError, postFatal, postSuccess, setLoggingLevel, postEmptyLine, setIsDiscrete, formatBg, formatTask };
