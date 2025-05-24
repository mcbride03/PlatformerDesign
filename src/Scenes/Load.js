class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {

        this.load.setPath("./assets/kenney_impact-sounds/Audio");
        this.load.audio('sfx_jump','impactPlate_medium_002.ogg');
        this.load.audio('sfx_hitBox','impactPlank_medium_003.ogg');
        this.load.audio('sfx_hitSpike', 'impactMining_004.ogg');

        this.load.setPath('./assets/kenney_music-jingles/audio/8-Bit jingles')
        this.load.audio('sfx_hitCoin','jingles_NES14.ogg');
        this.load.audio('sfx_gameOver', 'jingles_NES11.ogg');

        this.load.setPath("./assets/");
        this.load.image('coin_particle', 'coin_particle.png');
        this.load.image('box_particle', 'boxParticle.png');
        this.load.image('gameOver_background', 'gameOver.png');

        this.load.setPath("./assets/pixel_fonts/fonts");
        this.load.bitmapFont('font', 'round_6x6.png', 'round_6x6.xml');

        this.load.setPath("./assets/");
        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("kenny_tilemap_packed", "tilemap_packed.png");                         // Packed tilemap
        this.load.image("kenny_tilemap_packed_industrial", "tilemap_packed_industrial.png");
        this.load.image("kenny_tilemap_packed_farm", "tilemap_packed_farm.png");
        this.load.image("kenny_tilemap_packed_BG", "tilemap-backgrounds_packed.png");
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   // Tilemap in JSON

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        
        this.load.spritesheet("tilemap_sheet_industrial", "tilemap_packed_industrial.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.spritesheet("tilemap_sheet_farm", "tilemap_packed_farm.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.spritesheet("tilemap_sheet_BG", "tilemap-backgrounds_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        
        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });
        this.anims.create({
            key: 'coinAnim', // Animation key
            frames: this.anims.generateFrameNumbers('tilemap_sheet', 
                {start: 151, end: 152}
            ),
            frameRate: 5,  // Higher is faster
            repeat: -1      // Loop the animation indefinitely
        });        
        this.anims.create({
            key: 'flagAnim', // Animation key
            frames: this.anims.generateFrameNumbers('tilemap_sheet', 
                {start: 151, end: 152}
            ),
            frameRate: 5,  // Higher is faster
            repeat: -1      // Loop the animation indefinitely
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}