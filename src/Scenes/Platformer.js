class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    /*
        TODO:
        -end game state
        -checkpoint system (object)
        -when die zoom camera on death
        -death animation?
        -moving platform at end?
        -box particles
        -run particles
        -audio
            -landing jump
            -jump
            -run
            -break box
            -coin
    */
    init() {
        // variables and settings
        this.ACCELERATION = 1000;
        this.DRAG = 1000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.MAX_SPEED = 200;
    }
    preload() {
        
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    
    }

    create() {
        this.coinsCollected = 0;

        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tilesetBG = this.map.addTilesetImage("TileMapBG", "kenny_tilemap_packed_BG");
        this.tileset = this.map.addTilesetImage("TileMap", "kenny_tilemap_packed");
        this.tilesetIndustrial = this.map.addTilesetImage("TileMapIndustrial", "kenny_tilemap_packed_industrial");
        this.tilesetFarm = this.map.addTilesetImage("TileMapFarm", "kenny_tilemap_packed_farm");

        // Create a layer
        this.backgroundArtLayer = this.map.createLayer("BackgroundArt", [this.tileset, this.tilesetIndustrial, this.tilesetFarm, this.tilesetBG], 0, 0);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", [this.tileset, this.tilesetIndustrial, this.tilesetFarm, this.tilesetBG], 0, 0);
        this.backgroundLayer = this.map.createLayer("Plants-n-Stuff", [this.tileset, this.tilesetIndustrial, this.tilesetFarm, this.tilesetBG], 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });     
        
        this.backgroundLayer.setCollisionByProperty({
            collides: true
        });
        // this.backgroundArtLayer.setCollisionByPropertty({
            // collides: true
        // });

        // Create coins from Objects layer in tilemap
        this.boxes = this.map.createFromObjects("Objects", {
            name: "box",
            key: "tilemap_sheet",
            frame: 6
        });        
        this.coinBoxes = this.map.createFromObjects("Objects", {
            name: "box1",
            key: "tilemap_sheet",
            frame: 26
        });
        
        this.coins = this.map.createFromObjects("Objects", {
            name: "coins",
            key: "tilemap_sheet",
            frame: 151
        });
        this.spikes = this.map.createFromObjects("Objects", {
            name: "spikes",
            key: "tilemap_sheet",
            frame: 68
        });
        this.cloud = this.map.createFromObjects("Objects", {
            name: "cloud",
            key: "tilemap_sheet",
            frame: 156
        });

        // platform set up
        this.movingPlatforms = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        this.currentPlatform = null;
        this.counter = 0;

        this.cloud.forEach(obj => {
            this.counter++;
            this.decide = this.counter % 3;
            this.texture = 154;
            if (this.decide == 0) {
                this.texture = 155;
            }
            else if (this.decide == 1) {
                this.texture = 153;
            }
            let plat = this.movingPlatforms.create(obj.x, obj.y, 'tilemap_sheet', this.texture);
            plat.prevX = plat.x;
            obj.setVisible(false);
            
            this.tweens.add({
                targets: plat,
                x: { from: plat.x, to: plat.x + 36 },
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
            });
        });

        // Play the same animation for every memeber of the Object coins array
        this.anims.play('coinAnim', this.coins);

        this.physics.world.enable(this.boxes, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.coinBoxes, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.spikes, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.cloud, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.boxGroup = this.add.group(this.boxes);
        this.coinBoxGroup = this.add.group(this.coinBoxes);
        this.coinGroup = this.add.group(this.coins);
        this.spikeGroup = this.add.group(this.spikes);
        this.spikeGroup.children.iterate(spike => {

            spike.body.setSize(spike.width, spike.height / 2); // Half height hitbox
            spike.body.setOffset(0, spike.height / 2);         // Move it to bottom
        });

        // Find water tiles
        this.waterTiles = this.groundLayer.filterTiles(tile => {
            return tile.properties.water == true;
        });    

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setSize(my.sprite.player.width * 0.75, my.sprite.player.height * 0.95); // Half height hitbox
        // my.sprite.player.body.setOffset(0, my.sprite.player.height * 0.75);         // Move it to bottom

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        this.coin_vfx = this.add.particles(0, 0, 'coin_particle', {
            quantity: 5,
            scale: { start: 1, end: 0.2 },
            speed: { min: 25, max: 100 },
            angle: { min: 230, max: 310 },
            lifespan: { min: 300, max: 400 },
        }); 
        this.coin_vfx.stop();        
        
        this.box_vfx = this.add.particles(0, 0, 'box_particle', {
            quantity: 3,
            scale: {start: .3, end: 0.1},
            speed: { min: 25, max: 75 },
            // angle: 115,
            radial: true,
            // angle: { min: 0, max: 360 },
            rotate: { min: 0, max: 360 },
            lifespan: { min: 150, max: 150 },
        }); 
        this.box_vfx.stop();

        this.physics.add.collider(my.sprite.player, this.boxGroup, (obj1, obj2) => {
            // Box breaks!
            if (obj1.y > obj2.y + 16) {
                this.box_vfx.emitParticleAt(obj2.x, obj2.y);
                obj2.destroy();
            }

        });
        
        this.physics.add.collider(my.sprite.player, this.coinBoxGroup, (obj1, obj2) => {
            // coinBox breaks and coin animation!
            if (obj1.y > obj2.y + 16) {
                this.box_vfx.emitParticleAt(obj2.x, obj2.y);
                obj2.destroy();
                const coin = this.add.sprite(obj2.x, obj2.y, 'tilemap_sheet');
                coin.play('coinAnim');

                // move it upward and destroy after
                this.tweens.add({
                    targets: coin,
                    scale: 0.5,
                    y: coin.y - 30,
                    duration: 500,
                    ease: 'Power1',
                    onComplete: () => { 
                        this.coin_vfx.emitParticleAt(coin.x, coin.y); 
                        coin.destroy(); }
                });
                this.coinsCollected++;
            }

        });

        
        // moving platform collision handler (used for update())
        this.physics.add.collider(my.sprite.player, this.movingPlatforms, (player, platform) => {
                this.currentPlatform = platform;
        });

        // Coin collision handler
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.coin_vfx.emitParticleAt(obj2.x, obj2.y);
            this.coinsCollected++;
            obj2.destroy();
        });

        // Spike collision handler
        this.physics.add.overlap(my.sprite.player, this.spikeGroup, (obj1, obj2) => {
            this.gameOver();
            // console.log("you died!");
            // my.sprite.player.setActive(false);

        });
        

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.physics.world.createDebugGraphic();
        this.physics.world.drawDebug = false;

        // Optional: toggle with 'D' key
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;

            // Only clear if the graphic exists
            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.clear();
            }
        });
        // TODO: Add movement vfx here
        

        // Simple camera to follow player
        this.cameras.main.setBounds(0, 0, 2440, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        
        this.physics.world.setBounds(0, 0, 2440, this.map.heightInPixels);
        
        this.animatedTiles.init(this.map);
        // this.animatedTiles.activateLayer(this.groundLayer);
        // this.animatedTiles.activateLayer(this.backgroundLayer);

    }

    update() {
        // console.log("Player", my.sprite.player.x, my.sprite.player.y);

        const playerTileX = Math.floor(my.sprite.player.body.x / this.map.tileWidth);
        const playerTileY = Math.floor(my.sprite.player.body.y / this.map.tileHeight);

        const tile = this.groundLayer.getTileAt(playerTileX, playerTileY);

        if (tile && tile.properties.water) {
            // console.log("Player is on a water tile!");
            // slow movement
            // bubble effect
            this.gameOver();
            // my.sprite.player/*.setActive(false)*/.setVisible(false);
            // youDied();
            return;
        }

        // player move w platform
        let standingOn = null;

        this.movingPlatforms.getChildren().forEach(platform => {
            const player = my.sprite.player;

            // Manual check for player standing on top
            const touchingFromAbove =
                player.body.bottom <= platform.body.top + 5 &&  // close to top
                player.body.velocity.y >= 0 &&                  // falling or stationary
                Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), platform.getBounds());

            if (touchingFromAbove) {
                standingOn = platform;
            }

            // Update delta for next frame
            platform.deltaX = platform.x - (platform.prevX || platform.x);
            platform.prevX = platform.x;
        });

        if (standingOn) {
            my.sprite.player.x += standingOn.deltaX || 0;
        }



        if (my.sprite.player.body.velocity.x > this.MAX_SPEED) {
            my.sprite.player.setVelocityX(this.MAX_SPEED);
        } else if (my.sprite.player.body.velocity.x < -this.MAX_SPEED) {
            my.sprite.player.setVelocityX(-this.MAX_SPEED);
        }


        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');

        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }

    gameOver() {

        // Show game over text
        /*
        const gameOverText = this.add.bitmapText(400, 250, 'font', 'GAME OVER', 50)
            .setOrigin(0.5);
        const restartText = this.add.bitmapText(400, 320, 'font', 'Press R to Restart', 30)
            .setOrigin(0.5);
        */

        // Death Animation
        

        // Stop player movement
        my.sprite.player.setVelocityX(0);
        my.sprite.player.setVelocityY(0);        
        my.sprite.player.setActive(false).setVisible(false);
        // my.sprite.player.destroy();

        // Wait for R key to restart
        //this.input.keyboard.once('keydown-R', () => {
            this.scene.restart("platformerScene");
        //});
        return;
    }
}