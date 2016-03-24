"use strict";

const parseToTree = require( "./parseToTree" );
const treeToCode = require( "./treeToCode" );

module.exports = function( branches ) {
	return treeToCode( parseToTree( branches ) );
};
