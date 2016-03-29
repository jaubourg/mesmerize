"use strict";

const parseToFuncs = require( "./parseToFuncs" );
const funcsToCode = require( "./funcsToCode" );

const rCode = /const\s+root\s+=[^\n]+/;
const template = require( "fs" ).readFileSync( `${__dirname}/template.js`, "utf8" );

module.exports = function( items ) {
	return template.replace( rCode, funcsToCode( parseToFuncs( items ) ) );
};
