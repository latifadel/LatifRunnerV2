// main.js - Latif Runner with more decorative shapes, no images needed.

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

// Lanes: We'll center the road in the middle, with 3 lanes.
let lanes = [110, 180, 250];
let currentLane = 1;
let player;
let obstacles;
let obstacleSpeed = 200;
let spawnTimer = 0;
let spawnInterval = 1200;
let gameOver = false;

// Scrolling lane lines
let laneDashes = [];

// Scrolling trees in the grass
let trees = [];

// Score
let score = 0;
let scoreText;
let gameOverText;

// Swipe
let startX, startY, endX, endY;
const SWIPE_THRESHOLD = 50;

function preload() {
  // No external assets needed
}

function create() {
  // --- 1) SKY & GRASS BACKGROUND ---
  drawEnvironment.call(this);

  // --- 2) LANE LINES (DASHES) ---
  // We'll create dashed lines at x=145 and x=215 to separate the 3 lanes
  createLaneDashes.call(this, 145);
  createLaneDashes.call(this, 215);

  // --- 3) PLAYER ---
  // A bright rectangle for the player car
  player = this.add.rectangle(lanes[currentLane], 550, 40, 40, 0xff2e2e);
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);

  // --- 4) OBSTACLES GROUP ---
  obstacles = this.physics.add.group();
  this.physics.add.overlap(player, obstacles, handleCollision, null, this);

  // --- 5) SCORE & GAME OVER UI (DOM) ---
  scoreText = document.createElement('div');
  scoreText.id = 'scoreText';
  scoreText.innerHTML = 'Score: 0';
  document.getElementById('gameContainer').appendChild(scoreText);

  gameOverText = document.createElement('div');
  gameOverText.id = 'gameOverText';
  gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
  document.getElementById('gameContainer').appendChild(gameOverText);

  // --- 6) SWIPE INPUT ---
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

  // --- OBSTACLE TIMER ---
  spawnTimer = 0;

  // --- CREATE SOME TREES ON THE GRASS (SCROLLING) ---
  createTrees.call(this);
}

function update(time, delta) {
  if (gameOver) return;

  // 1) SCROLL LANE DASHES
  laneDashes.forEach(d => {
    d.y += 0.8;
    if (d.y > 640) {
      d.y -= 640;
    }
  });

  // 2) SCROLL TREES
  trees.forEach(tree => {
    tree.y += 0.3;
    if (tree.y > 640) {
      tree.y = -Math.random() * 200; // Move it back up randomly
    }
  });

  // 3) SPAWN OBSTACLES
  spawnTimer += delta;
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle.call(this);
  }

  // 4) MOVE OBSTACLES
  obstacles.children.each(obs => {
    obs.y += obstacleSpeed * (delta / 1000);
    if (obs.y > 700) {
      obs.destroy();
    }
  });

  // 5) SCORE
  score += delta * 0.01;
  scoreText.innerHTML = 'Score: ' + Math.floor(score);
}

/**
 * Draw environment shapes:
 * - Sky (blue rectangle)
 * - Grass on left and right (green rectangles)
 * - Road (dark grey in the middle)
 */
function drawEnvironment() {
  // 1) Sky
  let sky = this.add.graphics();
  sky.fillStyle(0x87CEEB, 1); // Light sky blue
  sky.fillRect(0, 0, 360, 640);

  // 2) Road area in the middle
  let road = this.add.graphics();
  road.fillStyle(0x333333, 1);
  // We'll make the road from x=80 to x=280
  road.fillRect(80, 0, 200, 640);

  // 3) Grass on the left side (x=0..80) and right side (x=280..360)
  let grassLeft = this.add.graphics();
  grassLeft.fillStyle(0x339933, 1);
  grassLeft.fillRect(0, 0, 80, 640);

  let grassRight = this.add.graphics();
  grassRight.fillStyle(0x339933, 1);
  grassRight.fillRect(280, 0, 80, 640);
}

/** 
 * Create dashed lane lines at given x position. 
 * Each dash is 6 wide, 30 high, spaced ~40px apart. 
 */
function createLaneDashes(xPos) {
  for (let i = 0; i < 640; i += 40) {
    let dash = this.add.rectangle(xPos, i, 6, 30, 0xffffff);
    laneDashes.push(dash);
  }
}

/**
 * Create some "trees" on the grass, 
 * each tree is a trunk + circle top (grouped as a container for scrolling).
 */
function createTrees() {
  // We'll place ~6 trees on left grass, 6 on right grass, 
  // random y offset, scroll them down in update.
  for (let i = 0; i < 6; i++) {
    let xPosLeft = Phaser.Math.Between(20, 60);   // Left grass area
    let yPos = Phaser.Math.Between(0, 640);
    trees.push(createSingleTree.call(this, xPosLeft, yPos));

    let xPosRight = Phaser.Math.Between(300, 340); // Right grass area
    let yPosR = Phaser.Math.Between(0, 640);
    trees.push(createSingleTree.call(this, xPosRight, yPosR));
  }
}

/**
 * Helper to create one "tree" using shapes:
 * - a small brown rectangle as trunk
 * - a green circle as leaves
 * We'll group them in a Container so we can scroll them easily in `update()`.
 */
function createSingleTree(x, y) {
  // A container that holds trunk + circle
  let treeContainer = this.add.container(x, y);

  // Trunk: rectangle 8 wide, 20 tall
  let trunk = this.add.rectangle(0, 10, 8, 20, 0x8B4513);
  trunk.setOrigin(0.5, 1);

  // Leaves: circle with radius ~12
  let leaves = this.add.circle(0, -5, 12, 0x228B22); // dark green

  treeContainer.add([trunk, leaves]);

  return treeContainer;
}

/**
 * Spawn a random colored obstacle on the road 
 * in one of the 3 lanes [110, 180, 250].
 */
function spawnObstacle() {
  let laneIndex = Phaser.Math.Between(0, lanes.length - 1);
  let xPos = lanes[laneIndex];

  // Random color for each obstacle
  let color = Phaser.Display.Color.RandomRGB().color;
  let obsRect = this.add.rectangle(xPos, -20, 40, 40, color);
  this.physics.add.existing(obsRect);
  obstacles.add(obsRect);
}

function handleCollision() {
  gameOver = true;
  gameOverText.style.display = 'block';
}

function handleSwipe() {
  const distX = endX - startX;
  const distY = endY - startY;

  if (Math.abs(distX) > Math.abs(distY)) {
    // left
    if (distX < -SWIPE_THRESHOLD && currentLane > 0) {
      currentLane--;
      player.x = lanes[currentLane];
    }
    // right
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

  // Reset player
  currentLane = 1;
  player.x = lanes[currentLane];

  // Clear obstacles
  obstacles.clear(true, true);
}
