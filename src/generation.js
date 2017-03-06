import * as _ from 'underscore';
import { vec2 } from 'gl-matrix';

import { util } from './util';
import { Vector } from './vector';

let canRoomFit = function (position, room, map, config) {
	let checkPosition = new Vector(room.width + position[0], room.height + position[1])

	for (var y = 0; y < room.height + config.rooms.borderMin * 2; y++) {
		for (var x = 0; x < room.width + config.rooms.borderMin * 2; x++) {
			let color = '#';
			let characters = '0123456789abcdef';
			for (var j = 0; j < 6; j++) {
				color += (_.sample(characters));
			}

			let checkPosition = new Vector(x + position[0] - config.rooms.borderMin, y + position[1] - config.rooms.borderMin)
			if (
				!(
					checkPosition[0] >= 0 &&
					checkPosition[0] < config.width &&
					checkPosition[1] >= 0 &&
					checkPosition[1] < config.height &&
					map[checkPosition[0]][checkPosition[1]].value === 0 &&
					map[checkPosition[0]][checkPosition[1]].type !== 'room'
				)
			) {
				return false;
			}
		}
	}
	return true;
}

let generateRoomShape = function (roomConfig) {
	let room = {
		width  : _.random(roomConfig.roomWidthMin, roomConfig.roomWidthMax),
		height : _.random(roomConfig.roomHeightMin, roomConfig.roomHeightMax)
	}
	return room;
}

let drawRoom = function (config, map, room, color = util.randomColor()) {
	for (let y = room.position[1]; y < room.position[1] + room.height; y++) {
		for (let x = room.position[0]; x < room.position[0] + room.width; x++) {
			map[x][y].value = room.value;
			map[x][y].type = 'room';
			// util.draw(new Vector(x, y), map, config.size, color);
		}
	}

	util.drawRect(room, config.size);
}

let reconstruct = function (map, config, current) {
	let path = [];
	let counter = 0;
	while (counter < 5000 && current) {
		path.push(current.position);
		current = current.previous;
		counter++;
	};
	_.each(path, (pathNode) => {
		if (map[pathNode[0]][pathNode[1]].type !== 'room') {
			map[pathNode[0]][pathNode[1]].value = 1;
			map[pathNode[0]][pathNode[1]].type = 'road';
		}
		// util.draw(pathNode, map, config.size, '#bae2ff');
	});
};

