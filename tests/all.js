const start = performance.now();

const results = await Promise.allSettled([
	import('./echo.js'),
	import('./error.js'),
	import('./page.js'),
	import('./svg.js'),
	import('./script.js'),
	import('./redirect.js'),
	import('./reset.js'),
	import('./polyfills.js'),
]);

const errs = [];

for (const result of results) {
	if (result.status === 'rejected') {
		if (result.reason instanceof AggregateError) {
			errs.push(...result.reason.errors);
		} else {
			errs.push(result.reason);
		}
	}
}

if (errs.length === 1) {
	throw errs[0];
} else if (errs.length !== 0) {
	throw new AggregateError(errs, 'Some tests failed.');
}

console.log(`Tests ran in ${performance.now() - start} ms.`);
