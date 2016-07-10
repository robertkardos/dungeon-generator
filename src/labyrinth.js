'use strict';

import * as _ from 'underscore';
import { vec2 } from 'gl-matrix';

import { util } from './util';
import { Vector } from './vector';

class Labyrinth {
	constructor (config) {
		this.width         = config.width * 2 + 1;
		this.height        = config.height * 2 + 1;
		this.size          = config.size;
		this.step          = config.step;
		this.roomWidthMax  = config.pRoomWidthMax  || 10;
		this.roomWidthMin  = config.pRoomWidthMin  || 5;
		this.roomHeightMax = config.pRoomHeightMax || 10;
		this.roomHeightMin = config.pRoomHeightMin || 5;
		this.map           = [];
		this.rooms         = [];
		this.deadEnds      = [];
		this.waypoints     = [];

		for (let i = 0; i < this.height; i++) {
			this.map[i] = [];
			for (let j = 0; j < this.width; j++) {
				this.map[i][j] = 0;
			}
		}
		this.generateRooms(config.rooms);
		this.generateLabyrinth(new Vector(1, 1), config.randomness);
		this.generateDoors();
		this.ereaseDeadEnds(config.ereaseDeadEnds); // param : depth of dead end ereasing; if not given, erease all
		if (config.write === true) {
			this.write();
		}
		this.draw();
	}

	write () {
		for (let y = 0; y < this.height; y++) {
			console.log(this.map[y]);
		}
	};

