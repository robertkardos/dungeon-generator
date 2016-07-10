import * as _ from 'underscore';
import { vec2 } from 'gl-matrix';

// let canvas = {
// 	width  : window.innerWidth  - 20,
// 	height : window.innerHeight - 20
// };
let step = 10;
let util = {
	timestamp : function () {
		return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
	},
	canvas : document.getElementById('canvas').getContext('2d'),
	tileTypes : {
		0 : {                        // wall
			tile    : 'wall',
			isSolid : true,
			color   : '#41403d'
		},
		1 : {                        // road
			tile    : 'road',
			isSolid : false,
			color   : '#FFFFFF'
		},
		2 : {                        // room
			tile    : 'room',
			isSolid : false,
			color   : '#DFEFFF'
		},
		3 : {                        // door
			tile    : 'door',
			isSolid : false,
			color   : '#AFDFEF'
		},
		4 : {                        // waypoints
			tile    : 'waypoints',
			isSolid : false,
			color   : '#757575'
		}
	},
	degToRad : function (degrees) {
		return degrees * Math.PI / 180;
	},
	rotationMatrix : function (degrees) {
		return [
			Math.cos(this.degToRad(degrees)).toFixed(),
			Math.sin(this.degToRad(degrees)).toFixed(),      // should be -
			Math.sin(this.degToRad(degrees)).toFixed() * -1, // should be +
			Math.cos(this.degToRad(degrees)).toFixed()
		];
	},
	containsObject : function (list, object) {
		for (var i = 0; i < list.length; i++) {
			if (_.isEqual(list[i], object)) {
				return false;
			}
		}
		return true;
	},
	turn : function (vector, direction) {
		switch (direction) {
			case 'left':
				vec2.transformMat2(vector, vector, this.rotationMatrix(-90));
				break;
			case 'right':
				vec2.transformMat2(vector, vector, this.rotationMatrix(90));
				break;
			case 'back':
				vec2.transformMat2(vector, vector, this.rotationMatrix(180));
				break;
			default:
				console.log('invalid switch direction');
		}
	}
};

export { util };
export { step };
export { canvas };
