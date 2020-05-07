let ENGINE, SOCKET;

// window.onload = function () {
//     SOCKET = io.connect("http://24.16.255.56:8888");

//     SOCKET.on("load", function(data) {
//         ENGINE.load(data);
//     });
// }

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

    this.slowFactor = 0; //Game updates at 1/{slowFactor+1} speed, where 0 is as fast as possible
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
    ENGINE = this;
    (function gameLoop() {
        if(!ENGINE.paused) {
            ENGINE.loop();
            requestAnimFrame(gameLoop, ENGINE.ctx.canvas);
        }
    })();
}

GameEngine.prototype.pause = function() {
    this.paused = true;
}

GameEngine.prototype.resume = function() {
    if(this.paused) {
        this.paused = false;
        this.start();
    }
}

GameEngine.prototype.load = function(save) {
    let data = JSON.parse(JSON.stringify(save.data));
    let universe = new Universe(null, null, data);
    universe.game = this;
    this.entities[0] = universe;
    this.draw();
}

GameEngine.prototype.startInput = function () {
    let offsetX = -8;
    let offSetY = -45;
    let btnSave = document.getElementById("btnSave");
    let btnLoad = document.getElementById("btnLoad");
    let btnRandom = document.getElementById("btnRandom");
    let btnBlank = document.getElementById("btnBlank");
    let btnPause = document.getElementById("btnPause");
    let btnResume = document.getElementById("btnResume");
    let btnChange = document.getElementById("btnChange");

    //! MOUSE LISTENERS
    this.ctx.canvas.addEventListener('mousedown', function(e) {
        if(ENGINE.paused) {
            ENGINE.drag = true;
            ENGINE.entities[0].updateSingleCell(e.clientX+offsetX, e.clientY+offSetY, ENGINE.currentColor);
        }
    });

    this.ctx.canvas.addEventListener('mousemove', function(e) {
        if(ENGINE.paused && ENGINE.drag) {
            ENGINE.entities[0].updateSingleCell(e.clientX+offsetX, e.clientY+offSetY, ENGINE.currentColor);
        }
    });

    this.ctx.canvas.addEventListener('mouseup', function() {
        ENGINE.drag = false;
    });

    //! BUTTON CLICK LISTENERS
    // btnSave.addEventListener('click', function() {
    //     if(ENGINE.paused) {
    //         let universe = ENGINE.entities[0];
    //         let game = universe.game;
    //         delete universe.game;
    //         SOCKET.emit("save", {
    //             studentname: "abledso3",
    //             statename: "TOTALLY_NOT_MALWARE.exe",
    //             data: universe
    //         });
    //         universe.game = game;
    //     }
    // });

    // btnLoad.addEventListener('click', function() {
    //     if(ENGINE.paused) {
    //         SOCKET.emit("load", {
    //             studentname: "abledso3",
    //             statename: "TOTALLY_NOT_MALWARE.exe"
    //         });
    //     }
    // });

    btnRandom.addEventListener('click', function() {
        let universe = ENGINE.entities[0];
        universe.randomizeGrid(universe.currentGen);
        universe.randomizeGrid(universe.nextGen);
        if(ENGINE.paused) {
            ENGINE.draw();
        }
    });

    btnBlank.addEventListener('click', function() {
        let universe = ENGINE.entities[0];
        universe.blankGrid(universe.currentGen);
        universe.blankGrid(universe.nextGen);
        if(ENGINE.paused) {
            ENGINE.draw();
        }
    });

    btnPause.addEventListener('click', function() { 
        ENGINE.pause(); 
        btnSave.disabled = false;
        btnLoad.disabled = false;
    });

    btnResume.addEventListener('click', function() { 
        ENGINE.resume();
        btnSave.disabled = true;
        btnLoad.disabled = true;
    });

    btnChange.addEventListener('click', function() {
        if(ENGINE.currentColor == 2) {
            ENGINE.currentColor = 0;
        } else {
            ENGINE.currentColor++;
        }
        btnChange.innerText = "Current Color: " + ENGINE.colorTexts[ENGINE.currentColor];
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