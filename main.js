// main.js - Single file with all game logic
// Basic endless runner with 3-lane swipe controls.

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

function preload() {
  // Load any images or sprites here (Placeholder rectangles)
  this.load.image('player', 'https://via.placeholder.com/50/ff0000/ffffff?text=P'); 
  this.load.image('obstacle', 'https://via.placeholder.com/50/0000ff/ffffff?text=O');
}

let player;
let lanes = [90, 180, 270]; // X positions for 3 lanes
let currentLane = 1;        // Start in the middle lane
let obstacles;
let obstacleSpeed = 200;
let spawnTimer = 0;
let spawnInterval = 1500;   // Milliseconds
let score = 0;
let scoreText;
let gameOverText;
let gameOver = false;

// Variables for swipe detection
let startX, startY, endX, endY;
const SWIPE_THRESHOLD = 50;

function create() {
  // Player
  player = this.physics.add.sprite(lanes[currentLane], 550, 'player');
  player.setCollideWorldBounds(true);

  // Group for obstacles
  obstacles = this.physics.add.group();

  // Score
  scoreText = document.createElement('div');
  scoreText.id = 'scoreText';
  scoreText.innerHTML = 'Score: 0';
  document.getElementById('gameContainer').appendChild(scoreText);

  // Game Over Text
  gameOverText = document.createElement('div');
  gameOverText.id = 'gameOverText';
  gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
  document.getElementById('gameContainer').appendChild(gameOverText);

  // Collision detection
  this.physics.add.overlap(player, obstacles, handleGameOver, null, this);

  // Input events for swiping
  this.input.on('pointerdown', (pointer) => {
    startX = pointer.x;
    startY = pointer.y;
  });

  this.input.on('pointerup', (pointer) => {
    endX = pointer.x;
    endY = pointer.y;
    handleSwipe(this);
  });

  // Tap to restart
  this.input.on('pointerup', () => {
    if(gameOver) {
      restartGame(this);
    }
  });
}

function update(time, delta) {
  if(gameOver) return;

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
  if(Math.abs(distX) > Math.abs(distY)) {
    // Swipe left
    if(distX < -SWIPE_THRESHOLD && currentLane > 0) {
      currentLane--;
      player.x = lanes[currentLane];
    }
    // Swipe right
    else if(distX > SWIPE_THRESHOLD && currentLane < lanes.length - 1) {
      currentLane++;
      player.x = lanes[currentLane];
    }
  }
  // If vertical swipe is used, you can add jump logic or ignore it.
  // For now, no vertical move.
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

