"use strict";

const root = null;

module.exports = function( callback ) {
	const iterator = root( callback );
	iterator.next();
	return iterator;
};