let joinRooms = function (config, map, room1, room2) {
	let pathMap = [];
	_.map(map, (column) => {
		pathMap.push(_.map(column, (row) => {
			return _.clone(row);
		}));
	});

	let joinPoint1 = new Vector(
		_.random(room1.position[0], room1.position[0] + room1.width - 1),
		_.random(room1.position[1], room1.position[1] + room1.height - 1)
	);

	let joinPoint2 = new Vector(
		_.random(room2.position[0], room2.position[0] + room2.width - 1),
		_.random(room2.position[1], room2.position[1] + room2.height - 1)
	);

	let start = pathMap[joinPoint1[0]][joinPoint1[1]];
	start.g = 0;
	start.h = (Math.abs(joinPoint1[0] - joinPoint2[0]) + Math.abs(joinPoint1[0] - joinPoint2[0]));
	start.f = 0;
	start.isStart = true;
	let end = pathMap[joinPoint2[0]][joinPoint2[1]];

	let openSet = [start];
	let closedSet = [];

	while (openSet.length !== 0) {
		// current = node with the lowest f value
		let current = _.first(_.sortBy(_.flatten(openSet), (node) => {
			return node.f;
		}));

		// the current is the end node so the path has been found
		if (
			vec2.equals(current.position, end.position)
			|| current.type === 'room' && current.value === end.value
		) {
			reconstruct(map, config, current);
			return;
		}

		// remove current from openSet
		openSet = _.filter(openSet, (node) => !vec2.equals(current.position, node.position));
		closedSet.push(current);

		let neighbors = [];
		let direction = new Vector(0, 1);
		// util.draw(current.position, pathMap, config.size, '#527086');
		for (var i = 0; i < 4; i++) {
			let newPosition = vec2.add(new Vector(), current.position, direction);
			if (
				(newPosition[0] >= 0 && newPosition[0] < config.width) &&
				(newPosition[1] >= 0 && newPosition[1] < config.height) &&
				(
					pathMap[newPosition[0]][newPosition[1]].value === room1.value
					|| pathMap[newPosition[0]][newPosition[1]].value === room2.value
					|| pathMap[newPosition[0]][newPosition[1]].value === 0
				)
			) {
				let newNeighbor = pathMap[newPosition[0]][newPosition[1]];
				newNeighbor.g = current.g + 1;
				newNeighbor.h = Math.abs(newNeighbor.position[0] - joinPoint2[0]) + Math.abs(newNeighbor.position[1] - joinPoint2[1]);
				// newNeighbor.h = vec2.distance(newNeighbor.position, joinPoint2) * 1.1;
				neighbors.push(newNeighbor);
			}
			direction.turn('right');
		}
		_.each(neighbors, (neighbor) => {
			// the neighbor is in closedSet so it has already been evaluated
			if (_.find(closedSet, (node) => vec2.equals(neighbor.position, node.position))) {
				return;
			}

			let tempG = current.g + 1;

			// if neighbor is not in openset, so it's a new node
			if (!_.find(openSet, (node) => vec2.equals(neighbor.position, node.position))) {
				openSet.push(neighbor);
			} else if (tempG >= neighbor.g) {
				return;
			}
			neighbor.previous = current;
			neighbor.g = tempG;
			neighbor.f = neighbor.g + neighbor.h;
		});
	}
};




let possibleDoorOnRoom = function (room) {
	let roomPossibleDoors = [];
	for (var y = room.position[1]; y < room.position[1] + room.height; y++) {
		for (var x = room.position[0]; x < room.position[0] + room.width; x++) {
			if (
				!(y > room.position[1] && y < room.position[1] + room.height - 1) ||
				!(x > room.position[0] && x < room.position[0] + room.width - 1)
			) {
				room2PossibleDoors.push(new Vector(x, y));
				// only the border
			}
		}
	}
	let joinPoint2 = _.sample(room2PossibleDoors);
	return roomPossibleDoors;
}



// let checkForSpacesAroundEdges = function (config, map) {
// 	let room                 = rooms[rooms.length - 1];
// 	let freeSpacesOnTheSides = [];
// 	let position             = room.position;
// 	let direction            = new Vector(1, 0);
// 	let checkDirection       = new Vector(0, -2);
//
// 	for (var d = 1; d <= 4; d++) { // for all 4 directions
// 		let lengthOfRoomsSide;
// 		if (d % 2 === 0) {
// 			lengthOfRoomsSide = room.height;
// 		} else {
// 			lengthOfRoomsSide = room.width;
// 		}
// 		// flip-flopping between going to the max width to height of the room
//
// 		for (var i = 0; i < lengthOfRoomsSide; i++) {
// 			let colorItPosition = new Vector();
// 			colorItPosition = vec2.add(new Vector(), position, checkDirection);
//
// 			if (
// 				colorItPosition[0] >= 0 &&
// 				colorItPosition[0] < config.width &&
// 				colorItPosition[1] >= 0 &&
// 				colorItPosition[1] < config.height
// 			) {
// 				// win
// 				freeSpacesOnTheSides.push(colorItPosition);
// 				util.draw(colorItPosition, map, config.size, '#ffaa99');
// 			} else {
// 				// fail
// 			}
//
// 			if (i < lengthOfRoomsSide - 1) {
// 				position = vec2.add(new Vector(), position, direction);
// 			}
// 		}
//
// 		checkDirection.turn('right');
// 		direction.turn('right');
// 	}
// }

export { canRoomFit, generateRoomShape, drawRoom, joinRooms };
