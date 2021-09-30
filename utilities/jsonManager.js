/**
 * This utility is in charge of rendering any JSON blocks in the dom.
 * 
 * @module JsonManager
 * @author Giffyglyph <giffyglyph@gmail.com>
 * @copyright Giffyglyph 2021
 * @license GPL-3.0-or-later
 */

/**
 * Read, validate, and construct the MarkdownMaker configuration.
 * @param {Object} job - A specific job
 * @param {Object} dom - The dom element to check.
 * @returns {Object} An updated dom.
 */
function renderJson(job, dom) {
	dom.querySelectorAll(".json").forEach((x) => {
		if (x.dataset.type && typeof job.format.json[x.dataset.type] == "function") {
			const config = JSON.parse(x.innerHTML);
			const newElement = dom.createElement("div");
			newElement.innerHTML = job.format.json[x.dataset.type](config, dom);
			x.outerHTML = newElement.innerHTML;
			newElement.remove();
		}
	});
	return dom;
}

export { renderJson };