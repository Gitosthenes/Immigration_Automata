// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;

    this.slowFactor = 4;
    this.currentTick = this.slowFactor;
}

Timer.prototype.tick = function () {
    if(this.currentTick == this.slowFactor){
        this.currentTick = 0;
    } else {
        this.currentTick++;
    }
    
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

function GameEngine() {
    this.paused = false;
    this.entities = [];
    this.showOutlines = false;
    this.ctx = null;
    this.currentColor = 0; //0 = dead, 1 = alive1, 2 = alive2
    this.colorTexts = {0:"BLACK", 1:"BLUE", 2:"ORANGE"};
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.drag = false;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.timer = new Timer();
}

GameEngine.prototype.start = function () {
    var that = this;
    (function gameLoop() {
        if(!that.paused) {
            that.loop();
            requestAnimFrame(gameLoop, that.ctx.canvas);
        }
    })();
}

GameEngine.prototype.pause = function() {
    this.paused = true;

    let hint = document.getElementById("strHint");
    hint.style.visibility = "visible";
}

GameEngine.prototype.resume = function() {
    if(this.paused) {
        this.paused = false;
        this.start();

        let hint = document.getElementById("strHint");
        hint.style.visibility = "hidden";
    }
}

GameEngine.prototype.startInput = function () {
    var that = this;
    let btnRandom = document.getElementById("btnRandom");
    let btnBlank = document.getElementById("btnBlank");
    let btnPause = document.getElementById("btnPause");
    let btnResume = document.getElementById("btnResume");
    let btnChange = document.getElementById("btnChange");

    this.ctx.canvas.addEventListener('mousedown', function(e) {
        if(that.paused) {
            that.drag = true;
            let universe = that.entities[0];
            universe.updateSingleCell(e.clientX, e.clientY, that.currentColor);
        }
    });

    this.ctx.canvas.addEventListener('mousemove', function(e) {
        if(that.paused && that.drag) {
            let universe = that.entities[0];
            universe.updateSingleCell(e.clientX, e.clientY, that.currentColor);
        }
    });

    this.ctx.canvas.addEventListener('mouseup', function(e) {
        that.drag = false;
    });

    btnRandom.addEventListener('click', function(e) {
        let universe = that.entities[0];
        universe.randomizeGrid(universe.currentGen);
        universe.randomizeGrid(universe.nextGen);
        if(that.paused) {
            that.draw();
        }
    });

    btnBlank.addEventListener('click', function(e) {
        let universe = that.entities[0];
        universe.blankGrid(universe.currentGen);
        universe.blankGrid(universe.nextGen);
        if(that.paused) {
            that.draw();
        }
    });

    btnPause.addEventListener('click', function(e) { that.pause(); });

    btnResume.addEventListener('click', function(e) { that.resume(); });

    btnChange.addEventListener('click', function(e) {
        if(that.currentColor == 2) {
            that.currentColor = 0;
        } else {
            that.currentColor++;
        }
        btnChange.innerText = "Current Color: " + that.colorTexts[that.currentColor];
    });
}

GameEngine.prototype.addEntity = function (entity) {
    this.entities.push(entity);
}

GameEngine.prototype.draw = function () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.clockTick = this.timer.tick();
    if(this.timer.currentTick == 0) {
        this.update();
        this.draw();
    }
    this.space = null;
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        this.game.ctx.beginPath();
        this.game.ctx.strokeStyle = "green";
        this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.game.ctx.stroke();
        this.game.ctx.closePath();
    }
}

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    return offscreenCanvas;
}