// main.js - Latif Runner with car, road, and improved visuals.

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
    preload: preload,
    create: create,
    update: update
  }
};

let game = new Phaser.Game(config);

// Lanes and general game variables
let lanes = [90, 180, 270];
let currentLane = 1;
let player;
let obstacles;
let obstacleSpeed = 250;
let spawnTimer = 0;
let spawnInterval = 1200;
let score = 0;
let scoreText;
let gameOverText;
let gameOver = false;

// Background tile sprite
let roadBg;

// Variables for swipe detection
let startX, startY, endX, endY;
const SWIPE_THRESHOLD = 50;

function preload() {
  // Load images (placeholders)
  // Replace these with real sprites or textures for better visuals
  // Road texture: repeated tile
  this.load.image('road', 'https://via.placeholder.com/360x640/444444/cccccc?text=Road+Texture');
  // Car sprite
  this.load.image('car', 'https://via.placeholder.com/50/ff0000/ffffff?text=Car');
  // Obstacle (traffic cone or opposing car)
  this.load.image('obstacle', 'https://via.placeholder.com/50/ff9900/ffffff?text=Cone');
}

function create() {
  // Create a tile-sprite to serve as the scrolling road
  roadBg = this.add.tileSprite(0, 0, config.width, config.height, 'road');
  roadBg.setOrigin(0);

  // Player car
  player = this.physics.add.sprite(lanes[currentLane], 550, 'car');
  player.setCollideWorldBounds(true);

  // Group for obstacles
  obstacles = this.physics.add.group();

  // Score text (DOM element)
  scoreText = document.createElement('div');
  scoreText.id = 'scoreText';
  scoreText.innerHTML = 'Score: 0';
  document.getElementById('gameContainer').appendChild(scoreText);

  // Game Over text (DOM element)
  gameOverText = document.createElement('div');
  gameOverText.id = 'gameOverText';
  gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
  document.getElementById('gameContainer').appendChild(gameOverText);

  // Overlap to detect collisions
  this.physics.add.overlap(player, obstacles, handleGameOver, null, this);

  // Swipe input
  this.input.on('pointerdown', (pointer) => {
    startX = pointer.x;
    startY = pointer.y;
  });

  this.input.on('pointerup', (pointer) => {
    endX = pointer.x;
    endY = pointer.y;
    handleSwipe(this);

    // Also handle tap-to-restart if game over
    if (gameOver) {
      restartGame(this);
    }
  });
}

function update(time, delta) {
  if (gameOver) return;

  // Scroll the road texture
  roadBg.tilePositionY += 0.5;

  // Spawn obstacles
  spawnTimer += delta;
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle(this);
  }

  // Increase score over time
  score += delta * 0.01;
  scoreText.innerHTML = 'Score: ' + Math.floor(score);

  // Move obstacles down
  obstacles.children.iterate((obstacle) => {
    if (obstacle) {
      obstacle.y += obstacleSpeed * (delta / 1000);
      if (obstacle.y > 700) {
        obstacle.destroy();
      }
    }
  });
}

function handleSwipe(scene) {
  let distX = endX - startX;
  let distY = endY - startY;
  
  // Check horizontal swipe
  if (Math.abs(distX) > Math.abs(distY)) {
    // Swipe left
    if (distX < -SWIPE_THRESHOLD && currentLane > 0) {
      currentLane--;
      player.x = lanes[currentLane];
    }
    // Swipe right
    else if (distX > SWIPE_THRESHOLD && currentLane < lanes.length - 1) {
      currentLane++;
      player.x = lanes[currentLane];
    }
  }
}

function spawnObstacle(scene) {
  // Randomly pick a lane
  let laneIndex = Phaser.Math.Between(0, lanes.length - 1);
  let xPos = lanes[laneIndex];
  
  // Place obstacle at top
  let obstacle = scene.physics.add.sprite(xPos, -50, 'obstacle');
  obstacles.add(obstacle);
}

function handleGameOver() {
  gameOver = true;
  gameOverText.style.display = 'block';
}

function restartGame(scene) {
  // Reset states
  score = 0;
  currentLane = 1;
  player.x = lanes[currentLane];
  obstacles.clear(true, true);
  gameOver = false;
  gameOverText.style.display = 'none';
}
