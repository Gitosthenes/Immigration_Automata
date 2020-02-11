ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload('./assets/survivor.png');
ASSET_MANAGER.queueDownload('./assets/zombie.png');

ASSET_MANAGER.downloadAll(function() {
    let canvas = document.getElementById('gameWorld');
    let ctx = canvas.getContext('2d');
    let gameEngine = new GameEngine();

    gameEngine.init(ctx);
    gameEngine.start();

    //# ADD ENTITIES HERE:

});