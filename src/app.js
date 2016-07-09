'use strict';

import * as _ from 'underscore';
import { Labyrinth } from './labyrinth';
import { util } from './util';

let labyrinthConfig = {
	width          : 20,
	height         : 20,
	// wallThickness  : 1, // default : 10
	size           : 5,
	// step           : 10,
	randomness     : 4,
	write          : false,
	ereaseDeadEnds : 0,
	rooms          : {
		roomAttempts   : 30,
		pRoomWidthMax  : 5,
		pRoomWidthMin  : 1,
		pRoomHeightMax : 5,
		pRoomHeightMin : 1
	}
};

let labyrinth = new Labyrinth(labyrinthConfig);

let c = document.getElementById('canvas');
let canvas = c.getContext('2d');

for (var x = 0; x < labyrinth.width; x++) {
	for (var y = 0; y < labyrinth.height; y++) {
		canvas.fillStyle = util.tileTypes[labyrinth.map[x][y]].color;
		canvas.fillRect(x * 10, y * 10, 10, 10);
	}
}
