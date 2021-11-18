'use strict';

const logger = require('lllog')();

const path = require('path');

const ApiSessionError = require('./api-session-error');

/**
 * @typedef Client
 * @property {string | undefined} id
 * @property {string} code
 */

module.exports = class ClientHandler {

	static get clientsCache() {

		if(!this._clientsCache)
			this._clientsCache = {};

		return this._clientsCache;
	}

	/**
	 * @param {string} clientCode
	 * @param {boolean} useClientCache
	 * @return {Promise<Client>}
	 */
	static async getByCode(clientCode, useClientCache) {

		const cachedClient = useClientCache && this.getClientFromCache(clientCode);
		if(cachedClient) {
			logger.debug(`Client ${clientCode} fetched from cache`);
			return cachedClient;
		}

		const modelClient = this.getInstance();

		try {

			const clientsFound = await modelClient.getBy('code', clientCode, { limit: 1 });

			if(clientsFound.length) {
				const [client] = clientsFound;
				this.updateClientCache(client);
				return client;
			}

		} catch(e) {
			throw new ApiSessionError(e, ApiSessionError.codes.INTERNAL_ERROR);
		}

		throw new ApiSessionError(`Client not found for code ${clientCode}`, ApiSessionError.codes.CLIENT_NOT_FOUND);
	}

	/**
	 * Gets the client data from local cache if it exists.
	 *
	 * @return {object|undefined} The client data or undefined if it isn't cached
	 */
	static getClientFromCache(clientCode) {

		const cachedClient = this.clientsCache[clientCode];

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
	static updateClientCache(client) {

		logger.debug(`Client ${client.code} saved in cache`);

		this.clientsCache[client.code] = {
			expirationTime: Date.now() + (10 * 60 * 1000), // 10 minutes cache
			client
		};
	}

	/**
     * Returns an instance model from the service.
     */
	static getInstance() {

		if(this._modelInstance)
			return this._modelInstance;

		const modelPath = this.getRelativePath();

		try {
			// eslint-disable-next-line global-require, import/no-dynamic-require
			const TheModelClass = require(modelPath);
			this._modelInstance = new TheModelClass();
			return this._modelInstance;
		} catch(e) {
			throw new ApiSessionError(`Invalid Model Client. Must be in ${modelPath}.`,
				ApiSessionError.codes.INVALID_MODEL_CLIENT);
		}
	}

	static getRelativePath() {
		return path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'client');
	}
};
