'use strict';

const logger = require('lllog')();

const ApiSessionError = require('./api-session-error');
const ModelClient = require('./model-client');

const clients = {};

class ApiSession {

	constructor(authenticationData) {
		this.authenticationData = authenticationData || {};
	}

	/**
	 * Get the user ID associated to the session
	 *
	 * @return {string|undefined} The ID of the user or undefined in case there is no user
	 */
	get userId() {
		return this.authenticationData.userId;
	}

	/**
	 * Get the client ID associated to the session
	 *
	 * @return {string|undefined} The ID of the client or undefined in case there is no client
	 */
	get clientId() {
		return this.authenticationData.clientId;
	}

	/**
	 * Get the client code associated to the session
	 *
	 * @return {string|undefined} The code of the client or undefined in case there is no client
	 */
	get clientCode() {
		return this.authenticationData.clientCode;
	}

	/**
	 * Get the profile ID associated to the session
	 *
	 * @return {string|undefined} The ID of the profile or undefined in case there is no profile
	 */
	get profileId() {
		return this.authenticationData.profileId;
	}

	/**
	 * Get the permissions array associated to the session
	 *
	 * @return {array<string>|undefined} The permission keys or undefined in case there are no permissions associated
	 */
	get permissions() {
		return this.authenticationData.permissions;
	}

	/**
	 * Fetch the client data from your own DB
	 *
	 * @return {Promise} Resolves to the client object with the `getInstance()` method injected
	 * @throws {ApiSessionError} If an error occurs while fetching the client data
	 */
	get client() {

		if(!this.clientCode)
			return Promise.resolve();

		const cachedClient = this.getClientFromCache();
		if(cachedClient) {
			logger.debug(`Client ${this.clientCode} fetched from cache`);
			return Promise.resolve(cachedClient);
		}

		const modelClient = new ModelClient();

		return modelClient
			.getByField('clientCode', this.clientCode)
			.then(dbClients => dbClients && dbClients[0] && this.inject(dbClients[0]))
			.then(client => this.updateClientCache(client))
			.catch(e => {
				throw new ApiSessionError(e, ApiSessionError.codes.INTERNAL_ERROR);
			});
	}

	/**
	 * Gets the client data from local cache if it exists.
	 *
	 * @return {object|undefined} The client data or undefined if it isn't cached
	 */
	getClientFromCache() {
		const cachedClient = clients[this.clientCode];

		if(!cachedClient || (Date.now() >= cachedClient.expirationTime))
			return;

		return cachedClient.client;
	}

	/**
	 * Updates a client in the local cached
	 *
	 * @param {object} client The client data
	 * @return {object} The client received as argument
	 */
	updateClientCache(client) {

		logger.debug(`Client ${this.clientCode} saved in cache`);

		clients[this.clientCode] = {
			expirationTime: Date.now() + (10 * 60 * 1000), // 10 minutes cache
			client
		};

		return client;
	}

	/**
	 * Inject the client with methods to propagate this session
	 *
	 * @param {object} client The client data
	 * @param {object} The client data injected
	 */
	inject(client) {
		client.getInstance = TheClass => {
			const instance = new TheClass();
			instance.session = this;

			return instance;
		};

		return client;
	}

}

module.exports = ApiSession;