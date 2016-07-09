'use strict';

import * as _ from 'underscore';
import { util } from './util';

// var directions = [
// 		{x :   0 , y : - 1}, // up
// 		{x :   1 , y :   0}, // right
// 		{x :   0 , y :   1}, // down
// 		{x : - 1 , y :   0}  // left
// 	];
class Labyrinth {
	constructor (config) {
		this.width     = config.width * 2 + 1;
		this.height    = config.height * 2 + 1;
		this.size      = config.size;
		this.step      = config.step;
		this.map       = [];
		this.rooms     = [];
		this.deadends  = [];
		this.waypoints = [];

		for (var i = 0; i < this.height; i++) {
			this.map[i] = [];
			for (var j = 0; j < this.width; j++) {
				this.map[i][j] = 0;
			}
		}
		this.generateRooms(config.rooms);
		this.generateLabyrinth({
			x : 1,
			y : 1
		}, config.randomness);
		this.generateDoors();
		this.ereaseDeadEnds(config.ereaseDeadEnds); // param : depth of dead end ereasing; if not given, erease all
		if (config.write === true) {
			this.write();
		}
	}
	write () {
		for (var y = 0; y < this.height; y++) {
			console.log(this.map[y]);
		}
	};

	generateRooms (config) {
		var room          = {},
			roomWidthMax  = config.pRoomWidthMax  || 10,
			roomWidthMin  = config.pRoomWidthMin  || 5,
			roomHeightMax = config.pRoomHeightMax || 10,
			roomHeightMin = config.pRoomHeightMin || 5;

		var checkRoomCollision = function (room) {
			if (this.rooms.length === 0) {
				return false;
			}
			for (var i = 0; i < this.rooms.length; i++) {
				if (room.x < this.rooms[i].x + this.rooms[i].width &&
					room.x + room.width > this.rooms[i].x &&
					room.y < this.rooms[i].y + this.rooms[i].height &&
					room.y + room.height > this.rooms[i].y) {
						return true;
					}
			}
			return false;
		};

		for (var i = 0; i < config.roomAttempts; i++) {
			room.width  = Math.round((Math.round(Math.random() * (roomWidthMax  - roomWidthMin))  + roomWidthMin) / 2) * 2 + 1;
			room.height = Math.round((Math.round(Math.random() * (roomHeightMax - roomHeightMin)) + roomHeightMin) / 2) * 2 + 1;
			room.x	  = Math.round((Math.round(Math.random() * (this.width - room.width - 6) + 3)) / 2) * 2 + 1;
			room.y	  = Math.round((Math.round(Math.random() * (this.height - room.height - 6) + 3)) / 2) * 2 + 1;
			// random generating a number in an interval, rounding it, divided by two and rounded so it's guaranteed even,
			// multiplied by two, and add 1 to make it odd but around the original size

			if (checkRoomCollision.call(this, room) === false) {
				this.rooms.push({
					width  : room.width,
					height : room.height,
					x	  : room.x,
					y	  : room.y
				});

				for (var x = room.x; x < room.x + room.width; x++) {
					for (var y = room.y; y < room.y + room.height; y++) {
						this.map[x][y] = 2;
					}
				}
			}
		}
	};
	generateLabyrinth (currentTile, randomFactor) {
		var roadStack		   = [],
			canPushMoreDeadEnds = true,
			possibleDirections,
			nextBlock,
			direction;

		var checkLabyrinthFill = function () {
			for (var y = 1; y < this.height - 1; y += 2) {
				for (var x = 1; x < this.width - 1; x += 2) {
					if (this.map[x][y] === 0) {
						return {
							x : x,
							y : y
						};
					}
				}
			}
			return false;
		};

		var floodFill = function (currentTile) {
			roadStack.push(currentTile);
			this.deadends.push(currentTile);
			this.map[currentTile.x][currentTile.y] = 1;

			while (roadStack.length > 0) {
				possibleDirections = [];
				this.map[currentTile.x][currentTile.y] = 1;

				var checkForBorders = [
					(currentTile.y > 2),
					(currentTile.x < this.width - 3),
					(currentTile.y < this.height - 3),
					(currentTile.x > 2)
				];

				var isGivenDirectionPossible = [
					true, true, true, true
				];

				var directionVector = [0, -1];
				for (var i = 0; i < 4; i++) {
					if (checkForBorders[i]) {
						var first = currentTile.x + directionVector[0] * 2;
						var second = currentTile.y + directionVector[1] * 2;
						isGivenDirectionPossible[i] = isGivenDirectionPossible[i] && util.tileTypes[this.map[first][second]].isSolid;
						if (isGivenDirectionPossible[i]) {
							possibleDirections.push({
								x : directionVector[0],
								y : directionVector[1]
							});
						}
					}
					util.turn(directionVector, 'right');
				}

				if (possibleDirections.length === 0) {
					nextBlock = roadStack.pop();
					if (canPushMoreDeadEnds === true) {
						this.deadends.push(currentTile);
						canPushMoreDeadEnds = false;
					}
				} else {
					roadStack.push(currentTile);

					var isPreviousDirectionPossible = util.containsObject(possibleDirections, direction);
					var isPreviousDirectionOverridden = Math.random() * 10 < randomFactor;

					if (isPreviousDirectionPossible || isPreviousDirectionOverridden) {
						direction = _.sample(possibleDirections);
					}
					nextBlock = {
						x : currentTile.x + direction.x * 2,
						y : currentTile.y + direction.y * 2
					};

					this.map[nextBlock.x - direction.x][nextBlock.y - direction.y] = 1;
					this.map[nextBlock.x][nextBlock.y] = 1;

					canPushMoreDeadEnds = true;
				}
				currentTile = nextBlock;
			}
		};
		do {
			floodFill.call(this, currentTile);
			currentTile = checkLabyrinthFill.call(this);
		} while (currentTile !== false);
	};
	generateDoors () {
		var direction	= [ 1,  0],
			checkOnLeft  = [ 0, -1],
			checkOnRight = [ 0,  1],
			position,
			roomWidthOrHeight = 'width';

		for (var i = 0; i < this.rooms.length; i++) {
			this.rooms[i].thinWalls = [];
			this.rooms[i].doors	 = [];

			position = [this.rooms[i].x, this.rooms[i].y];

			for (var d = 0; d < 4; d++) {
				if (
					(roomWidthOrHeight === 'height' && (position[0] > 1 && position[0] < this.width  - 3)) ||
					(roomWidthOrHeight === 'width'  && (position[1] > 1 && position[1] < this.height - 3))
				) {
					for (var j = 0; j < this.rooms[i][roomWidthOrHeight]; j++) {
						var checkThisBlock = [position[0] + 2 * checkOnLeft[0], position[1] + 2 * checkOnLeft[1]];
						if (!util.tileTypes[this.map[checkThisBlock[0]][checkThisBlock[1]]].isSolid) {
							this.rooms[i].thinWalls.push({
								x : position[0] + checkOnLeft[0],
								y : position[1] + checkOnLeft[1]
							});
						}
						position[0] = position[0] + direction[0];
						position[1] = position[1] + direction[1];
					}
				} else {
					var steps = (roomWidthOrHeight === 'height' ? this.rooms[i].height : this.rooms[i].width);
					position[0] = position[0] + direction[0] * steps;
					position[1] = position[1] + direction[1] * steps;
				}
				// step back a bit, because we moved trough the wall
				position[0] = position[0] - direction[0];
				position[1] = position[1] - direction[1];
				roomWidthOrHeight = (roomWidthOrHeight === 'width' ? 'height' : 'width');

				util.turn(direction,	'right');
				util.turn(checkOnLeft,  'right');
				util.turn(checkOnRight, 'right');
			}

			this.rooms[i].doors = _.sample(this.rooms[i].thinWalls, Math.round(Math.random() * 2) + 1);
			for (var j = 0; j < this.rooms[i].doors.length; j++) {
				this.map[this.rooms[i].doors[j].x][this.rooms[i].doors[j].y] = 3;
			}
		}
	};
	ereaseDeadEnds (depth) {
		var blockNextToPotentialDeadEnd,
			isCurrentReallyDeadEnd,
			newDeadEndCandidates,
			newDeadEndCandidate,
			deleteThemNow,
			isDoorFound,
			counter = 0;

		do {
			newDeadEndCandidates = [];
			deleteThemNow		= [];

			for (var i = 0; i < this.deadends.length; i++) {
				isDoorFound			= false;
				isCurrentReallyDeadEnd = 0;

				var direction = [0, 1];

				for (var j = 0; j < 4; j++) { // check if the block is actually a dead end: are there more than 2 path tiles in any direction?
					blockNextToPotentialDeadEnd = {
						x : this.deadends[i].x + direction[0],
						y : this.deadends[i].y + direction[1]
					};

					if (this.map[blockNextToPotentialDeadEnd.x][blockNextToPotentialDeadEnd.y] === 3) {
						isDoorFound = true;
					}
					if (this.map[blockNextToPotentialDeadEnd.x][blockNextToPotentialDeadEnd.y] === 1) {
						isCurrentReallyDeadEnd++;
						newDeadEndCandidate = {
							x : blockNextToPotentialDeadEnd.x,
							y : blockNextToPotentialDeadEnd.y
						};
					}
					util.turn(direction, 'right');
				}
				if (!isDoorFound && isCurrentReallyDeadEnd === 1) { // if there was more than 1 way from a dead end then it wasn't a dead end
					newDeadEndCandidates.push(newDeadEndCandidate);
					deleteThemNow.push({
						x : this.deadends[i].x,
						y : this.deadends[i].y
					});
				}
			}
			for (var k = 0; k < deleteThemNow.length; k++) {
				this.map[deleteThemNow[k].x][deleteThemNow[k].y] = 0;
			}
			this.deadends = newDeadEndCandidates;
			counter++;
		} while (depth > counter || (depth === undefined && newDeadEndCandidates.length > 0));
	};

};
export { Labyrinth };
