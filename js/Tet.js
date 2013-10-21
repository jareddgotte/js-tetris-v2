// JSDoc Wiki: http://en.wikipedia.org/wiki/JSDoc
// jsdoc-toolkit references: http://code.google.com/p/jsdoc-toolkit/wiki/TagReference
// JS Data Types: http://www.w3schools.com/js/js_datatypes.asp
// JS Try Catch Throw Errors Tut: http://www.w3schools.com/js/js_errors.asp

/* Nomenclature:
 *
 * user:        Person playing the game.
 * Tet:         Short for Tetrimino (http://en.wikipedia.org/wiki/Tetrimino), or the name of our main class.  I will try to disambiguate within the comments when necessary.
 * living Tet:  Tet in free fall controlled by user.
 * landed Tet:  Tet that has landed and is no longer in control by user.
 */

// Unfortunately needed to clone arrays of arrays
Object.prototype.clone = function() { // http://my.opera.com/GreyWyvern/blog/show.dml/1725165
	var newObj = (this instanceof Array) ? [] : {};
	for (i in this) {
		if (i == 'clone') continue;
		if (this[i] && typeof this[i] == "object") {
			newObj[i] = this[i].clone();
		} else newObj[i] = this[i]
	} return newObj;
}

/**
 * This function creates a Tet class intended to be instantiated by "new Tet()".
 * However, upon completing a row in our Tetris game, we will want to remove the blocks in that row.  In the case that our Tet becomes divided during the row removal, we will want to split the whole Tet into multiple Tet fragments which is when we will use "new Tet(-1)", then set its properties manually.
 *
 * @author Jared Gotte
 * @class Represents a Tet, both living and landed.
 * @param {Number} [type] Shape of Tet desired, determined randomly if undefined.
 * @property {Number} type Initially only used to determined its shape upon our class being constructed.  If in range [0..6] (number of Tets), set its properties appropriately.  If -1, we will create a Tet with empty properties because we're going to set its topLeft, shape and perimeter manually.
 * @property {Object} topLeft This is the (row, column) position the Tet is in with respect to the game board (16 rows by 10 columns); (0, 0) being the most top left position.
 * @property {Number} topLeft.row Row position of Tet on board.
 * @property {Number} topLeft.col Column position of Tet on board.
 * @property {Array[Array[Number]]} shape Shape of Tet, e.g. _shape = [[1,1,1,1]] is horizontal I Tetrimino where [[1],[1],[1],[1]] is vertical I Tet.  Number in range [1..7] determines color (found from tetColor() in index.php). Number of 0 indicates empty space.
 * @property {Array[Array[Number]]} perimeter Perimeter of Tet, e.g. _perimeter = [[0,0],[0,1],[4,1],[4,0]] is horizontal I Tet perimeter where [[0,0],[0,4],[1,4],[1,0]] is vertical I Tet.  Imagine Tetriminos being expressed as 4 "blocks," each block's side would be _s pixels in magnitude, where _s is the variable block_s defined in index.php.  Therefore, we can determine its perimeter by taking the "(x, y) coordinates" in each "row" of _perimeter, and multiplying each x and y value by _s.
 */
function Tet (type) {
	//console.log(type);
	if (type >= -1 && type < 7) this.type = type;
	else this.type = parseInt(Math.floor(Math.random()*7));
	this.rotation = 0;
	if (type > -1 || type == undefined) {
		this.topLeft = { row: 0, col: 4 };
		this.shape = this.getShapeMatrix();
		this.perimeter = this.getPeriMatrix();
		//console.log(this.perimeter);
	} else { this.topLeft = {}; this.shape = []; this.perimeter = []; }
}
/**
 * This function takes in a Tet type and rotation then outputs its shape matrix.
 * This function is only needed on a live Tet.  I.e. if a Tet is already placed on the landed array, this function will not be used.
 *
 * @author Jared Gotte
 * @param {Number} type Type of shape being used, naturally determined randomly.
 * @param {Number} rotation Rotation of shape, determined by user input.
 * @returns {Array[Array[Number]]} Number matrix of shape.  If type is unexpected, return empty array.
 */
