// main.js - Phaser 3 runner with ONLY shapes (no images)
// This should display a simple colored background, a red player rectangle,
// and blue obstacle rectangles. No external assets needed.

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

// Lanes (x positions) for the player and obstacles
let lanes = [90, 180, 270];
let currentLane = 1;

// Player and obstacles
let player;
let obstacles;
let obstacleSpeed = 200;
let spawnTimer = 0;
let spawnInterval = 1200;
let gameOver = false;

// Score
let score = 0;
let scoreText;
let gameOverText;

// Swipe variables
let startX, startY, endX, endY;
const SWIPE_THRESHOLD = 50;

function preload() {
  // No images or audio to load
}

function create() {
  // 1) A simple background rectangle for "road"
  // Instead of a tileSprite or image, just a big gray rectangle
  let bg = this.add.rectangle(0, 0, 360, 640, 0x444444);
  bg.setOrigin(0);

  // 2) Player (red rectangle)
  // We'll create a graphics-based rectangle using Arcade Physics
  // By default, shapes in Phaser are not physics objects, so we can create
  // them + a physics body separately OR use a container.
  player = this.add.rectangle(lanes[currentLane], 550, 50, 50, 0xff0000);
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);

  // 3) Group for obstacles
  obstacles = this.add.group();

  // 4) Overlap for collisions
  // Because obstacles will be shapes, we must also give them physics bodies
  // at spawn time to detect overlap.
  this.physics.add.overlap(player, obstacles, handleCollision, null, this);

  // 5) Basic "score" text (using DOM, to avoid any fonts load)
  scoreText = document.createElement('div');
  scoreText.style.position = 'absolute';
  scoreText.style.top = '10px';
  scoreText.style.left = '10px';
  scoreText.style.color = '#fff';
  scoreText.innerHTML = 'Score: 0';
  document.getElementById('gameContainer').appendChild(scoreText);

  // 6) Game Over text
  gameOverText = document.createElement('div');
  gameOverText.style.position = 'absolute';
  gameOverText.style.top = '50%';
  gameOverText.style.left = '50%';
  gameOverText.style.transform = 'translate(-50%, -50%)';
  gameOverText.style.fontSize = '24px';
  gameOverText.style.fontWeight = 'bold';
  gameOverText.style.color = '#fff';
  gameOverText.style.display = 'none';
  gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
  document.getElementById('gameContainer').appendChild(gameOverText);

  // 7) Swipe Input
  this.input.on('pointerdown', (pointer) => {
    startX = pointer.x;
    startY = pointer.y;
  });

  this.input.on('pointerup', (pointer) => {
    endX = pointer.x;
    endY = pointer.y;
    handleSwipe.call(this);

    // Tap to restart if game over
    if (gameOver) {
      restartGame.call(this);
    }
  });
}

function update(time, delta) {
  if (gameOver) return;

  // Spawn obstacles on a timer
  spawnTimer += delta;
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle.call(this);
  }

  // Move obstacles down
  obstacles.children.each((obs) => {
    obs.y += obstacleSpeed * (delta / 1000);
    // If it goes off-screen
    if (obs.y > 700) {
      // Remove from scene
      obs.destroy();
    }
  });

  // Increase score
  score += delta * 0.01;
  scoreText.innerHTML = 'Score: ' + Math.floor(score);
}

// Create a new obstacle (blue rectangle)
function spawnObstacle() {
  // Random lane
  let laneIndex = Phaser.Math.Between(0, lanes.length - 1);
  let xPos = lanes[laneIndex];

  // Create a rectangle
  let obstacleRect = this.add.rectangle(xPos, -25, 50, 50, 0x0000ff);
  // Add a physics body
  this.physics.add.existing(obstacleRect);

  // Add it to the group
  obstacles.add(obstacleRect);
}

function handleCollision() {
  gameOver = true;
  gameOverText.style.display = 'block';
}

// Swipe logic
function handleSwipe() {
  let distX = endX - startX;
  let distY = endY - startY;

  if (Math.abs(distX) > Math.abs(distY)) {
    // Left
    if (distX < -SWIPE_THRESHOLD && currentLane > 0) {
      currentLane--;
      player.x = lanes[currentLane];
    }
    // Right
    else if (distX > SWIPE_THRESHOLD && currentLane < lanes.length - 1) {
      currentLane++;
      player.x = lanes[currentLane];
    }
  }
}

function restartGame() {
  score = 0;
  currentLane = 1;
  player.x = lanes[currentLane];
  obstacles.clear(true, true);
  gameOver = false;
  gameOverText.style.display = 'none';
}
