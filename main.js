// main.js - Latif Runner with local assets

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
  scene: [MainScene]
};

let game = new Phaser.Game(config);

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // Load local assets from your "assets" folder
    // Road tile background
    this.load.image('road', 'assets/road_tile.png');

    // Car spritesheet (if you have multiple frames)
    // Adjust frameWidth & frameHeight to match car_spritesheet.png
    this.load.spritesheet('car', 'assets/car_spritesheet.png', {
      frameWidth: 64,
      frameHeight: 128
    });

    // Different obstacles
    this.load.image('obstacle_cone', 'assets/obstacle_cone.png');
    this.load.image('obstacle_car1', 'assets/obstacle_car1.png');
    this.load.image('obstacle_car2', 'assets/obstacle_car2.png');

    // Spark image for collision particle effect
    this.load.image('spark', 'assets/spark.png');

    // Audio (music & SFX)
    this.load.audio('bgm', 'assets/bgm.ogg');
    this.load.audio('crash', 'assets/crash.wav');
  }

  create() {
    // Lanes and initial state
    this.lanes = [90, 180, 270];
    this.currentLane = 1;
    this.score = 0;
    this.gameOver = false;

    // Scrolling background
    this.road = this.add.tileSprite(0, 0, 360, 640, 'road');
    this.road.setOrigin(0);

    // Create an animation from the car spritesheet
    // Adjust frames if you have more or fewer frames
    this.anims.create({
      key: 'drive',
      frames: this.anims.generateFrameNumbers('car', { start: 0, end: 1 }),
      frameRate: 8,
      repeat: -1
    });

    // Player car
    this.player = this.physics.add.sprite(this.lanes[this.currentLane], 550, 'car');
    this.player.setCollideWorldBounds(true);
    this.player.play('drive'); // Play the 'drive' animation

    // Obstacle group
    this.obstacles = this.physics.add.group();

    // Overlap collision
    this.physics.add.overlap(this.player, this.obstacles, this.handleCollision, null, this);

    // Spark particle emitter (collision effect)
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

    // DOM Elements for UI
    this.scoreText = document.createElement('div');
    this.scoreText.id = 'scoreText';
    this.scoreText.innerHTML = 'Score: 0';
    document.getElementById('gameContainer').appendChild(this.scoreText);

    this.gameOverText = document.createElement('div');
    this.gameOverText.id = 'gameOverText';
    this.gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
    document.getElementById('gameContainer').appendChild(this.gameOverText);

    // Input (pointer) for swiping
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

    // Spawn logic
    this.obstacleSpeed = 250;
    this.spawnTimer = 0;
    this.spawnInterval = 1200;

    // Play audio
    this.bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    this.bgm.play();

    this.crashSound = this.sound.add('crash', { volume: 0.5 });
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Scroll road background
    this.road.tilePositionY += 0.5;

    // Spawn obstacles on timer
    this.spawnTimer += delta;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
    }

    // Move obstacles
    this.obstacles.children.iterate((obstacle) => {
      obstacle.y += this.obstacleSpeed * (delta / 1000);
      if (obstacle.y > 700) obstacle.destroy();
    });

    // Increase score
    this.score += delta * 0.01;
    this.scoreText.innerHTML = 'Score: ' + Math.floor(this.score);
  }

  spawnObstacle() {
    // Randomly pick from multiple obstacles
    const obstacleTypes = ['obstacle_cone', 'obstacle_car1', 'obstacle_car2'];
    const chosenTexture = Phaser.Utils.Array.GetRandom(obstacleTypes);

    // Random lane
    const laneIndex = Phaser.Math.Between(0, this.lanes.length - 1);
    const xPos = this.lanes[laneIndex];

    const obstacle = this.physics.add.sprite(xPos, -50, chosenTexture);
    this.obstacles.add(obstacle);
  }

  handleCollision(player, obstacle) {
    // Spark effect
    this.sparkEmitter.setPosition(player.x, player.y);
    this.sparkEmitter.explode(20);

    // Crash sound
    this.crashSound.play();

    // Game Over
    this.gameOver = true;
    this.gameOverText.style.display = 'block';
    this.player.setTint(0xff0000);

    // Stop music
    this.bgm.stop();
  }

  handleSwipe() {
    const distX = this.endX - this.startX;
    const distY = this.endY - this.startY;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(distX) > Math.abs(distY)) {
      // Left
      if (distX < -SWIPE_THRESHOLD && this.currentLane > 0) {
        this.currentLane--;
        this.player.x = this.lanes[this.currentLane];
      }
      // Right
      else if (distX > SWIPE_THRESHOLD && this.currentLane < this.lanes.length - 1) {
        this.currentLane++;
        this.player.x = this.lanes[this.currentLane];
      }
    }
  }

  restartGame() {
    // Reset game state
    this.gameOver = false;
    this.gameOverText.style.display = 'none';
    this.score = 0;

    // Reset player
    this.currentLane = 1;
    this.player.x = this.lanes[this.currentLane];
    this.player.clearTint();

    // Clear old obstacles
    this.obstacles.clear(true, true);

    // Restart music
    this.bgm.play();
  }
}
