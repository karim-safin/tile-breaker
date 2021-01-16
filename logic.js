/**
 * The current game state
 */
var game;

/**
 * How many rows/columns will there be in a game?
 */
var gameSize = 10;

/**
 * How many different colors are there?
 */
var colorsCount = 5;

var colors = ["white", "#e6194b", "#0082c8", "#3cb44b", "#ffe119", "#f58231"]

/**
 * Checks whether the given coordiantes are inside the game field
 */
function isInBoundaries(row, column) {
    return    row >= 0
           && row < gameSize
           && column >= 0
           && column < gameSize;
}

/**
 * A hash function on coordinates inside the game field.
 * Returns a positive value for coordinates that are inside the field and 0 for
 * other coordinates.
 * Will return unique values for all the coordinates inside game field.
 */
function hashCoordinates(i, j) {
	if (!isInBoundaries(i, j)) {
		return 0;
	}
	return i * gameSize + j + 1;
}

/**
 * A tile of TileBreaker game
 */
class Tile {
	constructor(i, j, color) {
		this.i = i;
		this.j = j;
		this.color = color;
	}

	hash() {
		return hashCoordinates(this.i, this.j);
	}

	/**
	 * Constructs a random tile at a given position
	 */
	static randomTileAt(i, j) {
		var randomColor = Math.floor((Math.random() * colorsCount) + 1);
		return new Tile(i, j, randomColor);
	}

	/**
	 * Checks whether this tile is the same color of another one
	 */
	equalTo(otherTile) {
		if (otherTile == undefined) {
			return false;
		}
		return this.color == otherTile.color;
	}
}

/**
 * A set of tiles on a game field that supports operations on multiple tiles
 */
class TileSet {
	constructor() {
		this.tiles = new Map();
	}

	addTile(tile) {
		this.tiles.set(tile.hash(), tile);
	}

	/**
     * Fills a given column with random tiles
     */
    randomFillColumn(column) {
        if (!isInBoundaries(0, column)) {
            return;
        }
        for (var i = 0; i < gameSize; ++i) {
        	this.addTile(Tile.randomTileAt(i, column));
        }
    }

    getTileAt(i, j) {
    	return this.tiles.get(hashCoordinates(i, j));
    }

    removeTileAt(i, j) {
    	if (!this.hasTileAt(i, j)) {
    		return;
    	}
    	this.tiles.delete(hashCoordinates(i, j));
    }

    hasTileAt(i, j) {
    	return this.tiles.has(hashCoordinates(i, j));
    }

    moveTileDown(i, j) {
    	if (!this.hasTileAt(i, j)) {
    		return;
    	}
    	var tileToMove = this.getTileAt(i, j);
    	this.removeTileAt(i, j);
    	tileToMove.i = tileToMove.i - 1;
    	this.addTile(tileToMove);
    }
}

/**
 * A class that represents a game state. The game state is a 2-d array of size
 * n x n, whose cells have integers in them. 0 denotes an empty cell, 1-5 means
 * that a cell contains a tile of color 1-5 respectively. This game knows the
 * current player's score and can also update it's state and score according to
 * player's moves.
 */
class Game {
    /**
     * Constructs a new game of size width x width with random filling
     */
    constructor(w) {
        this.score = 0;
        this.width = w;
        this.state = new Array(this.width);
        this.tileSet = new TileSet();
        for (var i = 0; i < this.width; ++i) {
            this.state[i] = new Array(this.width);
        }
        for (var i = 0; i < this.width; ++i) {
            this.randomFillColumn(i); // TODO: delete after testing tileSet
            this.tileSet.randomFillColumn(i);
        }
    }

    /**
     * Generates a number representing a random color (except empty color)
     */
    static randomColor() {
        return Math.floor((Math.random() * colorsCount) + 1);
    }

    /**
     * Fills a given column with random non-empty tiles
     */
    randomFillColumn(column) {
        if (!isInBoundaries(0, column)) {
            return;
        }
        for (var i = 0; i < this.width; ++i) {
            this.state[i][column] = Game.randomColor();
        }
    }

    /**
     * Returns the number of the color in the cell [row][column]
     */
    getColor(row, column) {
        if (!isInBoundaries(row, column)) {
            return 0;
        }
        return this.state[row][column];
    }

    /**
     * Returns true if the cell [row][column] is empty
     */
    isEmpty(row, column) {
        if (!isInBoundaries(row, column)) {
            return true;
        }
        return this.state[row][column] == 0;
    }

