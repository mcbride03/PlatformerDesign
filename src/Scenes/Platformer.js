class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

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
        this.died = 0;


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

        // Create coins from Objects layer in tilemap
        this.winTiles = this.map.createFromObjects("Objects", {
            name: "win",
            key: "tilemap_sheet_industrial",
            frame: 18
        });    
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
        this.physics.world.enable(this.winTiles, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.winGroup = this.add.group(this.winTiles);
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
                        coin.destroy(); 
                        this.sound.play('sfx_hitCoin', {
                        volume: 0.5
                        });
                        this.coinsCollected++;
                    }
                });
                this.sound.play('sfx_hitBox', {
                    volume: 0.5
                });
            }
        });

        this.physics.add.collider(my.sprite.player, this.boxGroup, (obj1, obj2) => {
            // Box breaks!
            if (obj1.y > obj2.y + 16) {
                this.box_vfx.emitParticleAt(obj2.x, obj2.y);
                obj2.destroy();
                this.sound.play('sfx_hitBox', {
                    volume: 0.5
                });
            }
        });
                
        // moving platform collision handler (used for update())
        this.physics.add.collider(my.sprite.player, this.movingPlatforms, (player, platform) => {
            this.currentPlatform = platform;
        });
        this.physics.add.collider(my.sprite.player, this.winGroup, (player, tile) => {
            this.gameOver('YOU WIN!');
        });

        // Coin collision handler
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.coin_vfx.emitParticleAt(obj2.x, obj2.y);
            this.coinsCollected++;
            obj2.destroy();
            this.sound.play('sfx_hitCoin', {
                volume: 0.5
            });
        });

        // Spike collision handler
        this.physics.add.overlap(my.sprite.player, this.spikeGroup, (obj1, obj2) => {
            this.sound.play('sfx_hitSpike');
            this.gameOver('YOU DIED!');
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
        this.movement_vfx = this.add.particles(0, 0, 'kenny-particles', {
            frame: ['dirt_01.png'],
            duration: {min: 500, max: 750},
            quantity: 1,
            scale: { start: 0.02, end: 0 },
            speedY: {min: -10, max: -15},
            lifespan: { min: 250, max: 500 },
            angle: { min: -10, max: 10 },
        });
        this.movement_vfx.stop();

        this.jump_vfx = this.add.particles(0, 0, 'kenny-particles', {
            frame: ['smoke_03.png'],
            duration: {min: 500, max: 750},
            quantity: 1,
            scale: { start: 0, end: 0.1 },
            // speedY: {min: -10, max: -15},
            lifespan: { min: 250, max: 500 },
            // angle: { min: -10, max: 10 },
        });
        this.jump_vfx.stop();
        

        // Simple camera to follow player
        this.cameras.main.setBounds(0, 0, 2440, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        
        this.physics.world.setBounds(0, 0, 2440, this.map.heightInPixels);
        
        this.animatedTiles.init(this.map);

    }

    update() {
        const player = my.sprite.player;

        // get properties of tile that player is on
        const playerTileX = Math.floor(my.sprite.player.body.x / this.map.tileWidth);
        const playerTileY = Math.floor(my.sprite.player.body.y / this.map.tileHeight);
        const tile = this.groundLayer.getTileAt(playerTileX, playerTileY);

        // if player on water tile
        if (tile && tile.properties.water) {
            this.gameOver('YOU DIED');
            return;
        }

        // platform that the player is standing on
        // null at all moments other than when on platform
        let standingOn = null;

        this.movingPlatforms.getChildren().forEach(platform => {

            // Manual check for player standing on top
            const touchingFromAbove =
                player.body.bottom <= platform.body.top + 5 &&  // close to top
                player.body.velocity.y >= 0 &&                  // falling or stationary
                Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), platform.getBounds());
            
            // update standing on platform if player is on top
            if (touchingFromAbove) {
                standingOn = platform;
            }

            // Update delta for next frame
            platform.deltaX = platform.x - (platform.prevX || platform.x);
            platform.prevX = platform.x;
        });

        // if standingOn exists/ if player is on moving platform
        if (standingOn) {
            my.sprite.player.x += standingOn.deltaX || 0;   // add velocity of platform to player velocity
        }


        // player reaching max speed
        if (my.sprite.player.body.velocity.x > this.MAX_SPEED) {
            my.sprite.player.setVelocityX(this.MAX_SPEED);
        } else if (my.sprite.player.body.velocity.x < -this.MAX_SPEED) {
            my.sprite.player.setVelocityX(-this.MAX_SPEED);
        }

        const isRunning = cursors.left.isDown || cursors.right.isDown;
        const isOnGround = player.body.blocked.down;

        if (isRunning && isOnGround) {
            // Emit at player's feet
            this.movement_vfx.emitParticleAt(player.x, player.y + player.displayHeight / 2);
        } else {
            this.movement_vfx.stop();
        }
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

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
            // TODO: add jump particle code
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play('sfx_jump', {
            volume: 0.5,
            });
            this.jump_vfx.emitParticleAt(player.x, player.y + player.displayHeight / 2);

        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }

    gameOver(message) {
        // Stop player movement and disable physics
        this.died++;
        this.physics.world.pause(); // Pause all physics activity
        my.sprite.player.setVelocity(0);
        my.sprite.player.body.enable = false; // Disable player's physics body
        my.sprite.player.setActive(false);

        // Stop camera from following the player
        this.cameras.main.stopFollow();
        if (this.died < 2) {
            this.sound.play('sfx_gameOver', {
                volume: 0.5
            });
        }
        this.time.delayedCall(500, () => {
            // Get camera center
            const centerX = this.cameras.main.scrollX + this.cameras.main.width / 2;
            const centerY = this.cameras.main.scrollY + this.cameras.main.height / 2;

            this.BG_GameOver = this.add.image(centerX, centerY, 'gameOver_background');
            // Game over message
            const gameOverText = this.add.bitmapText(centerX, centerY - 40, 'font', message, 50)
                .setOrigin(0.5);

            // Restart message
            const restartText = this.add.bitmapText(centerX, centerY + 20, 'font', 'Press R to Restart', 30)
                .setOrigin(0.5);
        });

        // Wait for R key to restart
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart("platformerScene");
        });
        return;
    }
}