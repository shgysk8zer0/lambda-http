const results = await Promise.allSettled([
	import('./echo.js'),
	import('./error.js'),
]);

const errs = [];

for (const result of results) {
	if (result.status === 'rejected') {
		errs.push(result.reason);
	}
}

if (errs.length === 1) {
	throw errs[0];
} else if (errs.length !== 0) {
	throw new AggregateError(errs, 'Some tests failed.');
}
