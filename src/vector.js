import { vec2 } from 'gl-matrix';
import { util } from './util';

export class Vector {
	constructor (x, y) {
		this['0'] = x;
		this['1'] = y;
	}

	turn (direction) {
		switch (direction) {
			case 'left':
				vec2.transformMat2(this, this, util.rotationMatrix(-90));
				break;
			case 'right':
				vec2.transformMat2(this, this, util.rotationMatrix(90));
				break;
			case 'back':
				vec2.transformMat2(this, this, util.rotationMatrix(180));
				break;
			default:
				console.log('invalid switch direction');
		}
	}
}