Tet.prototype.getShapeMatrix = function () {
	// Shapes from http://en.wikipedia.org/wiki/Tetris#Colors_of_Tetriminos
	// Note that the numbers in these arrays denote their eventual color
	var matrixMatrix = [
		[ [[1,1,1,1]], [[1],[1],[1],[1]] ], // I
		[ [[2,2,2],[0,0,2]], [[0,2],[0,2],[2,2]], [[2    ],[2,2,2]], [[2,2],[2  ],[2  ]] ], // J
		[ [[3,3,3],[3    ]], [[3,3],[0,3],[0,3]], [[0,0,3],[3,3,3]], [[3  ],[3  ],[3,3]] ], // L
		[ [[4,4],[4,4]] ], // O
		[ [[0,5,5],[5,5  ]], [[5  ],[5,5],[0,5]] ], // S
		[ [[6,6,6],[0,6  ]], [[0,6],[6,6],[0,6]], [[0,6  ],[6,6,6]], [[6  ],[6,6],[6  ]] ], // T
		[ [[7,7  ],[0,7,7]], [[0,7],[7,7],[7  ]] ], // Z
	], m = matrixMatrix[this.type];
	switch (m.length) {
		case 1:
			return m[0];
		case 2:
			return m[this.rotation % 2];
		case 4:
			return m[this.rotation];
		default:
			//console.log('unexpected array length in function ' + arguments.callee.toString().substr(9, arguments.callee.toString().indexOf('(') - 9));
			return [];
	}
}
// This function is used any time a living/landed Tet's shape is created/altered
// Upon breaking up a tet, make sure these conditions are met on its new shape:
// 1) Remove trailing zeros from each row, e.g. [1,0] becomes [1]
// 2) If new shape is one row, remove leading zeros, e.g. [0,1] becomes [1]
Tet.prototype.getPeriMatrix = function () {
	var periMatrix = [
		[ [[1]],               [[0,0],[0,1],[1,1],[1,0]] ], // fragments
		[ [[1,1]],             [[0,0],[0,1],[2,1],[2,0]] ],
		[ [[1],[1]],           [[0,0],[0,2],[1,2],[1,0]] ],
		[ [[1,1,1]],           [[0,0],[0,1],[3,1],[3,0]] ],
		[ [[1],[1],[1]],       [[0,0],[0,3],[1,3],[1,0]] ],
		[ [[1,1],[0,1]],       [[0,0],[0,1],[1,1],[1,2],[2,2],[2,0]] ],
		[ [[0,1],[1,1]],       [[1,0],[1,1],[0,1],[0,2],[2,2],[2,0]] ],
		[ [[1  ],[1,1]],       [[0,0],[0,2],[2,2],[2,1],[1,1],[1,0]] ],
		[ [[1,1],[1  ]],       [[0,0],[0,2],[1,2],[1,1],[2,1],[2,0]] ],
		[ [[1,1,1,1]],         [[0,0],[0,1],[4,1],[4,0]] ], // I
		[ [[1],[1],[1],[1]],   [[0,0],[0,4],[1,4],[1,0]] ],
		[ [[1,1,1],[0,0,1]],   [[0,0],[0,1],[2,1],[2,2],[3,2],[3,0]] ], // J
		[ [[0,1],[0,1],[1,1]], [[1,0],[1,2],[0,2],[0,3],[2,3],[2,0]] ],
		[ [[1    ],[1,1,1]],   [[0,0],[0,2],[3,2],[3,1],[1,1],[0,1]] ],
		[ [[1,1],[1  ],[1  ]], [[0,0],[0,3],[1,3],[1,1],[2,1],[2,0]] ],
		[ [[1,1,1],[1    ]],   [[0,0],[0,2],[1,2],[1,1],[3,1],[3,0]] ], // L
		[ [[1,1],[0,1],[0,1]], [[0,0],[0,1],[1,1],[1,3],[2,3],[2,0]] ],
		[ [[0,0,1],[1,1,1]],   [[2,0],[2,1],[0,1],[0,2],[3,2],[3,0]] ],
		[ [[1  ],[1  ],[1,1]], [[0,0],[0,3],[2,3],[2,2],[1,2],[1,0]] ],
		[ [[1,1],[1,1]],       [[0,0],[0,2],[2,2],[2,0]] ], // O
		[ [[0,1,1],[1,1  ]],   [[1,0],[1,1],[0,1],[0,2],[2,2],[2,1],[3,1],[3,0]] ], // S
		[ [[1  ],[1,1],[0,1]], [[0,0],[0,2],[1,2],[1,3],[2,3],[2,1],[1,1],[1,0]] ],
		[ [[1,1,1],[0,1  ]],   [[0,0],[0,1],[1,1],[1,2],[2,2],[2,1],[3,1],[3,0]] ], // T
		[ [[0,1],[1,1],[0,1]], [[1,0],[1,1],[0,1],[0,2],[1,2],[1,3],[2,3],[2,0]] ],
		[ [[0,1  ],[1,1,1]],   [[1,0],[1,1],[0,1],[0,2],[3,2],[3,1],[2,1],[2,0]] ],
		[ [[1  ],[1,1],[1  ]], [[0,0],[0,3],[1,3],[1,2],[2,2],[2,1],[1,1],[1,0]] ],
		[ [[1,1  ],[0,1,1]],   [[0,0],[0,1],[1,1],[1,2],[3,2],[3,1],[2,1],[2,0]] ], // Z
		[ [[0,1],[1,1],[1  ]], [[1,0],[1,1],[0,1],[0,3],[1,3],[1,2],[2,2],[2,0]] ]
	], nShape = this.shape.clone(), checkNextShape;
	// Normalize our shape so that every 
	for (var row = 0; row < nShape.length; row++) {
		for (var col = 0; col < nShape[row].length; col++) {
			if (nShape[row][col] > 0) nShape[row][col] = 1;
		}
	}
	for (var pRow = 0; pRow < periMatrix.length; pRow++) {
		checkNextShape = false;
		for (var row = 0; row < nShape.length; row++) {
			if (nShape.length != periMatrix[pRow][0].length) {
				checkNextShape = true;
				break;
			}
			if (checkNextShape) break;
			for (var col = 0; col < nShape[row].length; col++) {
				if (nShape[row].length != periMatrix[pRow][0][row].length) {
					checkNextShape = true;
					break;
				}
				if (nShape[row][col] == periMatrix[pRow][0][row][col]) {
					continue;
				}
				checkNextShape = true;
				break;
			}
		}
		if (!checkNextShape) {
			// if it gets to this point, we found our point array
			//console.log('found perimeter ' + pRow);
			return periMatrix[pRow][1];
		}
	}
	console.log(nShape);
	return [];
}
Tet.prototype.changeShape = function (shape) {
	this.type = -1;
	this.shape = shape;
	this.perimeter = this.getPeriMatrix(shape);
}
Tet.prototype.rotate = function () { // by default, always clockwise
	//console.log('rotating');
	var potRot;
	if (this.rotation >= 3) potRot = 0;
	else potRot = this.rotation + 1;
	var potShape = this.getShapeMatrix(this.type, potRot);
	// check for potential collisions
	for (var row = 0; row < potShape.length; row++) {
		for (var col = 0; col < potShape[row].length; col++) {
			if (potShape[row][col] != 0) {
				if (col + this.topLeft.col < 0) {
					//this block would be to the left of the playing field
					//console.log('left beyond playing field');
					return false;
				}
				if (col + this.topLeft.col >= landed[0].length) {
					//this block would be to the right of the playing field
					//console.log('right beyond playing field');
					return false;
				}
				if (row + this.topLeft.row >= landed.length) {
					//this block would be below the playing field
					//console.log('below playing field');
					return false;
				}
				if (landed[row + this.topLeft.row][col + this.topLeft.col] != 0) {
					//the space is taken
					//console.log('rotate: space is taken');
					return false;
				}
			}
		}
	}
	this.shape = potShape;
	this.rotation = potRot;
	return true;
}
Tet.prototype.checkBotCollision = function (potentialTopLeft) {
	for (var row = 0; row < this.shape.length; row++) {
		for (var col = 0; col < this.shape[row].length; col++) {
			if (this.shape[row][col] != 0) {
				if (row + potentialTopLeft.row >= landed.length) {
					//this block would be below the playing field
					//console.log('below playing field');
					return true;
				}
				else if (landed[row + potentialTopLeft.row][col + potentialTopLeft.col] != 0) {
					//console.log(landed[row + potentialTopLeft.row][col + potentialTopLeft.col]);
					//console.log('bot: space taken');
					//console.log(potentialTopLeft);
					//the space is taken
					return true;
				}
			}
		}
	}
	return false;
}
Tet.prototype.checkSideCollision = function (potentialTopLeft) {
	for (var row = 0; row < this.shape.length; row++) {
		for (var col = 0; col < this.shape[row].length; col++) {
			if (this.shape[row][col] != 0) {
				if (col + potentialTopLeft.col < 0) {
					//this block would be to the left of the playing field
					//console.log('left beyond playing field');
					return true;
				}
				if (col + potentialTopLeft.col >= landed[0].length) {
					//this block would be to the right of the playing field
					//console.log('right beyond playing field');
					return true;
				}
				if (landed[row + potentialTopLeft.row][col + potentialTopLeft.col] != 0) {
					//console.log('side: space taken');
					//the space is taken
					return true;
				}
			}
		}
	}
	return false;
}
Tet.prototype.moveLeft = function () {
	var potentialTopLeft = { row: this.topLeft.row, col: this.topLeft.col - 1 };
	if (!this.checkSideCollision(potentialTopLeft)) this.topLeft = potentialTopLeft;
}
Tet.prototype.moveRight = function () {
	var potentialTopLeft = { row: this.topLeft.row, col: this.topLeft.col + 1 };
	if (!this.checkSideCollision(potentialTopLeft)) this.topLeft = potentialTopLeft;
}
Tet.prototype.moveDown = function () {
	//console.log('moving down');
	var potentialTopLeft = { row: this.topLeft.row + 1, col: this.topLeft.col };
	//console.log(potentialTopLeft);
	if (!this.checkBotCollision(potentialTopLeft)) this.topLeft = potentialTopLeft;
	else {
		for (var row = 0; row < this.shape.length; row++) {
			for (var col = 0; col < this.shape[row].length; col++) {
				if (this.shape[row][col] != 0) {
					landed[row + this.topLeft.row][col + this.topLeft.col] = this.shape[row][col];
				}
			}
		}
		return this.collided();
	}
	return true;
}
function ClumpNode (row, col, val) {
	this.row = row;
	this.col = col;
	this.val = val;
}
function Clump (row, col) {
	this.row = row; // row and col is the position where this clump starts on the lastRowRemoved
	this.col = col;
	this.topLeft = { row: 0, col: 0 };
	this.matrix = [];
}
Clump.prototype.addNode = function (node) {
		this.matrix.push(node);
}
Clump.prototype.computeShape = function () {
	var rowMin = 15, colMin = 9, rowMax = 0, colMax = 0, shape = [];
	for (var i = 0; i < this.matrix.length; i++) {
		if (this.matrix[i].row < rowMin) rowMin = this.matrix[i].row;
		if (this.matrix[i].col < colMin) colMin = this.matrix[i].col;
	}
	for (var i = 0; i < this.matrix.length; i++) {
		this.matrix[i].row = this.matrix[i].row - rowMin;
		if (this.matrix[i].row > rowMax) rowMax = this.matrix[i].row;
		this.matrix[i].col = this.matrix[i].col - colMin;
		if (this.matrix[i].col > colMax) colMax = this.matrix[i].col;
	}
	for (var row = 0; row <= rowMax; row++) {
		var tmp = [];
		for (var col = 0; col <= colMax; col++) {
			tmp.push(0);
		}
		shape.push(tmp);
	}
	for (var i = 0; i < this.matrix.length; i++) {
		shape[this.matrix[i].row][this.matrix[i].col] = this.matrix[i].val;
	}
	
	//console.log(this.matrix);
	//console.log(shape);
	this.topLeft.row = rowMin;
	this.topLeft.col = colMin;
	return shape;
}
Clump.prototype.size = function () {
	return this.matrix.length;
}
Tet.prototype.collided = function () {
	if (this.type >= 0) newTet = true;
	//console.log('tet down collision!');
	var isFilled, lastRowRemoved = -1;
	for (var row = this.topLeft.row; row < landed.length; row++) {
		isFilled = true;
		for (var col = 0; col < landed[row].length; col++) {
			if (landed[row][col] == 0)
				isFilled = false;
		}
		if (isFilled) {
			landed.splice(row, 1);
			landed.unshift([0,0,0,0,0,0,0,0,0,0]);
			lastRowRemoved = row;
			score++;
			console.log('score:' + score);
		}
	}
	if (lastRowRemoved >= 0 && this.type >= 0) {
		//landedBeforeFloodFill = landed.clone(); // debug
		//calculate clumps along lastRowRemoved and above
		var clumps = [], q, n, c, colorFound = -1, colorNow = -1, i;
		for (var col = 0; col < landed[lastRowRemoved].length; col++) {
			q = [], colorFound = landed[lastRowRemoved][col], i = 0;
			q.push(new ClumpNode(lastRowRemoved, col, colorFound));
			c = new Clump(lastRowRemoved, col);
			while (q.length > 0 && i < 1000) {
				n = q.shift();
				colorNow = landed[n.row][n.col];
				if (colorNow == colorFound && colorNow > 0) {
					//console.log('i:'+col+' row:'+n.row+' col:'+n.col+' val:'+colorNow);
					c.addNode(n);
					landed[n.row][n.col] = 0;
					if (n.col > 0) q.push(new ClumpNode(n.row, n.col - 1, colorNow));
					if (n.col < 15) q.push(new ClumpNode(n.row, n.col + 1, colorNow));
					if (n.row > 0) q.push(new ClumpNode(n.row - 1, n.col, colorNow));
					if (n.row < 15) q.push(new ClumpNode(n.row + 1, n.col, colorNow));
				}
				i++;
			}
			//console.log(c.size());
			if (c.size() > 0) clumps.push(c);
		}
		//console.log(clumps);
		//clumps[0].computeShape();
		for (var i = 0; i < clumps.length; i++) {
			var tmp = new Tet();
			tmp.shape = clumps[i].computeShape();
			tmp.topLeft = clumps[i].topLeft;
			//console.log(tmp.topLeft);
			tmp.type = -1;
			while (tmp.moveDown()) {}
		}
	}
	return false;
}
Tet.prototype.toString = function () {
	return this.shape;
}