'use strict';

/**
 * @enum {number}
 * @private
 */
const ERROR_CODES = {
	INVALID_MODEL_CLIENT: 1,
	CLIENT_NOT_FOUND: 2,
	INTERNAL_ERROR: 99
};

module.exports = class ApiSessionError extends Error {

	static get codes() {
		return ERROR_CODES;
	}

	/**
	 * @param {string|Error} err
	 * @param {ERROR_CODES} code
	 */
	constructor(err, code) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.name = 'ApiSessionError';

		if(err instanceof Error)
			this.previousError = err;
	}
};
