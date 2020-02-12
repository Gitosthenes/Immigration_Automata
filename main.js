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
            grid[i][j].state = Math.floor(Math.random() * 2);
        }
    }
}

Universe.prototype.getLiveNeighborCount = function(row, col) {
    let count = 0;
    for(let i = row-1; i < row+2; i++) {
        for(let j = col-1; j < col+2; j++) {
            if(this.currentGen[i] && this.currentGen[i][j] && !(i == row && j == col)) {
                count += this.currentGen[i][j].state;
            }
        }
    }
    return count;
}

Universe.prototype.update = function() {
    for(let i = 0; i < this.rows; i++) {
        for(let j = 0; j < this.cols; j++) {
            let numLiveNeighbors = this.getLiveNeighborCount(i, j);
            if(this.currentGen[i][j].state == 0) {
                if(numLiveNeighbors == 3) {
                    this.nextGen[i][j].state = 1;
                } else {
                    // console.log(i + ", " + j);
                    this.nextGen[i][j].state = 0;
                }
            } else {
                if(numLiveNeighbors < 2 || numLiveNeighbors > 3) {
                    this.nextGen[i][j].state = 0;
                } else {
                    this.nextGen[i][j].state = 1;
                }
            }
        }
    }
    //Copy nextGen over current Gen
    this.currentGen = JSON.parse(JSON.stringify(this.nextGen));

    Entity.prototype.update.call(this);
}

Universe.prototype.draw = function(ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);

    for(let i = 0; i < this.rows; i++) {
        for(let j = 0; j < this.cols; j++) {
            if(this.currentGen[i][j].state == 1) {
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
        for(let j = 0; j < outer[i].length; j++) {
            outer[i][j] = new Cell(0);
        }
    }
    return outer;
}

function Cell(state) {
    this.state = state;
}
Cell.prototype.constructor = Cell;

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