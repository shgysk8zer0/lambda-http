export const contextFallback = Object.freeze({
	account: { id: '0' },
	cookies: {
		delete() {
			//
		},
		get() {
			//
		},
		set() {
			//
		}
	},
	deploy: { context: 'dev', id: '0', published: false },
	flags: {},
	geo: {
		city: 'Los Angeles',
		country: { code: 'US', name: 'United States' },
		subdivision: { code: 'CA', name: 'California' },
		timezone: 'America/Los_Angeles',
		latitude: 0,
		longitude: 0
	},
	ip: '::1',
	// json: [Function: Rt],
	// log: [Function: log],
	// next: [Function: next],
	params: {},
	requestId: '0',
	// rewrite: [Function: rewrite],
	server: { region: 'dev' },
	site: {
		id: '4ec8c095-b052-4ffe-beec-7dbcc4b4a753',
		name: 'dev-server',
		url: 'http://localhost:8888'
	}
});
