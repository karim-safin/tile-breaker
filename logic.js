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
        for (var i = 0; i < this.width; ++i) {
            this.state[i] = new Array(this.width);
        }
        for (var i = 0; i < this.width; ++i) {
            this.randomFillColumn(i);
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
        if (!this.isInBoundaries(0, column)) {
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
        if (!this.isInBoundaries(row, column)) {
            return 0;
        }
        return this.state[row][column];
    }

    /**
     * Returns true if the cell [row][column] is empty
     */
    isEmpty(row, column) {
        if (!this.isInBoundaries(row, column)) {
            return true;
        }
        return this.state[row][column] == 0;
    }

    /**
     * Checks whether the given coordiantes are inside the game field
     */
    isInBoundaries(row, column) {
        return    row >= 0
               && row < this.width
               && column >= 0
               && column < this.width;
    }

    /**
     * Returns true if a move with a given coordinates is valid. This means that
     * the cell in the given coordinates is not empty and has at least one
     * neighbour that has the same color.
     */
    isValidMove(row, column) {
        if (!this.isInBoundaries(row, column)) {
            return false;
        }
        if (this.isEmpty(row, column)) {
            return false;
        }
        var dx = [1, 0, -1, 0];
        var dy = [0, 1, 0, -1];
        for (var i = 0; i < 4; ++i) {
            // if the given cell's i'th neighbour has the same color as this
            // cell, then this move is valid
            if (this.getColor(row, column) == this.getColor(row + dx[i], column + dy[i])) {
                return true;
            }
        }
        // if we have not found any neighbours with the same color, then the
        // move is not valid
        return false;
    }

    /**
     * If the move in the cell (i, j) is valid, remove the whole chunk of cells
     * of the same color with (i, j). The removed cells become empty. After that
     * some cells will fall down. After that, some columns may become empty. In
     * this case, the rows are shifted from right to left. Finally, if some rows
     * were shifted, this number adds to the player's score and the rightmost
     * empty rows become filled with random tiles.
     */
    performMove(i, j) {
        if (!this.isValidMove(i, j)) {
            return;
        }
        var thisColor = this.getColor(i, j);
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
                if (   this.isInBoundaries(ni, nj)
                    && !visited[ni][nj] 
                    && this.getColor(ni, nj) == thisColor) {
                    stack.push([ni, nj]);
                }
            }
        }
        // Now the cells that have to be removed became visited. Remove them
        for (var i = 0; i < this.width; ++i) {
            for (var j = 0; j < this.width; ++j) {
                if (visited[i][j]) {
                    this.state[i][j] = 0;
                }
            }
        }
        // Now some tiles may fall down
        this.fallDown();
        // Now some columns may shift from right to left
        this.fallLeft();
        // Now there are some empty columns. They were cleared as a result of
        // this move. We have to add their number to the player's score
        this.score = this.score + this.emptyColumnsCount();
        // And finally, the newly-cleared columns have to be filled with random
        // tiles.
        this.randomFillEmptyColumns();
    }

    /**
     * If some tiles are "hanging in the air" (have an empty cell beneath them),
     * then they have to fall down. This function does this for every column.
     */
    fallDown() {
        for (var i = 0; i < this.width; ++i) {
            this.fallDownColumn(i);
        }
    }

    /**
     * If for some non-empty cells of this column it is true that there is an
     * empty cell in this column but on the row below, then that cell has to
     * move to that empty cell. If after that some cells can be fallen down,
     * they will also "float" to the bottom
     */
    fallDownColumn(column) {
        for (var i = 0; i < this.width; ++i) {
            for (var j = this.width - 1; j >= 1; --j) {
                if (   !this.isEmpty(j, column)
                    &&  this.isEmpty(j - 1, column)) {
                    var hold = this.state[j][column];
                    this.state[j][column] = this.state[j - 1][column];
                    this.state[j - 1][column] = hold;
                }
            }
        }
    }

    /**
     * If there are some empty columns, they will shift to the left, so that
     * after performing this operation only the righrmost columns will be empty
     */
    fallLeft() {
        for (var i = 0; i < this.width; ++i) {
            for (var j = this.width - 1; j >= 1; --j) {
                if (   !this.isColumnEmpty(j)
                    &&  this.isColumnEmpty(j - 1)) {
                    this.swapColumns(j, j - 1);
                }
            }
        }
    }

    /**
     * Swaps the two columns element-wise
     */
    swapColumns(col1, col2) {
        for (var i = 0; i < this.width; ++i) {
            var            hold = this.state[i][col1];
            this.state[i][col1] = this.state[i][col2];
            this.state[i][col2] = hold;
        }
    }
    /**
     * Returns true if there is at least one non-empty cell in this column and
     * false otherwise
     */
    isColumnEmpty(column) {
        for (var i = 0; i < this.width; ++i) {
            if (this.state[i][column] != 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns the number of columns without non-empty tiles
     */
    emptyColumnsCount() {
        var cnt = 0;
        for (var i = 0; i < this.width; ++i) {
            if (this.isColumnEmpty(i)) {
                cnt = cnt + 1;
            }
        }
        return cnt;
    }

    /**
     * Fills all the empty columns with random tiles
     */
    randomFillEmptyColumns() {
        for (var i = 0; i < this.width; ++i) {
            if (this.isColumnEmpty(i)) {
                this.randomFillColumn(i);
            }
        }
    }

    /**
     * Returns true if there exists a valid move in the current game state
     */
    hasValidMoves() {
        for (var i = 0; i < this.width; ++i) {
            for (var j = 0; j < this.width; ++j) {
                if (  !this.isEmpty(i, j)) {
                    if (this.getColor(i, j) == this.getColor(i + 1, j)) {
                        return true;
                    }
                    if (this.getColor(i, j) == this.getColor(i, j + 1)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

/**
 * Draws a cell at [row][column] location in the game with a given size
 */
function drawCell(context, row, column, size) {
    var currentCellColor = game.getColor(game.width - 1 - row, column);
    context.fillStyle = colors[currentCellColor];
    context.fillRect(column * size, row * size, size, size);
}

function drawGame() {
    var c = document.getElementById("mainCanvas");
    var ctx = c.getContext("2d");
    var cellSize = c.width / gameSize;
    for (var i = 0; i < game.width; ++i) {
        for (var j = 0; j < game.width; ++j) {

            drawCell(ctx, i, j, cellSize);
        }
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
    y = game.width - 1 - y;
    if (game.isValidMove(y, x)) {
        game.performMove(y, x);
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
