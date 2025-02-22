// main.js - Latif Runner referencing local images

const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: 'gameContainer',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [MainScene] // We define the scene below
};

let game = new Phaser.Game(config);

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // -- ROAD TILE (Scrolling Background) --
    // Replace "road_tile.png" with your file’s exact name if it differs
    this.load.image('road', 'assets/road_tile.png');

    // -- CAR SPRITE OR SPRITESHEET --
    // If your car image is just a single frame (like green_car.png), use:
    // this.load.image('car', 'assets/green_car.png');
    //
    // If you have a multi-frame car_spritesheet.png (like the one with 16 frames),
    // then use:
    this.load.spritesheet('car', 'assets/car_spritesheet.png', {
      frameWidth: 64,   // adjust to match each frame
      frameHeight: 64   // adjust to match each frame
    });

    // -- OBSTACLES (Traffic Cone, Other Cars) --
    this.load.image('obstacle_cone', 'assets/obstacle_cone.png');
    this.load.image('obstacle_car1', 'assets/obstacle_car1.png');
    this.load.image('obstacle_car2', 'assets/obstacle_car2.png');

    // -- SPARK EFFECT (For collision particles) --
    this.load.image('spark', 'assets/spark.png');

    // (Optional) AUDIO FILES
    // e.g. this.load.audio('bgm', 'assets/bgm.ogg');
    // e.g. this.load.audio('crash', 'assets/crash.wav');
  }

  create() {
    // -- BASIC STATE / SETTINGS --
    this.lanes = [90, 180, 270];
    this.currentLane = 1;
    this.score = 0;
    this.gameOver = false;

    // -- SCROLLING ROAD --
    this.road = this.add.tileSprite(0, 0, 360, 640, 'road');
    this.road.setOrigin(0);

    // If using a spritesheet for the car with multiple frames:
    // (Adjust frame range as needed for the actual # of frames)
    this.anims.create({
      key: 'drive',
      frames: this.anims.generateFrameNumbers('car', { start: 0, end: 1 }),
      frameRate: 8,
      repeat: -1
    });

    // -- PLAYER CAR --
    this.player = this.physics.add.sprite(this.lanes[this.currentLane], 550, 'car');
    this.player.setCollideWorldBounds(true);

    // If you have an animation, play it:
    this.player.play('drive');

    // -- OBSTACLES GROUP --
    this.obstacles = this.physics.add.group();

    // Overlap collision
    this.physics.add.overlap(this.player, this.obstacles, this.handleCollision, null, this);

    // -- SPARK PARTICLE EMITTER --
    this.sparkParticles = this.add.particles('spark');
    this.sparkEmitter = this.sparkParticles.createEmitter({
      x: -100,
      y: -100,
      speed: 100,
      scale: { start: 0.4, end: 0 },
      lifespan: 400,
      blendMode: 'ADD',
      quantity: 10,
      on: false
    });

    // -- DOM ELEMENTS (Score & Game Over) --
    this.scoreText = document.createElement('div');
    this.scoreText.id = 'scoreText';
    this.scoreText.innerHTML = 'Score: 0';
    document.getElementById('gameContainer').appendChild(this.scoreText);

    this.gameOverText = document.createElement('div');
    this.gameOverText.id = 'gameOverText';
    this.gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
    document.getElementById('gameContainer').appendChild(this.gameOverText);

    // -- SWIPE INPUT --
    this.input.on('pointerdown', (pointer) => {
      this.startX = pointer.x;
      this.startY = pointer.y;
    });

    this.input.on('pointerup', (pointer) => {
      this.endX = pointer.x;
      this.endY = pointer.y;
      this.handleSwipe();
      if (this.gameOver) this.restartGame();
    });

    // -- OBSTACLE TIMING --
    this.obstacleSpeed = 250;
    this.spawnTimer = 0;
    this.spawnInterval = 1200;

    // (Optional) Audio:
    // this.bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    // this.crashSound = this.sound.add('crash', { volume: 0.5 });
    // this.bgm.play();
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Scroll road
    this.road.tilePositionY += 0.5;

    // Spawn obstacles on a timer
    this.spawnTimer += delta;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
    }

    // Move obstacles downward
    this.obstacles.children.iterate((obs) => {
      obs.y += this.obstacleSpeed * (delta / 1000);
      if (obs.y > 700) obs.destroy();
    });

    // Increase score
    this.score += delta * 0.01;
    this.scoreText.innerHTML = 'Score: ' + Math.floor(this.score);
  }

  // Spawn random obstacle type
  spawnObstacle() {
    const obstacleTypes = ['obstacle_cone', 'obstacle_car1', 'obstacle_car2'];
    const chosen = Phaser.Utils.Array.GetRandom(obstacleTypes);

    const laneIndex = Phaser.Math.Between(0, this.lanes.length - 1);
    const xPos = this.lanes[laneIndex];

    const obstacle = this.physics.add.sprite(xPos, -50, chosen);
    this.obstacles.add(obstacle);
  }

  // Collision handler
  handleCollision(player, obstacle) {
    // Spark burst
    this.sparkEmitter.setPosition(player.x, player.y);
    this.sparkEmitter.explode(20);

    // (Optional) crash sound
    // this.crashSound.play();

    this.gameOver = true;
    this.gameOverText.style.display = 'block';
    this.player.setTint(0xff0000);

    // (Optional) stop background music
    // this.bgm.stop();
  }

  // Swipe logic
  handleSwipe() {
    const distX = this.endX - this.startX;
    const distY = this.endY - this.startY;
    const SWIPE_THRESHOLD = 50;

    // Horizontal swipe only
    if (Math.abs(distX) > Math.abs(distY)) {
      if (distX < -SWIPE_THRESHOLD && this.currentLane > 0) {
        this.currentLane--;
        this.player.x = this.lanes[this.currentLane];
      } else if (distX > SWIPE_THRESHOLD && this.currentLane < this.lanes.length - 1) {
        this.currentLane++;
        this.player.x = this.lanes[this.currentLane];
      }
    }
  }

  // Restart
  restartGame() {
    this.gameOver = false;
    this.gameOverText.style.display = 'none';
    this.score = 0;

    this.currentLane = 1;
    this.player.x = this.lanes[this.currentLane];
    this.player.clearTint();

    this.obstacles.clear(true, true);

    // (Optional) this.bgm.play();
  }
}
