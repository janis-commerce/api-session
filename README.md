# api-session

[![Build Status](https://travis-ci.org/janis-commerce/api-session.svg?branch=master)](https://travis-ci.org/janis-commerce/api-session)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api-session/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api-session?branch=master)

A session manager for APIs

## Installation
```sh
npm install @janiscommerce/api-session
```

## API
The package exports two classes ApiSession and ApiSessionError.

### ApiSession

* constructor(authorizationData)
Receives an object with the following (optional) properties: { userId, clientId, clientCode, profileId, permissions }

* validateLocation(locationId)
Validate if the location given is valid for the session.
Returns *Boolean*.

ApiSession has the following getters:
* userId {string} The ID of the user or undefined in case there is no user
* userIsDev {boolean} If user is dev
* serviceName {string} The name of the service or undefined in case there is no service
* isService {boolean} If session is associated to a service
* clientId {string} The ID of the client or undefined in case there is no client
* clientCode {string} The code of the client or undefined in case there is no client
* profileId {string} The ID of the profile or undefined in case there is no profile
* locations {array<string>} The List of locations
* hasAccessToAllLocations {boolean} If has access to all locations
* permissions {array} The permission keys or undefined in case there are no permissions associated
* *async* client {object} Resolves to the client object with the `getInstance()` method injected. The properties depend on your client internal structure. The client is injected with a `getInstance()` method to propagate the session to other instances.


:warning::skull: Since version 2.0.0 stores and hasAccessToAllStores getters have been removed . Also the method validateStore(storeId). :skull::warning:

## Settings
The package has some configurable parameters, which are loaded using [@janiscommerce/settings](https://www.npmjs.com/package/@janiscommerce/settings)

| Setting | Description | Default value |
| --- | --- | --- |
| `clients.databaseKey` | Indicates the DB key to use to fetch a session's client | `'core'` |
| `clients.table` | Indicates the table to use to fetch a session's client | `'clients'` |
| `clients.identifierField` | Indicates the field to use as a filter to fetch a session's client | `'code'` |


## Usage
```js
const { ApiSession, ApiSessionError } = require('@janiscommerce/api-session');
```

## Examples
```js
const { ApiSession } = require('@janiscommerce/api-session');

const SomeModel = require('../models/some-model');

const session = new ApiSession({
	userId: 1,
	userIsDev: false,
	clientId: 2,
	clientCode: 'janis',
	profileId: 5,
	permissions: [
		'catalog:product:read',
		'catalog:product:write'
	],
	locations: ['location-1'],
	hasAccessToAllLocations: false
});

console.log(`Session created for user ${session.userId} on client ${session.clientCode}.`);

const sessionInjectedModel = session.getSessionInstance(SomeModel);

console.log(`Session is propagated for user ${sessionInjectedModel.session.userId} on client ${sessionInjectedModel.session.clientCode}.`);

const client = await sessionInjectedModel.session.client;

console.log(client);
// Outputs your client object

const hasAccess = session.validateLocation('location-1');

console.log(`Session has access to location 1: ${hasAccess}`);
// Outputs 'Session has access to location 1: true'
```