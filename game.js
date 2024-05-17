var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    scene: 'flamingo',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },

};

var player;
var burgers;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var pointer;
var isMovingLeft = false;
var isMovingRight = false;
var lastTapTime = 0;
var tapDelay = 200; // Adjust this value to set the maximum delay between taps for a double tap



var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('burger', 'assets/burger.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('overgame', 'assets/gameover.png');
    this.load.image('tryagain', 'assets/button.png');
    this.load.spritesheet('kalas', 'assets/kalas.png', { frameWidth: 40, frameHeight: 60 });
}

function create ()
{
   
    //  A simple background for our game
    this.add.image(400, 300, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(400, 568, 'ground').setScale(2.2).refreshBody();

    //  Now let's create some ledges
    platforms.create(620, 400, 'ground');
    platforms.create(50, 260, 'ground');
    platforms.create(750, 220, 'ground');

    // The player and its settings
    player = this.physics.add.sprite(100, 450, 'kalas');

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('kalas', { start: 0, end: 1 }),
        frameRate: 5,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'kalas', frame: 2 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('kalas', { start: 3, end: 4 }),
        frameRate: 5,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    // Enable touch input
    this.input.addPointer(2); // Enable up to two pointers for multi-touch

    // Set up double tap gesture
    this.input.on('pointerdown', handleTouchStart, this);
    this.input.on('pointerup', handleTouchEnd, this);

    //  Some burgers to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    burgers = this.physics.add.group({
        key: 'burger',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    burgers.children.iterate(function (child) {

        //  Give each burger a slightly different bounce
        child.setBounce(Phaser.Math.FloatBetween(0.5, 0.9));
        child.setCollideWorldBounds(true);
        child.setVelocity(Phaser.Math.Between(-70, 70), 20);

    });

    bombs = this.physics.add.group();

    //  The score
    scoreText = this.add.text(16, 16, 'Score: 0', { font: '25px Aqua', fill: '#fc9a2e' });

    //  Collide the player and the burgers with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(burgers, platforms);
    this.physics.add.collider(bombs, platforms);

    //  Checks to see if the player overlaps with any of the burgers, if he does call the collectburger function
    this.physics.add.overlap(player, burgers, collectburger, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update ()
{
    if (gameOver)
    {
        this.add.image(400, 200, 'overgame');
        this.add.image(400, 400, 'tryagain').setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.restart(gameOver = false) );
        return;
    }

    // Handle player movement
    if (isMovingLeft || cursors.left.isDown) {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    } else if (isMovingRight || cursors.right.isDown) {
        player.setVelocityX(160);

        player.anims.play('right', true);
    } else  {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down)
    {
        jump();
    }
}

function jump() {
    if (player.body.touching.down) {
        player.setVelocityY(-330);
    }
}


function collectburger (player, burger)
{
    burger.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (burgers.countActive(true) === 0)
    {
        //  A new batch of burgers to collect
        burgers.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;

    }
}

function hitBomb (player, bomb)
{
    this.physics.pause();

    player.setTint(0x191919);

    player.anims.play('turn');

    gameOver = true;
}



function handleTouchStart(pointer) {
    if (pointer.x < player.x) {
        isMovingLeft = true;
    } else {
        isMovingRight = true;
    }

    // Check for double tap for jumping
    var currentTime = new Date().getTime();
    if (currentTime - lastTapTime < tapDelay) {
        jump();
        lastTapTime = 0; // Reset lastTapTime to prevent repeated jumps
    } else {
        lastTapTime = currentTime;
    }
}

function handleTouchEnd(pointer) {
    isMovingLeft = false;
    isMovingRight = false;
}