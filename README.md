# api-session

![Build Status](https://github.com/janis-commerce/api-session/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api-session/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api-session?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fapi-session.svg)](https://www.npmjs.com/package/@janiscommerce/api-session)


A session manager for APIs

## 📦 Installation
```sh
npm install @janiscommerce/api-session
```

## :gear: API
The package exports two classes ApiSession and ApiSessionError.

### `constructor(authorizationData, client)`

Creates an APISession with the `authorizationData` provided or the `client` for direct injection.

#### Parameters

- `authorizationData` is an **optional** _object_ with the following (also optional) properties: { userId, clientId, clientCode, profileId, permissions, locations, hasAccessToAllLocations, warehousesIds, hasAccessToAllWarehouses }
- `client` is an **optional** _object_ for client injection without performing any DB gets

### `validateLocation(locationId)`

Validate if the location given is valid for the session.
Returns *Boolean*.

### `validateWarehouse(warehouseId)`. _Since 3.3.0_

Validate if the warehouse given is valid for the session.
Returns *Boolean*.

### APISession getters

ApiSession has the following getters:

* userId {string} The ID of the user or undefined in case there is no user
* userIsDev {boolean} If user is dev
* serviceName {string} The name of the service or undefined in case there is no service
* isService {boolean} If session is associated to a service
* clientId {string} The ID of the client or undefined in case there is no client
* clientCode {string} The code of the client or undefined in case there is no client
* profileId {string} The ID of the profile or undefined in case there is no profile
* locations {array<string>} The List of Locations to which the user has permissions
* hasAccessToAllLocations {boolean} If has access to all locations
* warehousesIds {array<string>} The List of Warehouses to which the user has permissions. _Since 3.3.0_
* hasAccessToAllWarehouses {boolean} If has access to all Warehouses. _Since 3.3.0_
* permissions {array} The permission keys or undefined in case there are no permissions associated
* *async* client {object} Resolves to the client object with the `getInstance()` method injected. The properties depend on your client internal structure. The client is injected with a `getInstance()` method to propagate the session to other instances.

## Model Client
The package uses the Client Model in our service for getting the clients. For more information see [@janiscommerce/model](https://www.npmjs.com/package/@janiscommerce/model)

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

const sessionInjectedModel = session.getSessionInstance(SomeModel, 'some-param', 'some-other-param');

console.log(`Session is propagated for user ${sessionInjectedModel.session.userId} on client ${sessionInjectedModel.session.clientCode}.`);

const client = await sessionInjectedModel.session.client;

console.log(client);
// Outputs your client object

const hasAccess = session.validateLocation('location-1');

console.log(`Session has access to location 1: ${hasAccess}`);
// Outputs 'Session has access to location 1: true'
```