	draw () {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				util.canvas.fillStyle = util.tileTypes[this.map[x][y]].color;
				util.canvas.fillRect(x * 5, y * 5, 5, 5);
			}
		}
	}

	generateRooms (config) {
		let room = new Vector(0, 0);
		let roomWidthMax  = config.pRoomWidthMax  || 10;
		let roomWidthMin  = config.pRoomWidthMin  || 5;
		let roomHeightMax = config.pRoomHeightMax || 10;
		let roomHeightMin = config.pRoomHeightMin || 5;

		let checkRoomCollision = (room) => {
			if (this.rooms.length === 0) {
				return false;
			}
			for (let i = 0; i < this.rooms.length; i++) {
				if (room[0] < this.rooms[i][0] + this.rooms[i].width &&
					room[0] + room.width > this.rooms[i][0] &&
					room[1] < this.rooms[i][1] + this.rooms[i].height &&
					room[1] + room.height > this.rooms[i][1]
				) {
					return true;
				}
			}
			return false;
		};

		for (let i = 0; i < config.roomAttempts; i++) {
			room.width  = Math.round((Math.round(Math.random() * (this.roomWidthMax  - this.roomWidthMin))  + this.roomWidthMin) / 2) * 2 + 1;
			room.height = Math.round((Math.round(Math.random() * (this.roomHeightMax - this.roomHeightMin)) + this.roomHeightMin) / 2) * 2 + 1;
			room[0]     = Math.round((Math.round(Math.random() * (this.width - room.width - 6) + 3)) / 2) * 2 + 1;
			room[1]     = Math.round((Math.round(Math.random() * (this.height - room.height - 6) + 3)) / 2) * 2 + 1;
			// random generating a number in an interval, rounding it, divided by two and rounded so it's guaranteed even,
			// multiplied by two, and add 1 to make it odd but around the original size

			if (checkRoomCollision(room) === false) {
				this.rooms.push({
					width  : room.width,
					height : room.height,
					0      : room[0],
					1      : room[1]
				});

				for (let x = room[0]; x < room[0] + room.width; x++) {
					for (let y = room[1]; y < room[1] + room.height; y++) {
						this.map[x][y] = 2;
					}
				}
			}
		}
	};

	generateLabyrinth (currentTile, randomFactor) {
		let roadStack = [];
		let canPushMoreDeadEnds = true;
		let nextBlock;
		let previousDirection = new Vector();

		let checkLabyrinthFill = () => {
			for (let y = 1; y < this.height - 1; y += 2) {
				for (let x = 1; x < this.width - 1; x += 2) {
					if (this.map[x][y] === 0) {
						return new Vector(x, y);
					}
				}
			}
			return false;
		};

		let floodFill = (currentTile) => {
			roadStack.push(currentTile);
			this.deadEnds.push(currentTile);
			this.map[currentTile[0]][currentTile[1]] = 1;

			while (roadStack.length > 0) {
				let possibleDirections = [];
				this.map[currentTile[0]][currentTile[1]] = 1;
				// console.log('this');
				// console.log(this);
				let isGivenDirectionPossible = [
					(currentTile[0] <= this.width - 4),
					(currentTile[1] <= this.height - 4),
					(currentTile[0] >= 3),
					(currentTile[1] >= 3)
				];
				let direction = new Vector(1, 0);

				for (let i = 0; i < 4; i++) {
					if (isGivenDirectionPossible[i]) {
						let location = vec2.add(new Vector(), currentTile, vec2.scale(new Vector(), direction, 2));
						if (util.tileTypes[this.map[location[0]][location[1]]].isSolid) {
							possibleDirections.push(vec2.copy(new Vector(), direction));
						}
					}
					direction.turn('right');
				}

				if (possibleDirections.length === 0) {
					nextBlock = roadStack.pop();
					if (canPushMoreDeadEnds === true) {
						this.deadEnds.push(currentTile);
						canPushMoreDeadEnds = false;
					}
				} else {
					roadStack.push(currentTile);
					let isPreviousDirectionPossible = false;
					_.each(possibleDirections, (currentDirection) => {
						if (vec2.equals(currentDirection, previousDirection)) {
							isPreviousDirectionPossible = true;
						};
					});
					let isPreviousDirectionOverridden = Math.random() * 10 < randomFactor;

					if (isPreviousDirectionPossible && !isPreviousDirectionOverridden) {
						vec2.copy(direction, previousDirection);
					} else {
						direction = _.sample(possibleDirections);
						vec2.copy(previousDirection, direction);
					}
					// currentTile + direction * 2
					nextBlock = vec2.add(new Vector(), currentTile, vec2.scale(new Vector(), direction, 2));
					this.map[nextBlock[0] - direction[0]][nextBlock[1] - direction[1]] = 1;
					this.map[nextBlock[0]][nextBlock[1]] = 1;
					canPushMoreDeadEnds = true;
				}
				currentTile = nextBlock;
			}
		};

		do {
			floodFill(currentTile);
			currentTile = checkLabyrinthFill();
		} while (currentTile !== false);
	};

	generateDoors () {
		let direction    = new Vector(1,  0);
		let checkOnLeft  = new Vector(0, -1);
		let checkOnRight = new Vector(0,  1);
		let position;
		let roomWidthOrHeight = 'width';

		for (let i = 0; i < this.rooms.length; i++) {
			this.rooms[i].thinWalls = [];
			this.rooms[i].doors = [];

			position = new Vector(this.rooms[i][0], this.rooms[i][1]);

			for (let d = 0; d < 4; d++) {
				if (
					(roomWidthOrHeight === 'height' && (position[0] > 1 && position[0] < this.width  - 3)) ||
					(roomWidthOrHeight === 'width'  && (position[1] > 1 && position[1] < this.height - 3))
				) {
					for (let j = 0; j < this.rooms[i][roomWidthOrHeight]; j++) {
						let checkThisBlock = new Vector(position[0] + 2 * checkOnLeft[0], position[1] + 2 * checkOnLeft[1]);
						if (!util.tileTypes[this.map[checkThisBlock[0]][checkThisBlock[1]]].isSolid) {
							let thinWall = vec2.add(new Vector(), position, checkOnLeft);
							this.rooms[i].thinWalls.push(thinWall);
						}
						vec2.add(position, position, direction);
					}
				} else {
					let steps = (roomWidthOrHeight === 'height' ? this.rooms[i].height : this.rooms[i].width);
					let multipliedDirection = vec2.scale(new Vector(), steps);
					vec2.add(position, position, multipliedDirection);
				}
				// step back a bit, because we moved trough the wall
				vec2.subtract(position, position, direction);
				roomWidthOrHeight = (roomWidthOrHeight === 'width' ? 'height' : 'width');

				direction.turn('right');
				checkOnLeft.turn('right');
				checkOnRight.turn('right');
			}

			this.rooms[i].doors = _.sample(this.rooms[i].thinWalls, Math.round(Math.random() * 2) + 1);
			for (let j = 0; j < this.rooms[i].doors.length; j++) {
				this.map[this.rooms[i].doors[j][0]][this.rooms[i].doors[j][1]] = 3;
			}
		}
	};

	ereaseDeadEnds (depth) {
		let counter = 0;

		while (counter < depth || depth === undefined) {
			let newDeadEndCandidates = [];
			let deleteThemNow = [];
			for (let i = 0; i < this.deadEnds.length; i++) {
				let neighborsOfDeadEnd = 0;
				let direction = new Vector(1, 0);

				let newDeadEndCandidate = new Vector();
				for (let j = 0; j < 4; j++) {
					let currentNeighbor = vec2.add(new Vector(), this.deadEnds[i], direction);

					if (this.map[currentNeighbor[0]][currentNeighbor[1]] !== 0) {
						neighborsOfDeadEnd++;
						vec2.copy(newDeadEndCandidate, currentNeighbor);
					}
					util.turn(direction, 'right');
				}
				if (neighborsOfDeadEnd === 1) {

					newDeadEndCandidates.push(newDeadEndCandidate);
					deleteThemNow.push(this.deadEnds[i]);
				}
			}
			for (let k = 0; k < deleteThemNow.length; k++) {
				this.map[deleteThemNow[k][0]][deleteThemNow[k][1]] = 0;
			}
			this.deadEnds = newDeadEndCandidates;
			counter++;

			if (this.deadEnds.length === 0) {
				break;
			}
		};
	};

};
export { Labyrinth };
