// main.js - Phaser 3 runner with more visually interesting shapes
// - Colorful road, dashed lane lines, a bright player rectangle, and colored obstacles
// - No images at all, so you can confirm everything purely with shape-based rendering.

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

// Lane data
let lanes = [60, 180, 300]; // We'll adjust the lane centers to fit the new road layout
let currentLane = 1;

// Player
let player;
let gameOver = false;

// Obstacles
let obstacles;
let obstacleSpeed = 200;
let spawnTimer = 0;
let spawnInterval = 1200;

// Score
let score = 0;
let scoreText, gameOverText;

// Lane line dashes
let laneDashes = [];

// Swipe
let startX, startY, endX, endY;
const SWIPE_THRESHOLD = 50;

function preload() {
  // No external images or audio
}

function create() {
  // 1) ROAD BACKGROUND
  // We'll create a large "road" rectangle using Phaser Graphics for a bit more color control
  let roadGraphics = this.add.graphics();
  roadGraphics.fillStyle(0x333333, 1); // dark gray
  // Draw a rectangle from (0,0) to (360,640)
  roadGraphics.fillRect(0, 0, 360, 640);

  // 2) LANE LINES (DASHED)
  // We'll create two vertical sets of dashes to separate the 3 lanes:
  // Lane boundaries: x=120, x=240
  // We'll store them in an array so we can move them in update()
  createLaneDashes(this, 120);
  createLaneDashes(this, 240);

  // 3) PLAYER (bright red rectangle)
  // We'll place a rectangle for the player at the middle lane near the bottom
  player = this.add.rectangle(lanes[currentLane], 550, 40, 40, 0xff2e2e);
  // Add physics so we can use overlap with obstacles
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);

  // 4) OBSTACLES GROUP
  obstacles = this.physics.add.group();
  this.physics.add.overlap(player, obstacles, handleCollision, null, this);

  // 5) SCORE UI (DOM elements)
  scoreText = document.createElement('div');
  scoreText.id = 'scoreText';
  scoreText.innerText = 'Score: 0';
  document.getElementById('gameContainer').appendChild(scoreText);

  // 6) GAME OVER TEXT (DOM)
  gameOverText = document.createElement('div');
  gameOverText.id = 'gameOverText';
  gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
  document.getElementById('gameContainer').appendChild(gameOverText);

  // 7) INPUT (SWIPE)
  this.input.on('pointerdown', (pointer) => {
    startX = pointer.x;
    startY = pointer.y;
  });
  this.input.on('pointerup', (pointer) => {
    endX = pointer.x;
    endY = pointer.y;
    handleSwipe(this);

    if (gameOver) {
      restartGame();
    }
  });
}

// Creates a series of rectangular "dashes" in a vertical line at the given x-position
function createLaneDashes(scene, xPos) {
  // We'll create dashes spaced out along the Y axis
  // Each dash is 6px wide, 30px tall, spaced 50px apart
  for (let i = 0; i < 800; i += 50) {
    let dashRect = scene.add.rectangle(xPos, i, 6, 30, 0xffffff);
    laneDashes.push(dashRect);
  }
}

function update(time, delta) {
  if (gameOver) return;

  // 1) MOVE LANE DASHES DOWN
  // We'll move them at a rate that looks like the road is scrolling
  laneDashes.forEach(dash => {
    dash.y += 0.5;
    // If a dash goes off the bottom, move it back up to the top
    if (dash.y > 640) {
      dash.y -= 640;
    }
  });

  // 2) SPAWN OBSTACLES
  spawnTimer += delta;
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle(this);
  }

  // 3) MOVE OBSTACLES
  obstacles.children.each(obs => {
    obs.y += obstacleSpeed * (delta / 1000);
    if (obs.y > 700) {
      obs.destroy();
    }
  });

  // 4) INCREMENT SCORE
  score += delta * 0.01;
  scoreText.innerText = 'Score: ' + Math.floor(score);
}

// Creates a random colored obstacle at a random lane top
function spawnObstacle(scene) {
  let laneIndex = Phaser.Math.Between(0, lanes.length - 1);
  let xPos = lanes[laneIndex];

  // Obstacle will be a 40×40 rectangle
  // We'll give it a random color for variety
  let randomColor = Phaser.Display.Color.RandomRGB().color; // e.g., 0xabcdef
  let obsRect = scene.add.rectangle(xPos, -20, 40, 40, randomColor);
  scene.physics.add.existing(obsRect);
  obstacles.add(obsRect);
}

function handleCollision() {
  gameOver = true;
  gameOverText.style.display = 'block';
}

function handleSwipe(scene) {
  let distX = endX - startX;
  let distY = endY - startY;

  // If horizontal swipe is bigger than vertical
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
  gameOver = false;
  gameOverText.style.display = 'none';
  score = 0;

  // Reset player to middle lane
  currentLane = 1;
  player.x = lanes[currentLane];

  // Clear old obstacles
  obstacles.clear(true, true);
}