    /**
     * Returns true if a move with a given coordinates is valid. This means that
     * the cell in the given coordinates is not empty and has at least one
     * neighbour that has the same color.
     */
    isValidMoveNew(row, column) {
        if (!isInBoundaries(row, column)) {
            return false;
        }
        if (!this.tileSet.hasTileAt(row, column)) {
            return false;
        }
        var dx = [1, 0, -1, 0];
        var dy = [0, 1, 0, -1];
        let thisTile = this.tileSet.getTileAt(row, column);
        for (var i = 0; i < 4; ++i) {
            // if the given cell's i'th neighbour has the same color as this
            // cell, then this move is valid
            var neighbourTile = this.tileSet.getTileAt(row + dx[i], column + dy[i]);
            if (thisTile.equalTo(neighbourTile)) {
                return true;
            }
        }
        // if we have not found any neighbours with the same color, then the
        // move is not valid
        return false;
    }

    performMoveNew(i, j) {
    	if (!this.isValidMoveNew(i, j)) {
            return;
        }
        var thisTile = this.tileSet.getTileAt(i, j);
        // we know that the move is valid, so perform a depth-first search to
        // remove the adjacent cells with the same color.
        var stack = [[i, j]];
        var visited = new Array(this.width);
        var dx = [1, 0, -1, 0];
        var dy = [0, 1, 0, -1];
        for (var i = 0; i < this.width; ++i) {
            visited[i] = new Array(this.width);
            for (var j = 0; j < this.width; ++j) {
                visited[i][j] = false;
            }
        }
        while (stack.length > 0) {
            var cur = stack.pop();
            var ci = cur[0]; // current i
            var cj = cur[1]; // current j
            visited[ci][cj] = true;
            for (var i = 0; i < 4; ++i) {
                var ni = ci + dx[i]; // neighbour i
                var nj = cj + dy[i]; // neighbour j
                var neighbourTile = this.tileSet.getTileAt(ni, nj);
                if (   isInBoundaries(ni, nj)
                    && !visited[ni][nj] 
                    && thisTile.equalTo(neighbourTile)) {
                    stack.push([ni, nj]);
                }
            }
        }
        // Now the cells that have to be removed became visited. Remove them
        for (var i = 0; i < this.width; ++i) {
            for (var j = 0; j < this.width; ++j) {
                if (visited[i][j]) {
                	this.tileSet.removeTileAt(i, j);
                }
            }
        }
        // Now some tiles may fall down
        this.fallDownNew();
        // Now some columns may shift from right to left
        this.fallLeftNew();
        // Now there are some empty columns. They were cleared as a result of
        // this move. We have to add their number to the player's score
        this.score = this.score + this.emptyColumnsCountNew();
        // And finally, the newly-cleared columns have to be filled with random
        // tiles.
        this.randomFillEmptyColumnsNew();
    }

    /**
     * If some tiles are "hanging in the air" (have an empty cell beneath them),
     * then they have to fall down. This function does this for every column.
     */
    fallDownNew() {
        for (var i = 0; i < this.width; ++i) {
            this.fallDownColumnNew(i);
        }
    }

    /**
     * If for some non-empty cells of this column it is true that there is an
     * empty cell in this column but on the row below, then that cell has to
     * move to that empty cell. If after that some cells can be fallen down,
     * they will also "float" to the bottom
     */
    fallDownColumnNew(column) {
        for (var i = 0; i < this.width; ++i) {
            for (var j = this.width - 1; j >= 1; --j) {
                if (    this.tileSet.hasTileAt(j, column)
                    &&  !this.tileSet.hasTileAt(j - 1, column)) {
                	this.tileSet.moveTileDown(j, column);
                }
            }
        }
    }

    /**
     * If there are some empty columns, they will shift to the left, so that
     * after performing this operation only the righrmost columns will be empty
     */
    fallLeftNew() {
        for (var i = 0; i < this.width; ++i) {
            for (var j = this.width - 1; j >= 1; --j) {
                if (   !this.isColumnEmptyNew(j)
                    &&  this.isColumnEmptyNew(j - 1)) {
                    this.swapColumnsNew(j, j - 1);
                }
            }
        }
    }

    /**
     * Swaps the two columns element-wise
     */
    swapColumnsNew(col1, col2) {
        for (var i = 0; i < this.width; ++i) {
            var t1 = this.tileSet.getTileAt(i, col1);
            var t2 = this.tileSet.getTileAt(i, col2);
            this.tileSet.removeTileAt(i, col1);
            this.tileSet.removeTileAt(i, col2);
            if (typeof t1 !== "undefined") {
                t1.j = col2;
                this.tileSet.addTile(t1);
            }
            if (typeof t2 !== "undefined") {
                t2.j = col1;
                this.tileSet.addTile(t2);
            }
        }
    }

