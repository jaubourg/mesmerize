"use strict";

// Controls two trees are the same
function same( map1, map2 ) {
	if ( !( map1 instanceof Map ) || !( map2 instanceof Map ) ) {
		return map1 === map2;
	}
	if ( map1.size !== map2.size ) {
		return false;
	}
	const key2 = map2.keys();
	for ( let key of map1.keys() ) {
		if ( key !== key2.next().value || !same( map1.get( key ), map2.get( key ) ) ) {
			return false;
		}
	}
	return true;
}

// Extract reused branches from the tree
function findSame( root ) {
	const bySize = new Map();
	const reused = new Set();
	reused.add( ( function inspect( map ) {
		if ( map instanceof Map ) {
			let others = bySize.get( map.size );
			if ( !others ) {
				bySize.set( map.size, ( others = [] ) );
			}
			for ( let other of others ) {
				if ( same( other, map ) ) {
					reused.add( other );
					return other;
				}
			}
			map.forEach( function( value, key ) {
				map.set( key, inspect( value ) );
			} );
			others.push( map );
		}
		return map;
	} )( root ) );
	return reused;
}

// Encode key
function encodeKey( key ) {
	key = key.toString( 16 );
	if ( key.length < 2 ) {
		key = `0${key}`;
	}
	return `0x${key}`;
}

// Cumulate tests
function chainTest( tree, next ) {
	if ( !tree.type && !tree.default && next.if && !next.type ) {
		tree.if += ` && ${next.if}`;
		tree.then = next.then;
		tree.default = next.default;
	} else {
		tree.then = next;
	}
	tree.temp = next.temp;
}

// Create an abstract code tree
function buildCodeTree( map, done, maps ) {
	let tree = done.get( map );
	if ( tree ) {
		tree = {
			func: `func_${tree.index}`
		};
	} else {
		tree = {};
		const entries = [];
		map.forEach( function( value, key ) {
			if ( key === true ) {
				tree.type = JSON.stringify( value );
			} else if ( key === null ) {
				tree.default = buildCodeTree( value, done, maps );
			} else {
				entries.push( [ encodeKey( key ), buildCodeTree( value, done, maps ) ] );
			}
		} );
		if ( entries.length > 1 ) {
			maps.push( entries );
			tree.if = `( temp = map_${maps.length}.get( yield ) )`;
			tree.then = {
				func: "temp"
			};
			tree.temp = true;
		} else if ( entries.length ) {
			const entry = entries[ 0 ];
			tree.if = `( yield ) === ${entry[ 0 ]}`;
			chainTest( tree, entry[ 1 ] );
		} else if ( tree.default ) {
			const tDefault = tree.default;
			delete tree.default;
			tree.if = "( yield ) !== null";
			chainTest( tree, tDefault );
		}
	}
	return tree;
}

function buildCodeTrees( reused ) {
	const done = new Map();
	const maps = [];
	let index = 1;
	reused.forEach( function( map ) {
		const tree = buildCodeTree( map, done, maps );
		tree.index = index++;
		done.set( map, tree );
	} );
	const funcs = [];
	done.forEach( function( func ) {
		delete func.index;
		funcs.push( func );
	} );
	return {
		maps: maps,
		funcs: funcs
	};
}

module.exports = function( map ) {
	return buildCodeTrees( findSame( map ) );
};
