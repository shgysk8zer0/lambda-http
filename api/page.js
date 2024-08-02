export default async () => new Response(`
	<!DOCTYPE html>
	<html land="en" dir="ltr">
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width" />
			<meta name="color-scheme" content="light dark" />
			<title>Functions Test</title>
		</head>
		<body>
			<p>Hello, World!</p>
		</body>
	</html>
`, {
	headers: new Headers({ 'Content-Type': 'text/html' }),
});