    /**
     * Returns true if there is at least one non-empty cell in this column and
     * false otherwise
     */
    isColumnEmptyNew(column) {
        for (var i = 0; i < this.width; ++i) {
            if (this.tileSet.hasTileAt(i, column)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns the number of columns without non-empty tiles
     */
	emptyColumnsCountNew() {
		var cnt = 0;
        for (var i = 0; i < this.width; ++i) {
            if (this.isColumnEmptyNew(i)) {
                cnt = cnt + 1;
            }
        }
        return cnt;
	}

    /**
     * Fills all the empty columns with random tiles
     */
    randomFillEmptyColumnsNew() {
        for (var i = 0; i < this.width; ++i) {
            if (this.isColumnEmptyNew(i)) {
                this.tileSet.randomFillColumn(i);
            }
        }
    }

    /**
     * Returns true if there exists a valid move in the current game state
     */
    hasValidMoves() {
        for (var i = 0; i < this.width; ++i) {
            for (var j = 0; j < this.width; ++j) {
                var t0 = this.tileSet.getTileAt(i, j);
                if (typeof t0 == "undefined") {
                    continue;
                }
                var t1 = this.tileSet.getTileAt(i + 1, j);
                if (t0.equalTo(t1)) {
                    return true;
                }
                var t2 = this.tileSet.getTileAt(i, j + 1);
                if (t0.equalTo(t2)) {
                    return true;
                }
            }
        }
        return false;
    }
}

/**
 * Draws an object of a Tile class
 */
function drawTile(context, tile, size) {
	var currentCellColor = tile.color;
    context.fillStyle = colors[currentCellColor];
    context.fillRect(tile.j * size, (gameSize - 1 - tile.i) * size, size, size);
}

function drawGame() {
    var c = document.getElementById("mainCanvas");
    var ctx = c.getContext("2d");
    var cellSize = c.width / gameSize;
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, cellSize * 10, cellSize * 10);
    for (tile of game.tileSet.tiles.values()) {
    	drawTile(ctx, tile, cellSize);
    }
    var scoreDiv = document.getElementById("scoreDiv");
    scoreDiv.innerHTML = "Score: " + game.score;
}

/**
 * Creates a new game field and sets the score counter to 0
 */
function setupGame() {
    game = new Game(gameSize);
    drawGame();
}

function initialize() {
	var c = document.getElementById("mainCanvas");
    var ctx = c.getContext("2d");
}

function gameEndMessage() {
    alert("Game ended!");
}

/**
 * Finds in which cell did the user click and then performs the move according
 * to the given cell if that move is valid. If it was valid, the game is
 * redrawn.
 */
function onMouseClick(event) {
    var c = document.getElementById("mainCanvas");
    var rect = c.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var cellSize = c.width / gameSize;
    x = Math.floor(x / cellSize);
    y = Math.floor(y / cellSize);
    y = gameSize - 1 - y;
    console.log([x, y]);
    if (game.isValidMoveNew(y, x)) {
        game.performMoveNew(y, x);
        drawGame();
        if (!game.hasValidMoves()) {
            gameEndMessage();
        }
    }
}

function setCanvasSize(width, height) {
    var canvas = document.getElementById("mainCanvas");
    width = Math.floor(width);
    height = Math.floor(height);
    width = width - width % gameSize; // now width is divisible by gameSize
    height = height - height % gameSize; // the same with height
    canvas.width = width;
    canvas.height = height;
}

/**
 * Makes sure that the canvas will fit into body but won't be larget than
 * maxCanvasSize declared at the beginning of the file
 */
function onResize() {
    var bodyWidth = window.innerWidth;
    var buttonRect = document.getElementById("newGameButton").getBoundingClientRect();
    var buttonHeight = buttonRect.bottom - buttonRect.top;
    var scoreRect = document.getElementById("scoreDiv").getBoundingClientRect();
    var scoreHeight = scoreRect.bottom - scoreRect.top;
    var bodyHeight = window.innerHeight - scoreHeight - buttonHeight;
    if (bodyWidth < bodyHeight) {
        setCanvasSize(bodyWidth * 0.9, bodyWidth * 0.9);
    } else {
        setCanvasSize(bodyHeight * 0.9, bodyHeight * 0.9);
    }
    if (game != undefined) {
        drawGame();
    }
}
