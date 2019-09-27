'use strict';

const assert = require('assert');

const { ApiSessionError } = require('../lib');

describe('Api Session Error', () => {

	it('Should accept a message error and a code', () => {
		const error = new ApiSessionError('Some error', ApiSessionError.codes.INTERNAL_ERROR);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, ApiSessionError.codes.INTERNAL_ERROR);
		assert.strictEqual(error.name, 'ApiSessionError');
	});

	it('Should accept an error instance and a code', () => {

		const previousError = new Error('Some error');

		const error = new ApiSessionError(previousError, ApiSessionError.codes.INTERNAL_ERROR);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, ApiSessionError.codes.INTERNAL_ERROR);
		assert.strictEqual(error.name, 'ApiSessionError');
		assert.strictEqual(error.previousError, previousError);
	});
});
