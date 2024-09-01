<!-- markdownlint-disable -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
