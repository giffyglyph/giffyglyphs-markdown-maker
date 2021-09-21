/**
 * This utility is in charge of exporting HTML in various formats.
 * 
 * @module ExportManager
 * @author Giffyglyph
 */

import * as fileManager from './fileManager.js';
import * as logManager from './logManager.js';
import path from 'path';
import puppeteer from 'puppeteer';
import archiver from 'archiver';
import fs from 'fs';

const BROWSER = {
	headless: true,
	args: [ '--font-render-hinting=none' ]
};

/**
 * Exports an HTML file as a PDF.
 * @async
 * @param {Object} job - A specific export job.
 * @param {string} file - A path to an HTML file.
 * @param {Object} options - Any additional rendering options.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
async function exportPdf(job, file, options) {
	let browser = null;
	let promise = null;
	try {
		browser = await puppeteer.launch(BROWSER);
		logManager.postDebug(logManager.formatTask(job.project.name, job.format.name, file, 'Opening file...'));
		const page = await browser.newPage();
		await page.goto(`file://${path.join(process.cwd(), job.output.build, "html", file)}`, { timeout: 3000000, waitUntil: 'networkidle0' });
		await page.emulateMedia('print');
		fileManager.createPath(job.output.exportRoute.concat([ 'pdfs' ]));
		const outputPath = path.join(process.cwd(), job.output.export, 'pdfs', `${path.parse(path.basename(file)).name}.pdf`);
		logManager.postInfo(logManager.formatTask(job.project.name, job.format.name, file, 'Rendering file...'));
		let pdfOptions = Object.assign({}, options, {
			path: outputPath,
			pageRanges: options.pageRanges ? _getPrintRangeAsArray(options.pageRanges).join(',') : ""
		});
		await page.pdf(pdfOptions);
		logManager.postSuccess(logManager.formatTask(job.project.name, job.format.name, file, 'Exported new PDF'));
		promise = Promise.resolve();
	} catch (err) {
		promise = Promise.reject(err);
	} finally {
		if (browser && browser.close) {
			await browser.close();
		}
	}
	return promise;
}

/**
 * Exports an HTML file as a series of PNGs.
 * @async
 * @param {Object} job - A specific export job.
 * @param {string} file - A path to an HTML file.
 * @param {Object} options - Any additional rendering options.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
async function exportPngs(job, file, options) {
	let browser = null;
	let promise = null;
	try {
		browser = await puppeteer.launch(BROWSER);
		logManager.postDebug(logManager.formatTask(job.project.name, job.format.name, file, 'Opening file...'))
		const page = await browser.newPage();
		await page.goto(`file://${path.join(process.cwd(), job.output.build, "html", file)}`, { timeout: 3000000, waitUntil: 'networkidle0' });
		await page.emulateMedia('print');

		// Get list of page elements and coords to render
		const elements = await page.$$eval(options.selector ? options.selector : "body", (elements) => elements.map(function(element) {
			return {
				height: element.offsetHeight,
				width: element.offsetWidth,
				x: element.offsetLeft,
				y: element.offsetTop
			};
		}));

		fileManager.createPath(job.output.exportRoute.concat([ 'pngs' ]));
		let printRanges = options.pageRanges ? _getPrintRangeAsArray(options.pageRanges) : null;
		await elements.reduce(async(value, element, index) => {
			if (printRanges == null || printRanges.includes(index + 1)) {
				const outputPath = path.join(job.output.export, 'pngs', `${path.parse(path.basename(file)).name}_p${index + 1}.png`);
				await value;
				try {
					await page.setViewport({
						width: element.width,
						height: element.height,
						deviceScaleFactor: options.deviceScaleFactor ? options.deviceScaleFactor : 1
					});
					await page.evaluate((element) => {
						window.scrollTo(element.x, element.y);
					}, element);
					await page.screenshot({
						path: outputPath,
						type: 'png'
					});
					logManager.postSuccess(logManager.formatTask(job.project.name, job.format.name, file, `Exported page ${index + 1}`));
				} catch (error) {
					logManager.postError(error);
				}
			}
			return Promise.resolve();
		}, Promise.resolve());
		promise = Promise.resolve();
	} catch (err) {
		promise = Promise.reject(err);
	} finally {
		if (browser && browser.close) {
			await browser.close();
		}
	}
	return promise;
}

/**
 * Exports an HTML file as a series of JPGs.
 * @async
 * @param {Object} job - A specific export job.
 * @param {string} file - A path to an HTML file.
 * @param {Object} options - Any additional rendering options.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
async function exportJpgs(job, file, options) {
	let browser = null;
	let promise = null;
	try {
		browser = await puppeteer.launch(BROWSER);
		logManager.postDebug(logManager.formatTask(job.project.name, job.format.name, file, 'Opening file...'))
		const page = await browser.newPage();
		await page.goto(`file://${path.join(process.cwd(), job.output.build, "html", file)}`, { timeout: 3000000, waitUntil: 'networkidle0' });
		await page.emulateMedia('print');

		// Get list of page elements and coords to render
		const elements = await page.$$eval(options.selector ? options.selector : "body", (elements) => elements.map(function(element) {
			return {
				height: element.offsetHeight,
				width: element.offsetWidth,
				x: element.offsetLeft,
				y: element.offsetTop
			};
		}));

		fileManager.createPath(job.output.exportRoute.concat([ 'jpgs' ]));
		let printRanges = options.pageRanges ? _getPrintRangeAsArray(options.pageRanges) : null;
		await elements.reduce(async(value, element, index) => {
			if (printRanges == null || printRanges.includes(index + 1)) {
				const outputPath = path.join(job.output.export, 'jpgs', `${path.parse(path.basename(file)).name}_p${index + 1}.jpg`);
				await value;
				try {
					await page.setViewport({
						width: element.width,
						height: element.height,
						deviceScaleFactor: options.deviceScaleFactor ? options.deviceScaleFactor : 1
					});
					await page.evaluate((element) => {
						window.scrollTo(element.x, element.y);
					}, element);
					await page.screenshot({
						path: outputPath,
						type: 'jpeg'
					});
					logManager.postSuccess(logManager.formatTask(job.project.name, job.format.name, file, `Exported page ${index + 1}`));
				} catch (error) {
					logManager.postError(error);
				}
				return Promise.resolve();
			}
		}, Promise.resolve());
		promise = Promise.resolve();
	} catch (err) {
		promise = Promise.reject(err);
	} finally {
		if (browser && browser.close) {
			await browser.close();
		}
	}
	return promise;
}

/**
 * Exports a project artifact folder as a ZIP.
 * @async
 * @param {Object} job - A specific export job.
 * @returns {Promise} Promise that represents the success/failure state of the job.
 */
