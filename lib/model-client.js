'use strict';

const Model = require('@janiscommerce/model');
const Settings = require('@janiscommerce/settings');

class ModelClient extends Model {

	static get settings() {
		return Settings.get('clients') || {};
	}

	get databaseKey() {
		return this.constructor.settings.databaseKey || '_default';
	}

	static get table() {
		return this.settings.table || 'clients';
	}

	static get fields() {
		return {
			name: true,
			storename: true
		};
	}

	async getByField(field, value) {

		if(!field || !value)
			return;

		return this.get({
			filters: { [field]: value },
			limit: 1
		});
	}

}

module.exports = ModelClient;
