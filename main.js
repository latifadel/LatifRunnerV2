// main.js - Latif Runner
// Updated with a scrolling background and refined styling.

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

// Game variables
let player;
let lanes = [90, 180, 270]; // X positions for 3 lanes
let currentLane = 1;        // Start in the middle lane
let obstacles;
let obstacleSpeed = 250;
let spawnTimer = 0;
let spawnInterval = 1200;   // Milliseconds
let score = 0;
let scoreText;
let gameOverText;
let gameOver = false;

// Variables for swipe detection
let startX, startY, endX, endY;
const SWIPE_THRESHOLD = 50;

// Scrolling background
let bg;

function preload() {
  // Load images/sprites (placeholder rectangles + background)
  this.load.image('player', 'https://via.placeholder.com/50/ff0000/ffffff?text=P');
  this.load.image('obstacle', 'https://via.placeholder.com/50/0000ff/ffffff?text=O');
  
  // A simple gradient background placeholder (feel free to change with your own)
  // This is a small gradient image repeated as a tileSprite
  this.load.image('bg', 'https://via.placeholder.com/360x640/333333/ffffff?text=+');
}

function create() {
  // Create a scrolling background tile sprite
  bg = this.add.tileSprite(0, 0, config.width, config.height, 'bg');
  bg.setOrigin(0);

  // Player
  player = this.physics.add.sprite(lanes[currentLane], 550, 'player');
  player.setCollideWorldBounds(true);

  // Group for obstacles
  obstacles = this.physics.add.group();

  // Score (DOM Element overlay)
  scoreText = document.createElement('div');
  scoreText.id = 'scoreText';
  scoreText.innerHTML = 'Score: 0';
  document.getElementById('gameContainer').appendChild(scoreText);

  // Game Over Text (DOM Element overlay)
  gameOverText = document.createElement('div');
  gameOverText.id = 'gameOverText';
  gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
  document.getElementById('gameContainer').appendChild(gameOverText);

  // Collision detection
  this.physics.add.overlap(player, obstacles, handleGameOver, null, this);

  // Pointer input events for swiping
  this.input.on('pointerdown', (pointer) => {
    startX = pointer.x;
    startY = pointer.y;
  });

  this.input.on('pointerup', (pointer) => {
    endX = pointer.x;
    endY = pointer.y;
    handleSwipe(this);

    // Also handle tap-to-restart if the game is over
    if (gameOver) {
      restartGame(this);
    }
  });
}

function update(time, delta) {
  if (gameOver) return;

  // Scroll the background downward to create a sense of movement
  bg.tilePositionY += 0.5;

  // Spawn obstacles on a timer
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

  // If horizontal swipe is greater than vertical swipe
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
  // Randomly choose a lane
  let laneIndex = Phaser.Math.Between(0, lanes.length - 1);
  let xPos = lanes[laneIndex];
  
  // Obstacle at top of the screen
  let obstacle = scene.physics.add.sprite(xPos, -50, 'obstacle');
  obstacles.add(obstacle);
}

function handleGameOver() {
  gameOver = true;
  gameOverText.style.display = 'block';
}

function restartGame(scene) {
  // Reset values
  score = 0;
  currentLane = 1;
  player.x = lanes[currentLane];
  obstacles.clear(true, true);
  gameOver = false;
  gameOverText.style.display = 'none';
}
