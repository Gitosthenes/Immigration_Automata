function Universe(game, cellSize) {
    this.game = game;
    this.cellSize = cellSize;
    this.rows = game.surfaceWidth / cellSize;
    this.cols = game.surfaceHeight / cellSize;
    this.currentGen = setupGrid(this.rows, this.cols);
    this.nextGen = setupGrid(this.rows, this.cols);
    this.randomizeGrid(this.currentGen);
}

Universe.prototype = new Entity();
Universe.prototype.constructor = Universe;

Universe.prototype.randomizeGrid = function(grid) {
    for(let i = 0; i < this.rows; i++) {
        for(let j = 0; j < this.cols; j++) {
            grid[i][j].state = Math.floor(Math.random() * 3);
        }
    }
}

Universe.prototype.blankGrid = function(grid) {
    for(let i = 0; i < this.rows; i++) {
        for(let j = 0; j < this.cols; j++) {
            grid[i][j].state = 0;
        }
    }
}

Universe.prototype.getLiveNeighborCounts = function(row, col) {
    let neighborVals = [];
    for(let i = row-1; i < row+2; i++) {
        for(let j = col-1; j < col+2; j++) {
            if(this.currentGen[i] && this.currentGen[i][j] && !(i == row && j == col) && this.currentGen[i][j].state != 0) {
                neighborVals.push(this.currentGen[i][j].state);
            }
        }
    }
    // get sum of each type of alive neighbor and set it to cell field
    // @see https://stackoverflow.com/a/19395302/12322150
    let that = this;
    neighborVals.forEach(function(x) {
        that.currentGen[row][col].neighborCounts[x] = (that.currentGen[row][col].neighborCounts[x] || 0) + 1;
    });
}

Universe.prototype.update = function() {
    let that = this;
    for(let i = 0; i < this.rows; i++) {
        for(let j = 0; j < this.cols; j++) {
            this.getLiveNeighborCounts(i, j);
            let numLiveNeighbors = 0;
            for(let field in this.currentGen[i][j].neighborCounts) {
                numLiveNeighbors += this.currentGen[i][j].neighborCounts[field];
            }
            if(this.currentGen[i][j].state == 0) { //Current cell is dead
                if(numLiveNeighbors == 3) {
                    let onesTot = this.currentGen[i][j].neighborCounts[1];
                    let twosTot = this.currentGen[i][j].neighborCounts[2];
                    let newNum = this.currentGen[i][j].neighborCounts[1] > this.currentGen[i][j].neighborCounts[2] ? 1 : 2;
                    this.nextGen[i][j].state = this.currentGen[i][j].neighborCounts[1] > this.currentGen[i][j].neighborCounts[2] ? 1 : 2;
                } else {
                    this.nextGen[i][j].state = 0;
                }
            } else { //Current cell is alive
                if(numLiveNeighbors < 2 || numLiveNeighbors > 3) {
                    this.nextGen[i][j].state = 0;
                } else {
                    this.nextGen[i][j].state = this.currentGen[i][j].state;
                }
            }
        }
    }
    //Copy nextGen over current Gen
    this.currentGen = JSON.parse(JSON.stringify(this.nextGen));

    Entity.prototype.update.call(this);
}

Universe.prototype.updateSingleCell = function(x, y) {
    console.log(x + ", " + y);  

    //update cell state:
    let cellX = Math.floor(x / this.cellSize);
    let cellY = Math.floor(y / this.cellSize);
    this.currentGen[cellX][cellY].state = 1;

    //draw updated state:
    this.game.ctx.fillStyle = 'dodgerBlue'; //TODO make dependent on user choice
    this.game.ctx.fillRect(x, y, this.cellSize, this.cellSize);
}

Universe.prototype.draw = function(ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);

    for(let i = 0; i < this.rows; i++) {
        for(let j = 0; j < this.cols; j++) {
            let x = i * this.cellSize;
            let y = j * this.cellSize;
            if(this.currentGen[i][j].state == 1) {
                ctx.fillStyle = 'dodgerblue';
                ctx.fillRect(x, y, this.cellSize, this.cellSize);
            } else if(this.currentGen[i][j].state == 2) {
                ctx.fillStyle = 'darkorange';
                ctx.fillRect(x, y, this.cellSize, this.cellSize);
            }
        }
    }

    Entity.prototype.draw.call(this, ctx);
}

function setupGrid(rows, cols) {
    let outer = new Array(rows);
    for(let i = 0; i < rows; i++) {
        outer[i] = new Array(cols);
        for(let j = 0; j < outer[i].length; j++) {
            outer[i][j] = new Cell(0);
        }
    }
    return outer;
}

function Cell(state) {
    this.state = state;
    this.neighborCounts = {
        1: 0,
        2: 0
    };
}

ASSET_MANAGER = new AssetManager();
// ASSET_MANAGER.queueDownload('');

ASSET_MANAGER.downloadAll(function() {
    let canvas = document.getElementById('gameWorld');
    let ctx = canvas.getContext('2d');
    let gameEngine = new GameEngine();
    let cellSize = Math.floor(canvas.width/200);

    gameEngine.init(ctx);
    gameEngine.start();

    //# ADD ENTITIES HERE:
    gameEngine.addEntity(new Universe(gameEngine, cellSize));
});