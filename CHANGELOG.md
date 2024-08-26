<!-- markdownlint-disable -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
