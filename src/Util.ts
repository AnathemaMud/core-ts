'use strict';

/** @module Util */
/**
 * Check to see if a given object is iterable
 * @param {Object} obj
 * @return {boolean}
 */
export function isIterable(obj: Iterable<unknown>) {
	return obj && typeof obj[Symbol.iterator] === 'function';
}
