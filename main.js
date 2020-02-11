function Universe(game, cellSize) {
    this.game = game;
    this.cellSize = cellSize;
    this.rows = game.surfaceWidth / cellSize;
    this.cols = game.surfaceHeight / cellSize;
    this.grid = setupGrid(this.rows, this.cols);
    this.initializeGrid();
}

Universe.prototype = new Entity();
Universe.prototype.constructor = Universe;

Universe.prototype.initializeGrid = function() {
    for(let i = 0; i < this.rows; i++) {
        for(let j = 0; j < this.cols; j++) {
            this.grid[i][j] = Math.floor(Math.random() * 2);
        }
    }
}

Universe.prototype.getLiveNeighborCount = function(row, col) {
    let count = 0;
    for(let i = row-1; i < row+2; i++) {
        for(let j = col-1; j < col+2; j++) {
            if(this.grid[i]) {
                if(this.grid[i][j]) {
                    if(!(i == row && j == col)) {
                        count += this.grid[i][j];
                    }
                }
            }
        }
    }
    console.log(row + ", " + col + ": " + count);
    return count;
}

Universe.prototype.update = function() {
    let newGrid = setupGrid(this.rows, this.cols);
    // console.log(newGrid);
    for(let i = 0; i < this.rows; i++) {
        for(let j = 0; j < this.cols; j++) {
            let numLiveNeighbors = this.getLiveNeighborCount(i, j);
            console.log(i + ", " + j + ": " + numLiveNeighbors);
            if(this.grid[i][j] == 0) {
                if(numLiveNeighbors == 3) {
                    newGrid[i][j] = 1;
                } else {
                    newGrid[i][j] = 0;
                }
            } else {
                if(numLiveNeighbors < 2 || numLiveNeighbors > 3) {
                    newGrid[i][j] = 0;
                } else {
                    newGrid[i][j] = 1;
                }
            }
        }
    }
    // console.log(newGrid)
    this.grid = newGrid;

    Entity.prototype.update.call(this);
}

Universe.prototype.draw = function(ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);

    for(let i = 0; i < this.rows; i++) {
        for(let j = 0; j < this.cols; j++) {
            if(this.grid[i][j] == 1) {
                let x = i * this.cellSize;
                let y = j * this.cellSize;
                ctx.fillStyle = 'black';
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
    }
    return outer;
}

ASSET_MANAGER = new AssetManager();
// ASSET_MANAGER.queueDownload('');

ASSET_MANAGER.downloadAll(function() {
    let canvas = document.getElementById('gameWorld');
    let ctx = canvas.getContext('2d');
    let gameEngine = new GameEngine();
    let cellSize = Math.floor(canvas.width/100);

    gameEngine.init(ctx);
    gameEngine.start();

    //# ADD ENTITIES HERE:
    console.log("adding entities")
    gameEngine.addEntity(new Universe(gameEngine, cellSize));
});