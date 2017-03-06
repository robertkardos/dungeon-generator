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
		'wall' : {                   // wall
			tile    : 'wall',
			isSolid : true,
			color   : '#fdf6e3'
		},
		'road' : {                   // road
			tile    : 'road',
			isSolid : false,
			color   : '#2aa198'
		},
		'room' : {                   // room
			tile    : 'room',
			isSolid : false,
			color   : '#002b36'
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
	},
	draw: function (position, map, size, color) {
		// console.log(map[position[0]][position[1]].value)
		this.canvas.fillStyle = color || this.tileTypes[map[position[0]][position[1]].type].color;

		this.canvas.beginPath();
		this.canvas.lineWidth='1';
		this.canvas.strokeStyle='rgba(60, 60, 60, 0.55)';
		this.canvas.rect(position[0] * size, position[1] * size, size, size);
		this.canvas.stroke();
		this.canvas.fillRect(position[0] * size, position[1] * size, size, size);
	},
	write: function (position, map, size, text) {
		this.canvas.font = '12px Arial';
		this.canvas.fillStyle = 'black';
		this.canvas.strokeText(text, position[0] * size, (position[1] + 1) * size);
	},
	drawRect: function (room, size) {
		this.canvas.beginPath();
		this.canvas.strokeStyle='rgba(60, 60, 60, 0.55)';
		this.canvas.rect(room.position[0] * size, room.position[1] * size, room.width * size, room.height * size);
		this.canvas.stroke();
	},
	randomColor: function () {
		let color = '#';
		let characters = '0123456789abcdef';
		for (var j = 0; j < 6; j++) {
			color += (_.sample(characters));
		}

		return color;
	}
};

export { util };
export { step };
export { canvas };
