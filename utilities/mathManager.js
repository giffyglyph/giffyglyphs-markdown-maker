/**
 * This utility is in charge of running math functions with [mathjs]{@link https://mathjs.org}.
 * 
 * @module MathManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

import { create, all } from 'mathjs';

const math = create(all, {});

/**
 * Render a math blueprint.
 * @param {Object} job - The currently-active job.
 * @param {Object} config - The blueprint configuration.
 * @param {Object} options - Additional options.
 * @param {Object} dom - The html DOM.
 * @returns {String} A HTML string.
 */
function renderBlueprint(job, config, options, dom) {
	return math.evaluate(config, options);
}

export { math, renderBlueprint };
