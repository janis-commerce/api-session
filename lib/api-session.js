'use strict';

const Client = require('./client');

class ApiSession {

	constructor(authenticationData, client) {
		this.authenticationData = authenticationData || {};
		this._client = client;
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
	 * Get if user is dev associated to the session
	 *
	 * @return {boolean}
	 */
	get userIsDev() {
		return !!this.authenticationData.userIsDev;
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
	 * Get the service name associated to the session
	 *
	 * @return {string|undefined} The service name or undefined in case there is no service
	 */
	get serviceName() {
		return this.authenticationData.serviceName;
	}


	/**
	 * Get if the session is associated to a service
	 *
	 * @return {boolean}
	 */
	get isService() {
		return !!this.authenticationData.serviceName;
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
	 * Get the locations array associated to the session
	 *
	 * @return {array<string>|undefined} The locations or undefined in case there are no locations associated
	 */
	get locations() {
		return this.authenticationData.locations;
	}

	/**
	 * Get the if has Access To All locations associated to the session
	 *
	 * @return {boolean|undefined} The hasAccessToAllLocations field or undefined in case there are no hasAccessToAllLocations associated
	 */
	get hasAccessToAllLocations() {
		return this.authenticationData.hasAccessToAllLocations;
	}

	/**
	 * Fetch the client data from your own DB
	 *
	 * @return {Promise} Resolves to the client object with the `getInstance()` method injected
	 * @throws {ApiSessionError} If an error occurs while fetching the client data
	 */
	get client() {

		if(this._client)
			return Promise.resolve(this.inject(this._client));

		if(!this.clientCode)
			return Promise.resolve();

		return Client
			.getByCode(this.clientCode)
			.then(client => client && this.inject(client));
	}

	/**
	 * Gets an instance injected with the session
	 *
	 * @param {Function} TheClass The class
	 * @return {TheClass} The instance.
	 */
	getSessionInstance(TheClass) {
		const instance = new TheClass();
		instance.session = this;

		return instance;
	}

	/**
	 * Inject the client with methods to propagate this session
	 *
	 * @param {object} client The client data
	 * @param {object} The client data injected
	 */
	inject(client) {
		client.getInstance = this.getSessionInstance.bind(this);

		return client;
	}

	/**
	 * Validate if the session has access to the location
	 *
	 * @param {string} locationId Location Id
	 * @returns {Boolean}
	 */
	validateLocation(locationId) {
		return !!this.hasAccessToAllLocations || (!!locationId && Array.isArray(this.locations) && this.locations.includes(locationId));
	}
}

module.exports = ApiSession;
