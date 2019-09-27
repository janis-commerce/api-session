'use strict';

class ApiSessionError extends Error {

	static get codes() {

		return {
			INTERNAL_ERROR: 99
		};

	}

	constructor(err, code) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.name = 'ApiSessionError';

		if(err instanceof Error)
			this.previousError = err;
	}
}

module.exports = ApiSessionError;
