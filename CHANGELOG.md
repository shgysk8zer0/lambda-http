<!-- markdownlint-disable -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v1.1.21] - 2024-12-20

### Added
- Add `@shgysk8zer0/geoutils`

### Changed
- Various version updates

### Fixed
- Updating `@shgysk8zer0/polyfills` fixes compatibility with CJS / `require()`

## [v1.1.20] - 2024-12-09

### Changed
- Update `@shgysk8zer0/jwk-utils`
- Update tests
- Misc other dependency updates

## [v1.1.19] - 2024-09-22

### Added
- Add `RequestHandlerTest.shouldRequireCookies()` test

### Changed
- `NetlifyRequest.prototype.cookies` is now a `Map` set via parsing the `Cookie` header

## [v1.1.18] - 2024-09-22

### Fixed
- decodeRequestToken not bundled

## [v1.1.17] - 2024-09-19

### Changed
- Update dependencies and config

## [v1.1.18] - 2024-09-22

### Fixed
- decodeRequestToken not bundled

## [v1.1.17] - 2024-09-19

### Changed
- Update dependencies and config

## [v1.1.16] - 2024-09-15

### Fixed
- Revert back to using `.js` for modules

## [v1.1.15] - 2024-09-15

### Fixed
- Fix publishing ignoring `.mjs`

## [v1.1.14] - 2024-09-15

### Fixed
- Fix typo in package exports
- Fix bad checks for allowed origins

## [v1.1.13] - 2024-09-12

### Fixed
- Update `@shgysk8zer0/jwk-utils` with fixes to JSDocs

## [v1.1.12] - 2024-09-12

### Changed
- Update `@shgysk8zer0/jwk-utils` again

## [v1.1.11] - 2024-09-10

### Changed
- Update `@shgysk8zer0/jwk-utils` with client-side fixes

## [v1.1.10] - 2024-09-10

### Changed
- Switch to using `node --test` for tests
- Another update to `@shgysk8zer0/jwk-utils`

## [v1.1.9] - 2024-09-07

### Changed
- More misc updates

## [v1.1.8] - 2024-09-02

### Added
- Add test for exporting public JWK as file

### Changed
- Update `@shgysk8zer0/jwk-utils` for easier key management

## [v1.1.7] - 2024-09-01

### Changed
- Update `@shgysk8zer0/jwk-utils` to fix false deprecation

## [v1.1.6] - 2024-09-01

### Changed
- Update `@shgysk8zer0/jwk-utils` with support for nearly all algorithms

## [v1.1.5] - 2024-08-31

### Changed
- Update `@shgysk8zer0/jwk-utils` to fix JWT encoding

## [v1.1.4] - 2024-08-31

### Added
- Added support for JWT via `@shgysk8zer0/jwk-utils`
- Added tests for valid JWTs via Authorization Bearer
- Add `requireJWT` option to `createHandler`
- Add missing documentation to `createHandler`

## [v1.1.3] - 2024-08-28

### Added
- More request validation (headers, search params)
- More tests
- Constants for various HTTP Headers, etc (avoids typos)
- Add support for `URLPattern` in `allowOrigins`
- Support multiple types of return values and convert to `Response` (eg `Blob`, `URL`, numbers) as best as reasonable

## [v1.1.2] - 2024-08-26

### Added
- Numerous more tests!

### Fixed
- Fix an error cloning requests with multipart/form-data

## [v1.1.1] - 2024-08-22

### Added
- Add new `TestRequest` class extending `Request` for tests

### Updated
- Enhance tests with more pre-built tests

## [v1.1.0] - 2024-08-20

### Added
- Add `NetlifyRequest`
- Add `DocumentTemplate`
- Add multiple new tests

### Changed
- In `createHandler`, use `NetlifyRequest` to fix errors in `Request` objects
- Update ESLint to use `.gitignore` and new config

## [v1.0.2] - 2024-08-02

### Added
- Add testing class with utility methods
- Add various tests

### Fixed
- Fix bad support for same-origin requests

## [v1.0.1] - 2024-07-29

### Added
- Add Same-Origin & Cross-Origin (CORS) helper functions
- Add module bundle (`lambda-http.mjs`)

## [v1.0.0] - 2024-07-26

Initial Release
