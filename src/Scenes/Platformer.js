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

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("TileMap", "kenny_tilemap_packed");
        this.tilesetIndustrial = this.map.addTilesetImage("TileMapIndustrial", "kenny_tilemap_packed_industrial");
        this.tilesetFarm = this.map.addTilesetImage("TileMapFarm", "kenny_tilemap_packed_farm");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", [this.tileset, this.tilesetIndustrial, this.tilesetFarm], 0, 0);
        this.backgroundLayer = this.map.createLayer("Plants-n-Stuff", [this.tileset, this.tilesetIndustrial, this.tilesetFarm], 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });        
        this.backgroundLayer.setCollisionByProperty({
            collides: true
        });

        // Create coins from Objects layer in tilemap
        
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


        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.spikes, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.spikeGroup = this.add.group(this.spikes);

        // Find water tiles
        this.waterTiles = this.groundLayer.filterTiles(tile => {
            return tile.properties.water == true;
        });
        
        
        this.water_vfx = this.add.particles(0, 0, 'kenny-particles', {
            frame: ['circle_01.png', 'circle_02.png', 'circle_03.png', 'circle_04.png'],
            duration: {min: 1000, max: 2000},
            quantity: 1,
            scale: { start: 0, end: .025 },
            speedX: {min: -25, max: 25},
            speedY: {min: -10, max: -25},
            lifespan: { min: 250, max: 1000 },
            tint: 0x66ccff,
            angle: { min: -10, max: 10 },
        });
        




        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        /*
        this.physics.add.overlap(my.sprite.player, this.waterTiles, (obj1, obj2) => {
            console.log("HIT WATER!");

        });*/
        
        this.coin_vfx = this.add.particles(0, 0, 'kenny-particles', {
            frame: "circle_02.png",
            duration: 100,
            quantity: 5,
            scale: { start: 0, end: .03 },
            speed: 25,
            tint:[0xffd700],
            lifespan: { min: 100, max: 250}

        }); 

        this.coin_vfx.stop();

        // Coin collision handler
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.coin_vfx.emitParticleAt(obj2.x, obj2.y);
            obj2.destroy();
            // this.coin_vfx.start();
        });

        // Spike collision handler
        this.physics.add.overlap(my.sprite.player, this.spikeGroup, (obj1, obj2) => {
            // gameOver();
            console.log("you died!");
            my.sprite.player.setActive(false);

        });
        

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        

        // Simple camera to follow player
        this.cameras.main.setBounds(0, 0, 2440, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        
        this.physics.world.setBounds(0, 0, 2440, this.map.heightInPixels);

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
            /*
            if (my.sprite.player.x > 174 && my.sprite.player.x < 258 && my.sprite.player.y > 400) {
                this.water_vfx.setPosition(my.sprite.player.x + 10, my.sprite.player.y +10);
                this.water_vfx.start();
            }
            else {
                this.water_vfx.stop();
            }
                */

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            /*
            if (my.sprite.player.x > 173 && my.sprite.player.x < 258.5 && my.sprite.player.y > 395) {
                this.water_vfx.setPosition(my.sprite.player.x - 10, my.sprite.player.y+10);
                this.water_vfx.start();
            }
            else {
                this.water_vfx.stop();
            }
                */

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            // this.water_vfx.stop();
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


        // Wait for R key to restart
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart("platformerScene");
        });
        return;
    }
}