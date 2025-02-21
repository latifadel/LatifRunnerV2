/* 
  main.js
  A Subway Surfer–style endless runner with:
  - Animated player
  - Scrolling background
  - Obstacles & coins
  - Swipe controls
  - Score system 
*/

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
  scene: {
    preload,
    create,
    update
  }
};

let game = new Phaser.Game(config);

// Game variables
let background;
let player;
let lanes = [90, 180, 270]; // X positions for 3 lanes
let currentLane = 1;        // Start in the middle
let obstacles;
let coins;
let score = 0;
let scoreText;
let gameOverText;
let gameOver = false;
let spawnTimer = 0;
let spawnInterval = 1200;   // ms
let obstacleSpeed = 240;
let coinSpeed = 240;

// Swipe detection
let startX, startY;
let endX, endY;
const SWIPE_THRESHOLD = 50; // Minimum distance for swipe

function preload() {
  /* 
    Replace these placeholder URLs with your own:
    - 'player_run' is a sprite sheet with frames for running animation
    - 'bg' is a background image that we can tile
    - 'obstacle' and 'coin' are example placeholders
  */
  
  // Background
  this.load.image('bg', 'https://i.imgur.com/INxP3EJ.png');

  // Player running sprite sheet (8 frames horizontally for example)
  this.load.spritesheet('player_run', 
    'https://i.imgur.com/i6p72Rf.png',
    { frameWidth: 48, frameHeight: 48 } 
  );

  // Obstacles / Coins
  this.load.image('obstacle', 'https://i.imgur.com/I1qBc1y.png');
  this.load.image('coin', 'https://i.imgur.com/sJE2fEd.png');
}

function create() {
  // Scrolling background (tile sprite)
  background = this.add.tileSprite(0, 0, config.width, config.height, 'bg');
  background.setOrigin(0, 0); // Top-left corner
  background.setScrollFactor(0); // so it doesn't move with camera

  // Player setup
  player = this.physics.add.sprite(lanes[currentLane], 550, 'player_run');
  player.setCollideWorldBounds(true);
  player.setScale(1.2);

  // Create the running animation from the sprite sheet
  this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 7 }),
    frameRate: 12,
    repeat: -1
  });
  player.play('run');

  // Groups
  obstacles = this.physics.add.group();
  coins = this.physics.add.group();

  // Overlaps
  this.physics.add.overlap(player, obstacles, handleGameOver, null, this);
  this.physics.add.overlap(player, coins, collectCoin, null, this);

  // Score text
  scoreText = document.createElement('div');
  scoreText.id = 'scoreText';
  scoreText.innerHTML = 'Score: 0';
  document.getElementById('gameContainer').appendChild(scoreText);

  // Game Over text
  gameOverText = document.createElement('div');
  gameOverText.id = 'gameOverText';
  gameOverText.innerHTML = 'GAME OVER<br><small>Tap to restart</small>';
  document.getElementById('gameContainer').appendChild(gameOverText);

  // Swipe input
  this.input.on('pointerdown', (pointer) => {
    startX = pointer.x;
    startY = pointer.y;
  });

  this.input.on('pointerup', (pointer) => {
    endX = pointer.x;
    endY = pointer.y;
    handleSwipe();
    if (gameOver) {
      restartGame();
    }
  });
}

function update(time, delta) {
  if (gameOver) return;

  // Scroll background downward to simulate movement
  background.tilePositionY -= 2; // adjust speed as needed

  // Spawn obstacles & coins
  spawnTimer += delta;
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle(this);
    spawnCoin(this); // optional
  }

  // Increase score over time
  score += delta * 0.01; // adjust rate
  scoreText.innerHTML = 'Score: ' + Math.floor(score);

  // Move obstacles and coins downward
  obstacles.children.iterate((obj) => {
    if (obj) {
      obj.y += obstacleSpeed * (delta / 1000);
      if (obj.y > config.height + 100) {
        obj.destroy();
      }
    }
  });
  coins.children.iterate((coin) => {
    if (coin) {
      coin.y += coinSpeed * (delta / 1000);
      if (coin.y > config.height + 50) {
        coin.destroy();
      }
    }
  });
}

// Handle swipe input
function handleSwipe() {
  let distX = endX - startX;
  let distY = endY - startY;

  if (Math.abs(distX) > Math.abs(distY)) {
    // Horizontal swipe
    if (distX < -SWIPE_THRESHOLD && currentLane > 0) {
      // swipe left
      currentLane--;
      player.x = lanes[currentLane];
    } else if (distX > SWIPE_THRESHOLD && currentLane < lanes.length - 1) {
      // swipe right
      currentLane++;
      player.x = lanes[currentLane];
    }
  } else {
    // Vertical swipe (if you want a jump or slide mechanic, handle here)
    if (distY < -SWIPE_THRESHOLD) {
      // swipe up -> jump logic if desired
      // e.g.: player.setVelocityY(-500);
    } else if (distY > SWIPE_THRESHOLD) {
      // swipe down -> slide logic if desired
      // e.g.: crouch mechanic
    }
  }
}

// Spawning obstacles
function spawnObstacle(scene) {
  let laneIndex = Phaser.Math.Between(0, lanes.length - 1);
  let xPos = lanes[laneIndex];
  let obstacle = scene.physics.add.sprite(xPos, -50, 'obstacle');
  obstacle.setScale(1);
  obstacles.add(obstacle);
}

// Spawning coins
function spawnCoin(scene) {
  // 50% chance of a coin spawn
  if (Math.random() < 0.5) {
    let laneIndex = Phaser.Math.Between(0, lanes.length - 1);
    let xPos = lanes[laneIndex];
    let coin = scene.physics.add.sprite(xPos, -150, 'coin');
    coin.setScale(0.7);
    coins.add(coin);
  }
}

// Collect coin
function collectCoin(player, coin) {
  coin.destroy();
  score += 10; // bonus for coin
}

// Game Over
function handleGameOver() {
  gameOver = true;
  gameOverText.style.display = 'block';
}

// Restart
function restartGame() {
  // Reset
  gameOver = false;
  gameOverText.style.display = 'none';
  score = 0;
  currentLane = 1;
  player.x = lanes[currentLane];

  // Clear obstacles & coins
  obstacles.clear(true, true);
  coins.clear(true, true);
}