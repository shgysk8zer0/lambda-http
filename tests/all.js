import { RequestHandlerTest } from '../RequestHandlerTest.js';

const { error, duration } = await RequestHandlerTest.loadAndRunTests(
	import.meta.resolve('./base64.js'),
	import.meta.resolve('./cors.js'),
	import.meta.resolve('./dne.js'),
	import.meta.resolve('./echo.js'),
	import.meta.resolve('./error.js'),
	import.meta.resolve('./hash.js'),
	import.meta.resolve('./page.js'),
	import.meta.resolve('./polyfills.js'),
	import.meta.resolve('./redirect.js'),
	import.meta.resolve('./reset.js'),
	import.meta.resolve('./script.js'),
	import.meta.resolve('./svg.js'),
);

console.info(`Tests completed in ${duration}ms.`);

if (error instanceof Error || error instanceof DOMException) {
	throw error;
}
