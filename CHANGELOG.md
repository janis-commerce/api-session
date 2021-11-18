# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Updated dependencies

## [3.2.0] - 2021-11-18
### Added
- Getter and setter

## [3.1.1] - 2021-01-27
### Added
- Typings build from JSDoc

## [3.1.0] - 2020-12-17
### Added
- Extra parameters for constructor when 'sessionate' a Class with `getSessionInstance()`

## [3.0.0] - 2020-08-27
### Added
- APISession constructor new parameter `client` object
- GitHub Actions

### Changed
- Using service model for getting clients

### Removed
- Included model and model dependency
- Settings usage

## [2.0.0] - 2020-06-11
### Added
- `locations` and `hasAccessToAllLocations` getters
- `validateLocation` method

### Removed
- `stores` and `hasAccessToAllStores` getters
- `validateStore` method

## [1.4.0] - 2020-05-19
### Removed
- `package-lock.json` file

## [1.3.1] - 2020-03-25
### Added
- `userIsDev`, `serviceName`, `isService` getters

## [1.3.0] - 2020-01-21
### Added
- `stores` and `hasAccessToAllStores` getters
- `validateStore`

## [1.2.1] - 2019-10-16
### Fixed
- README typo fixed

## [1.2.0] - 2019-10-01
### Changed
- Model version updated

## [1.1.0] - 2019-10-01
### Added
- getSessionInstance method to session instance

## [1.0.0] - 2019-09-27
### Added
- Session management
- Client fetching on demand
- Client injection to propagate the session
