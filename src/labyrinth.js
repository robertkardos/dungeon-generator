'use strict';

import * as _ from 'underscore';
import { vec2 } from 'gl-matrix';

import { util } from './util';
import { Vector } from './vector';
import { canRoomFit, generateRoomShape, drawRoom, joinRooms } from './generation';

class Labyrinth {
	constructor (config) {
		let rooms = [];
		let map = this.init(config.width, config.height);

		this.generateFirstRoom(config, map, rooms);
		// this.checkForSpaces(config, map);
		this.generateRooms(config, map, rooms, 0);
		this.draw(config, map);

		if (config.write === true) {
			this.write(config, map);
		}
	}

	generateFirstRoom (config, map, rooms) {
		let roomConfig = config.rooms;

		let room = generateRoomShape(roomConfig);
		room.position = new Vector(
			1 + Math.round(Math.random() * (config.width - room.width - 2)),
			1 + Math.round(Math.random() * (config.height - room.height - 2))
		);
		room.value = 0;
		room.type = 'room';
		rooms.push(room);

		// drawRoom(config, map, room);
	}

	generateRooms (config, map, rooms, roomCount) {
		let possiblePositions = [];
		let baseRoom = rooms[roomCount];
		let newRoom = generateRoomShape(config.rooms);
		drawRoom(config, map, baseRoom, '#ffffff');

		let range = {
			x: {
				from: baseRoom.position[0] - newRoom.width - config.rooms.borderMax,
				to: baseRoom.position[0] + baseRoom.width + config.rooms.borderMax
			},
			y: {
				from: baseRoom.position[1] - newRoom.height - config.rooms.borderMax,
				to: baseRoom.position[1] + baseRoom.height + config.rooms.borderMax
			}
		};

		for (var i = range.x.from; i <= range.x.to; i++) {
			for (var j = range.y.from; j <= range.y.to; j++) {
				if (canRoomFit(new Vector(i, j), newRoom, map, config)) {
					possiblePositions.push(new Vector(i, j));
				}
			}
		}

		if (possiblePositions.length !== 0) {
			newRoom.position = _.sample(possiblePositions);
			newRoom.value = rooms.length;
			rooms.push(newRoom);
			// drawRoom(config, map, newRoom, '#bbcde9');
			roomCount = rooms.length - 1;

			joinRooms(config, map, baseRoom, newRoom);

			this.generateRooms(config, map, rooms, roomCount);
		} else {
			roomCount--;
			if (roomCount > -1) {
				this.generateRooms(config, map, rooms, roomCount);
			} else {
				// console.log('DONE')
			}
		}
	}

	init (width, height) {
		let map = [];
		for (let i = 0; i < height; i++) {
			map[i] = [];
			for (let j = 0; j < width; j++) {
				map[i][j] = {
					value: 0,
					type: 'wall',
					position: new Vector(i, j)
				};
			}
		}
		return map;
	};

	write (config, map) {
		for (let y = 0; y < config.height; y++) {
			console.log(map[y]);
		}
	};

	draw (config, map) {
		for (var x = 0; x < config.width; x++) {
			for (var y = 0; y < config.height; y++) {
				util.draw(new Vector(x, y), map, config.size);
				// util.write(new Vector(x, y), map, config.size, map[x][y].value);
			}
		}
	}
};
export { Labyrinth };
