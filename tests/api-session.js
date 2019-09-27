'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { ApiSession, ApiSessionError } = require('../lib');
const ModelClient = require('./../lib/model-client');

describe('Api Session', () => {

	afterEach(() => {
		sinon.restore();
	});

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
		});
	});

	context('User related authentication data', () => {

		const session = new ApiSession({
			userId: 'some-user-id',
			clientId: 'some-client-id',
			clientCode: 'some-client-code',
			profileId: 'some-profile-id',
			permissions: ['service:namespace:method1', 'service:namespace:method2']
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

			it('Should return the correct permissions', () => {
				assert.deepStrictEqual(session.permissions, ['service:namespace:method1', 'service:namespace:method2']);
			});

			it('Should throw if client can\'t be fetched', async () => {

				sinon.stub(ModelClient.prototype, 'getByField')
					.rejects('Some model error');

				await assert.rejects(() => session.client, ApiSessionError);
			});

			it('Should return the injected client', async () => {

				const clientMock = {
					id: 'some-client-id',
					otherData: 'foo'
				};

				sinon.stub(ModelClient.prototype, 'getByField')
					.resolves([{ ...clientMock }]);

				sinon.assert.match(await session.client, {
					id: 'some-client-id',
					otherData: 'foo',
					getInstance: sinon.match.func
				});

				sinon.assert.calledOnce(ModelClient.prototype.getByField);
				sinon.assert.calledWithExactly(ModelClient.prototype.getByField, 'code', 'some-client-code');
			});

			it('Should inject the client with a working getInstance', async () => {

				const clientMock = {
					id: 'some-client-id',
					otherData: 'foo'
				};

				sinon.stub(ModelClient.prototype, 'getByField')
					.resolves([{ ...clientMock }]);

				const client = await session.client;

				sinon.assert.match(client, {
					id: 'some-client-id',
					otherData: 'foo',
					getInstance: sinon.match.func
				});

				class Test {}

				const testInstance = client.getInstance(Test);

				assert.strictEqual(testInstance.session, session);
			});
		});

		describe('Client cache', () => {

			it('Should fetch the client from de DB only once', async () => {

				const now = Date.now();

				sinon.stub(Date, 'now')
					.returns(now + (15 * 60 * 1000)); // Both requests will be issued "in 15 minutes"

				const clientMock = {
					id: 'some-client-id',
					otherData: 'foo'
				};

				sinon.stub(ModelClient.prototype, 'getByField')
					.resolves([{ ...clientMock }]);

				sinon.assert.match(await session.client, {
					id: 'some-client-id',
					otherData: 'foo',
					getInstance: sinon.match.func
				});

				sinon.assert.match(await session.client, {
					id: 'some-client-id',
					otherData: 'foo',
					getInstance: sinon.match.func
				});

				sinon.assert.calledOnce(ModelClient.prototype.getByField);
				sinon.assert.calledWithExactly(ModelClient.prototype.getByField, 'code', 'some-client-code');
			});

			it('Should fetch the client from de DB again after 10 minutes', async () => {

				const now = Date.now();

				sinon.stub(Date, 'now')
					.onCall(0)
					.returns(now + (30 * 60 * 1000)) // First requests will be issued "in 30 minutes"
					.onCall(1)
					.returns(now + (30 * 60 * 1000)) // First requests will be issued "in 30 minutes"
					.onCall(2)
					.returns(now + (45 * 60 * 1000)) // Second requests will be issued "in 45 minutes"
					.onCall(3)
					.returns(now + (45 * 60 * 1000)); // Second requests will be issued "in 45 minutes"

				const clientMock = {
					id: 'some-client-id',
					otherData: 'foo'
				};

				sinon.stub(ModelClient.prototype, 'getByField')
					.resolves([{ ...clientMock }]);

				sinon.assert.match(await session.client, {
					id: 'some-client-id',
					otherData: 'foo',
					getInstance: sinon.match.func
				});

				sinon.assert.match(await session.client, {
					id: 'some-client-id',
					otherData: 'foo',
					getInstance: sinon.match.func
				});

				sinon.assert.calledTwice(ModelClient.prototype.getByField);
				sinon.assert.calledWithExactly(ModelClient.prototype.getByField, 'code', 'some-client-code');
			});
		});
	});

});