function exportZip(job) {
	try {
		fileManager.createPath(job.output.exportRoute.concat([ 'zips' ]));
		let zipName = job.project.name + "_" + (new Date().toISOString().slice(0, 19).replace(/[-:]/g, ""));
		const output = fs.createWriteStream(path.join(process.cwd(), job.output.export, 'zips', `${zipName}.zip`));
		const archive = archiver('zip', { zlib: { level: 9 }});
		archive.on('warning', function(err) {
			if (err.code === 'ENOENT') {
				logManager.postWarning(err);
			} else {
				throw err;
			}
		});
		archive.on('error', function(err) {
			throw err;
		});
		archive.pipe(output);
		["fonts", "scripts", "stylesheets", "vendors", "html", "images"].forEach((x) => {
			archive.directory(path.join(process.cwd(), job.output.build, x), x);
		});
		archive.finalize();
		return Promise.resolve(`Created ${zipName}.zip`);
	} catch (e) {
		return Promise.reject(e);
	}
}

/**
 * Turn a print range string into an array of page numbers.
 * @param {string} range - A print range (e.g. 1-4,8,12-15).
 * @returns {number[]} A list of unique page numbers.
 */
function _getPrintRangeAsArray(range) {
	let ranges = range.split(",").flatMap((x) => {
		let matches = x.match(/^([0-9]*)-?([0-9]*)$/m) || [];
		if (matches[1] && matches[2]) {
			return Array.from({ length: parseInt(matches[2]) + 1 - parseInt(matches[1])}, (_, i) => parseInt(matches[1]) + i);
		} else if(matches[1]) {
			return parseInt(matches[1]);
		} else if (matches[2]) {
			return parseInt(matches[2]);
		}
	}).filter((x) => x != null);
	return [...new Set(ranges)].sort((x, y) => x - y);
}

export { exportPdf, exportPngs, exportJpgs, exportZip };