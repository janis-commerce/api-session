'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const mockRequire = require('mock-require');

const { ApiSession, ApiSessionError } = require('../lib');
const Client = require('./../lib/client');

describe('Api Session', () => {

	afterEach(() => {
		sandbox.restore();
		Client._instance = null; // eslint-disable-line
		Client._clientsCache = null; // eslint-disable-line
	});

	const ClientModel = class ClientModel {

		async getBy() {
			// nothing to do here, just for stub
		}
	};

	const loadModelClient = clients => {

		mockRequire(Client.getRelativePath(), ClientModel);

		if(clients) {
			sandbox.stub(ClientModel.prototype, 'getBy')
				.resolves(clients);
		}
	};

	context('No authentication data', () => {

		const session = new ApiSession();

		describe('Getters', () => {
			it('Should return undefined for userId', () => {
				assert.strictEqual(session.userId, undefined);
			});

			it('Should return undefined for clientId', () => {
				assert.strictEqual(session.clientId, undefined);
			});

			it('Should return undefined for clientCode', () => {
				assert.strictEqual(session.clientCode, undefined);
			});

			it('Should return undefined for profileId', () => {
				assert.strictEqual(session.profileId, undefined);
			});

			it('Should return undefined for permissions', () => {
				assert.strictEqual(session.permissions, undefined);
			});

			it('Should return undefined for client', async () => {
				assert.strictEqual(await session.client, undefined);
			});

			it('Should return undefined for locations', async () => {
				assert.strictEqual(session.locations, undefined);
			});

			it('Should return undefined for hasAccessToAllLocations', async () => {
				assert.strictEqual(session.hasAccessToAllLocations, undefined);
			});

			it('Should return false for userIsDev', () => {
				assert.strictEqual(session.userIsDev, false);
			});

			it('Should return undefined for serviceName', () => {
				assert.strictEqual(session.serviceName, undefined);
			});

			it('Should return false for isService', () => {
				assert.strictEqual(session.isService, false);
			});
		});

		describe('Validate Locations', () => {
			it('Should return false', () => {
				assert.strictEqual(session.validateLocation('locations-id'), false);
			});
		});
	});

	context('User related authentication data', () => {

		const session = new ApiSession({
			serviceName: 'some-service',
			userId: 'some-user-id',
			userIsDev: true,
			clientId: 'some-client-id',
			clientCode: 'some-client-code',
			profileId: 'some-profile-id',
			permissions: ['service:namespace:method1', 'service:namespace:method2'],
			locations: ['location-1', 'location-2'],
			hasAccessToAllLocations: false
		});

		describe('Getters', () => {
			it('Should return the correct userId', () => {
				assert.strictEqual(session.userId, 'some-user-id');
			});

			it('Should return the correct clientId', () => {
				assert.strictEqual(session.clientId, 'some-client-id');
			});

			it('Should return the correct clientCode', () => {
				assert.strictEqual(session.clientCode, 'some-client-code');
			});

			it('Should return the correct profileId', () => {
				assert.strictEqual(session.profileId, 'some-profile-id');
			});

			it('Should return the correct userIsDev', () => {
				assert.strictEqual(session.userIsDev, true);
			});

			it('Should return the correct serviceName', () => {
				assert.strictEqual(session.serviceName, 'some-service');
			});

			it('Should return the correct isService', () => {
				assert.strictEqual(session.isService, true);
			});

			it('Should return the correct permissions', () => {
				assert.deepStrictEqual(session.permissions, ['service:namespace:method1', 'service:namespace:method2']);
			});

			it('Should return the correct locations', () => {
				assert.deepStrictEqual(session.locations, ['location-1', 'location-2']);
			});

			it('Should return the correct hasAccessToAllLocations', () => {
				assert.strictEqual(session.hasAccessToAllLocations, false);
			});
		});

		describe('Client getter', () => {

			it('Should throw if model client not found', async () => {

				await assert.rejects(() => session.client, {
					name: 'ApiSessionError',
					code: ApiSessionError.codes.INVALID_MODEL_CLIENT
				});
			});

			it('Should throw if model client rejects', async () => {

				loadModelClient();

				sandbox.stub(ClientModel.prototype, 'getBy')
					.rejects('Some model error');

				await assert.rejects(() => session.client, {
					name: 'ApiSessionError',
					code: ApiSessionError.codes.INTERNAL_ERROR
				});

				sandbox.assert.calledWithExactly(ClientModel.prototype.getBy, 'code', 'some-client-code', { limit: 1 });
			});

			it('Should throw if model client can\'t found the client', async () => {

				loadModelClient([]);

				await assert.rejects(() => session.client, {
					name: 'ApiSessionError',
					code: ApiSessionError.codes.CLIENT_NOT_FOUND
				});

				sandbox.assert.calledWithExactly(ClientModel.prototype.getBy, 'code', 'some-client-code', { limit: 1 });
			});

			it('Should return the injected client with a working getInstance', async () => {

				const baseClient = {
					id: 'the-client-id-123',
					code: 'some-client-code',
					otherData: 876
				};

				loadModelClient([baseClient]);

				const client = await session.client;

				sandbox.assert.match(client, {
					...baseClient,
					getInstance: sandbox.match.func
				});

				sandbox.assert.calledWithExactly(ClientModel.prototype.getBy, 'code', 'some-client-code', { limit: 1 });

				class Test {}

				const testInstance = client.getInstance(Test);

				assert.deepStrictEqual(testInstance.session, session);
			});

			it('Should return client without getting if APISession instanced with client object', async () => {

				loadModelClient();

				sandbox.stub(ClientModel.prototype, 'getBy');

				const offlineClient = {
					id: 'client-id-3',
					code: 'offline-client'
				};

				const offlineSession = new ApiSession({}, offlineClient);

				const client = await offlineSession.client;

				sandbox.assert.match(client, {
					...offlineClient,
					getInstance: sandbox.match.func
				});

				sandbox.assert.notCalled(ClientModel.prototype.getBy);

				class Test {}

				const testInstance = client.getInstance(Test);

				assert.deepStrictEqual(testInstance.session, offlineSession);
			});

		});

		describe('getSessionInstance', () => {

			it('Should return an instance with the session injected', () => {

				class Test {}

				const testInstance = session.getSessionInstance(Test);

				assert.deepStrictEqual(testInstance.session, session);
			});
		});

		describe('Client cache', () => {

			it('Should fetch the client from de DB only once', async () => {

				sandbox.useFakeTimers(Date.now() + (15 * 60 * 1000)); // Both requests will be issued "in 15 minutes"

				const baseClient = {
					id: 'the-client-id-123',
					code: 'some-client-code',
					otherData: 876
				};

				loadModelClient([baseClient]);

				sandbox.assert.match(await session.client, {
					...baseClient,
					getInstance: sandbox.match.func
				});

				sandbox.assert.match(await session.client, {
					...baseClient,
					getInstance: sandbox.match.func
				});

				sandbox.assert.calledOnceWithExactly(ClientModel.prototype.getBy, 'code', 'some-client-code', { limit: 1 });
			});

			it('Should fetch the client from de DB again after 10 minutes', async () => {

				const now = Date.now();

				sandbox.stub(Date, 'now')
					.onCall(0)
					.returns(now) // First requests will be issued "now"
					.onCall(1)
					.returns(now + (15 * 60 * 1000)) // First requests will be issued "in 15 minutes"
					.onCall(2)
					.returns(now + (20 * 60 * 1000)); // Second requests will be issued "in 20 minutes"

				const baseClient = {
					id: 'the-client-id-123',
					code: 'some-client-code',
					otherData: 876
				};

				loadModelClient([baseClient]);

				sandbox.assert.match(await session.client, {
					...baseClient,
					getInstance: sandbox.match.func
				});

				sandbox.assert.match(await session.client, {
					...baseClient,
					getInstance: sandbox.match.func
				});

				sandbox.assert.match(await session.client, {
					...baseClient,
					getInstance: sandbox.match.func
				});

				sandbox.assert.calledTwice(ClientModel.prototype.getBy);
				sandbox.assert.calledWithExactly(ClientModel.prototype.getBy, 'code', 'some-client-code', { limit: 1 });
			});
		});

		describe('Validate location', () => {

			it('Should return false when session has not access to all location and no locationId is passed', () => {
				assert.strictEqual(session.validateLocation(), false);
			});

			it('Should return false when session has not locations field', () => {

				const invalidSession = new ApiSession({
					userId: 'some-user-id',
					clientId: 'some-client-id',
					clientCode: 'some-client-code',
					profileId: 'some-profile-id',
					permissions: ['service:namespace:method1', 'service:namespace:method2'],
					hasAccessToAlllocations: false
				});

				assert.strictEqual(invalidSession.validateLocation('location-1'), false);
			});

			it('Should return false when session has not valid locations field', () => {

				const invalidSession = new ApiSession({
					userId: 'some-user-id',
					clientId: 'some-client-id',
					clientCode: 'some-client-code',
					profileId: 'some-profile-id',
					permissions: ['service:namespace:method1', 'service:namespace:method2'],
					locations: { 1: 'location-1', 2: 'location-2' },
					hasAccessToAllLocations: false
				});

				assert.strictEqual(invalidSession.validateLocation('location-1'), false);
			});

			it('Should return false when session has not valid locations field', () => {

				const invalidSession = new ApiSession({
					userId: 'some-user-id',
					clientId: 'some-client-id',
					clientCode: 'some-client-code',
					profileId: 'some-profile-id',
					permissions: ['service:namespace:method1', 'service:namespace:method2'],
					locations: { 1: 'location-1', 2: 'location-2' },
					hasAccessToAllLocations: false
				});

				assert.strictEqual(invalidSession.validateLocation('location-1'), false);
			});

			it('Should return false when session has an empty array of locations', () => {

				const invalidSession = new ApiSession({
					userId: 'some-user-id',
					clientId: 'some-client-id',
					clientCode: 'some-client-code',
					profileId: 'some-profile-id',
					permissions: ['service:namespace:method1', 'service:namespace:method2'],
					locations: [],
					hasAccessToAllLocations: false
				});

				assert.strictEqual(invalidSession.validateLocation('location-1'), false);
			});

			it('Should return true when session has access to that location', () => {
				assert.strictEqual(session.validateLocation('location-1'), true);
				assert.strictEqual(session.validateLocation('location-2'), true);
			});

			it('Should return false when session has no access to that location', () => {
				assert.strictEqual(session.validateLocation('location-0'), false);
				assert.strictEqual(session.validateLocation('location-3'), false);
			});

			it('Should return true when session has access to all locations', () => {

				const invalidSession = new ApiSession({
					userId: 'some-user-id',
					clientId: 'some-client-id',
					clientCode: 'some-client-code',
					profileId: 'some-profile-id',
					permissions: ['service:namespace:method1', 'service:namespace:method2'],
					locations: [],
					hasAccessToAllLocations: true
				});

				assert.strictEqual(invalidSession.validateLocation('location-1'), true);
			});
		});
	});
});
