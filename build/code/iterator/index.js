"use strict";

const parseToTree = require( "./parseToTree" );
const treeToCode = require( "./treeToCode" );

const rCode = /const\s+root\s+=[^\n]+/;
const template = require( "fs" ).readFileSync( `${__dirname}/template.js`, "utf8" );

module.exports = function( items ) {
	return template.replace( rCode, treeToCode( parseToTree( items ) ) );
};
