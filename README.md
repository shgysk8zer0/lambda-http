# `@shgysk8zer0/lambda-http`

A collection of node >= 20 utilities for Netlify Functions and AWS Lambda

[![CodeQL](https://github.com/shgysk8zer0/lambda-http/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/shgysk8zer0/lambda-http/actions/workflows/codeql-analysis.yml)
![Node CI](https://github.com/shgysk8zer0/lambda-http/workflows/Node%20CI/badge.svg)
![Lint Code Base](https://github.com/shgysk8zer0/lambda-http/workflows/Lint%20Code%20Base/badge.svg)

[![GitHub license](https://img.shields.io/github/license/shgysk8zer0/lambda-http.svg)](https://github.com/shgysk8zer0/lambda-http/blob/master/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/shgysk8zer0/lambda-http.svg)](https://github.com/shgysk8zer0/lambda-http/commits/master)
[![GitHub release](https://img.shields.io/github/release/shgysk8zer0/lambda-http?logo=github)](https://github.com/shgysk8zer0/lambda-http/releases)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/shgysk8zer0?logo=github)](https://github.com/sponsors/shgysk8zer0)

[![npm](https://img.shields.io/npm/v/@shgysk8zer0/lambda-http)](https://www.npmjs.com/package/@shgysk8zer0/lambda-http)
![node-current](https://img.shields.io/node/v/@shgysk8zer0/lambda-http)
![npm bundle size gzipped](https://img.shields.io/bundlephobia/minzip/@shgysk8zer0/lambda-http)
[![npm](https://img.shields.io/npm/dw/@shgysk8zer0/lambda-http?logo=npm)](https://www.npmjs.com/package/@shgysk8zer0/lambda-http)

[![GitHub followers](https://img.shields.io/github/followers/shgysk8zer0.svg?style=social)](https://github.com/shgysk8zer0)
![GitHub forks](https://img.shields.io/github/forks/shgysk8zer0/lambda-http.svg?style=social)
![GitHub stars](https://img.shields.io/github/stars/shgysk8zer0/lambda-http.svg?style=social)
[![Twitter Follow](https://img.shields.io/twitter/follow/shgysk8zer0.svg?style=social)](https://twitter.com/shgysk8zer0)

[![Donate using Liberapay](https://img.shields.io/liberapay/receives/shgysk8zer0.svg?logo=liberapay)](https://liberapay.com/shgysk8zer0/donate "Donate using Liberapay")
- - -

- [Code of Conduct](./.github/CODE_OF_CONDUCT.md)
- [Contributing](./.github/CONTRIBUTING.md)
<!-- - [Security Policy](./.github/SECURITY.md) -->

This package makes use of node >= 20 having support for the familiar [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
& [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) objects to provide easier and more standards-based
way of creating [ Netlify Functions](https://docs.netlify.com/functions/overview/) and (theoretically) AWS Lambda.

## Benefits
- Familiar `Request` & `Response` objects
- Built-in support for `FormData` & `File`s & `Blob`s
- Easy support for CORS while still being customizable
- Convenient `{ [method]: async handler(requset) }` syntax
- Constants for HTTP Status Codes & common Mime-Types
- A custom HTTPError class
- Currently weighs in at only 42.5 kB (unpacked size, including ESM & CJS & & README LICENSE & CHANGELOG)

## Example

```js
import { createHandler, HTTPError, HTTP_STATUS } from '@shgysk8zer0/lambda-http';

export default createHandler({
  async get(req) {
    return Response.json({
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers),
    });
  },
  async post(req) {
    const data = await req.formData();
    // Or `req.json()`

    if (! (data.has('email') && data.has('password'))) {
      throw new HTTPError('Email and password are required', HTTP_STATUS.BAD_REQUEST);
    } else {
      // Sign-in logic here
      return Response.json(user);
    }
  },
  async put(req) {
    const blob = await req.blob();
    // Or use `req.arrayBuffer()`
    // Maybe save it as a file...

    return new Response(null, { status: HTTP_STATUS.NO_CONTENT });
  }
  async delete(req) {
    const params = new URLSearchParams(req.url);

    if (params.has('id')) {
      // Handle some delete operation
    } else {
      throw new HTTPError('Missing required id.', HTTP_STATUS.BAD_REQUEST);
    }
  }
}, {
  allowOrigins: ['https://example.com'],
  allowHeaders: ['Authorization'],
  exposeHeaders: ['X-Foo'],
  allowCredentials: true,
  logger(err, req) {
    console.error({ err, req });
  }
});
```

## CommonJS (`require()`) Note

This is primarily intended for use with ES Modules, though CJS files are generated via Rollup.
Because of this, bear in mind that default exports and named exports do not perfectly translate,
and you cannot just use `const createHandler = require('@shgysk8zer0/lambda-http')` like you can
with modules. You'll have to use `const { createHandler } = require('@shgysk8zer0/lambda-http')`
or `const { default: createHandler } = require('@shgysk8zer0/lambda-http')`.
