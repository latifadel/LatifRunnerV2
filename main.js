/**
 * main.js - Batman Runner (Shape-based 3rd-person endless runner)
 * 
 * Uses Phaser 3.60+ and purely shapes for the "Batman" character, obstacles, and environment.
 * 
 * - 3 "lanes" in perspective (left, center, right)
 * - "Night sky" with a stylized Gotham skyline
 * - A dark road trapezoid
 * - Batman shape near bottom, can swipe left/right
 * - Obstacles spawn near top, growing larger as they approach
 * - Score increments over time
 * - Simple collision => GAME OVER
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
  scene: [BatmanRunnerScene]
};

let game = new Phaser.Game(config);

// Our single scene
class BatmanRunnerScene extends Phaser.Scene {
  constructor() {
    super('BatmanRunnerScene');
  }

  preload() {
    // No external assets needed
  }

  create() {
    // Basic state
    this.gameOver = false;
    this.score = 0;

    // Draw environment: night sky, skyline, road
    this.drawEnvironment();

    // Lane data
    // We'll have 3 lanes: index=0,1,2
    // We'll store pseudo-lane to do perspective
    this.laneCount = 3;
    this.playerLaneIndex = 1; // center lane

    // The player's "virtual Y" near the bottom
    this.playerY = 600; 
    // We'll store obstacles with a "virtY" from 0 (top/horizon) -> 640 (bottom)

    // Create the "Batman" shape
    // For a shape-based "Batman," let's do a black rectangle with a small yellow ellipse in the center
    this.batmanContainer = this.add.container(0, 0);

    // Batman body: big black rectangle
    let batBody = this.add.rectangle(0, 0, 40, 50, 0x000000);
    // Add a small yellow ellipse near the chest
    let batSymbol = this.add.ellipse(0, 5, 20, 10, 0xFFFF00);

    this.batmanContainer.add([batBody, batSymbol]);
    this.physics.add.existing(this.batmanContainer);
    this.batmanContainer.body.setCollideWorldBounds(false);

    // Group for obstacles
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.batmanContainer, this.obstacles, this.handleCollision, null, this);

    // UI
    this.createUI();

    // Swipe Input
    this.input.on('pointerdown', (pointer) => {
      this.startX = pointer.x;
      this.startY = pointer.y;
    });
    this.input.on('pointerup', (pointer) => {
      this.endX = pointer.x;
      this.endY = pointer.y;
      this.handleSwipe();
      if (this.gameOver) {
        this.restartGame();
      }
    });

    // Timers
    this.obstacleSpeed = 0.05; // speed from top to bottom
    this.spawnInterval = 1200;
    this.spawnTimer = 0;

    // Final position update for Batman
    this.updateBatman();
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Spawn obstacles
    this.spawnTimer += delta;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
    }

    // Move obstacles
    this.obstacles.children.each(obs => {
      obs.virtY += this.obstacleSpeed * delta;
      if (obs.virtY > 700) {
        obs.destroy();
      } else {
        this.updateObstacle(obs);
      }
    });

    // Increase score
    this.score += delta * 0.01;
    this.scoreText.innerHTML = 'Score: ' + Math.floor(this.score);

    // Update Batman position each frame
    this.updateBatman();
  }

  // Draw the night sky, the Gotham skyline, and trapezoid road
  drawEnvironment() {
    // 1) Sky
    let sky = this.add.graphics();
    sky.fillStyle(0x000033, 1); // Dark bluish
    sky.fillRect(0, 0, 360, 640);

    // 2) Stylized skyline silhouette
    // We'll just draw a few rectangles or a single polygon
    let skyline = this.add.graphics();
    skyline.fillStyle(0x111111, 1);
    // Example polygon for buildings
    skyline.beginPath();
    // Move across the bottom half with building shapes
    // We'll do a quick shape from x=0..360, y around 300..400
    skyline.moveTo(0, 300);
    skyline.lineTo(40, 250);
    skyline.lineTo(60, 400);
    skyline.lineTo(90, 320);
    skyline.lineTo(130, 400);
    skyline.lineTo(200, 260);
    skyline.lineTo(240, 400);
    skyline.lineTo(280, 280);
    skyline.lineTo(310, 400);
    skyline.lineTo(360, 400);
    skyline.lineTo(360, 640);
    skyline.lineTo(0, 640);
    skyline.closePath();
    skyline.fillPath();

    // 3) Road trapezoid
    // narrower at top (y=400 => x=100..260) and wide at bottom (y=640 => x=0..360)
    let road = this.add.graphics();
    road.fillStyle(0x222222, 1);
    road.beginPath();
    road.moveTo(100, 400);
    road.lineTo(260, 400);
    road.lineTo(360, 640);
    road.lineTo(0, 640);
    road.closePath();
    road.fill();

    // 4) Lane lines (two lines to form 3 lanes)
    // We'll do them from y=400..640
    let laneGraphics = this.add.graphics({ lineStyle: { width: 2, color: 0xffffff, alpha: 0.8 } });
    laneGraphics.beginPath();

    // Lane lines at ~1/3 and 2/3 across the road from top to bottom
    // We'll just do a simple linear interpolation from top->bottom
    // At y=400: left=100, right=260 => width=160
    // at y=640: left=0, right=360 => width=360
    // lane fraction: 1/3 and 2/3

    drawLaneLine(1/3);
    drawLaneLine(2/3);

    function drawLaneLine(frac) {
      laneGraphics.beginPath();
      let steps = 10;
      for (let i = 0; i <= steps; i++) {
        let t = i / steps; // 0..1 from top(400) to bottom(640)
        let y = 400 + (640 - 400) * t; // linear from 400->640
        // leftEdge from 100->0
        let leftEdge = 100 + (0 - 100) * t;
        // rightEdge from 260->360
        let rightEdge = 260 + (360 - 260) * t;
        let width = rightEdge - leftEdge;
        let x = leftEdge + width * frac;
        if (i === 0) laneGraphics.moveTo(x, y);
        else laneGraphics.lineTo(x, y);
      }
      laneGraphics.strokePath();
    }
  }

  // Create DOM elements for score and game over text
  createUI() {
    // Score
    this.scoreText = document.createElement('div');
    this.scoreText.id = 'scoreText';
    this.scoreText.innerHTML = 'Score: 0';
    document.getElementById('gameContainer').appendChild(this.scoreText);

    // Game Over
    this.gameOverText = document.createElement('div');
    this.gameOverText.id = 'gameOverText';
    this.gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
    document.getElementById('gameContainer').appendChild(this.gameOverText);
  }

  // Spawn obstacles near the top (y=400) and move them downward
  spawnObstacle() {
    // Lane 0..2
    let laneIndex = Phaser.Math.Between(0, 2);
    // shape-based "bomb" or "henchman"
    let color = (Math.random() < 0.5) ? 0xff00ff : 0x00ffff; // purplish or cyan
    let obsRect = this.add.rectangle(0, 0, 30, 30, color);
    this.physics.add.existing(obsRect);

    // We'll store a custom property for "virtY" from 400->640
    obsRect.virtLane = laneIndex;
    obsRect.virtY = 400; // near top
    this.obstacles.add(obsRect);

    this.updateObstacle(obsRect);
  }

  // Each frame, update obstacle's position & scale
  updateObstacle(obs) {
    let laneIndex = obs.virtLane;
    let virtY = obs.virtY; 
    // 400..640 => top of road to bottom

    let t = (virtY - 400) / (640 - 400); // 0 at top(400), 1 at bottom(640)
    // Interpolate leftEdge: at y=400 => 100, at y=640 => 0
    let leftEdge = Phaser.Math.Linear(100, 0, t);
    // rightEdge: 400=>260, 640=>360
    let rightEdge = Phaser.Math.Linear(260, 360, t);
    let roadWidth = rightEdge - leftEdge;

    // lane fraction => (laneIndex+1)/(laneCount+1)
    let frac = (laneIndex + 1) / (this.laneCount + 1);
    let screenX = leftEdge + roadWidth * frac;
    let screenY = virtY;

    // scale from small near top to bigger near bottom
    let scale = Phaser.Math.Linear(0.5, 1.5, t);

    obs.x = screenX;
    obs.y = screenY;
    obs.setScale(scale);
  }

  // Update Batman's container each frame
  updateBatman() {
    let t = (this.playerY - 400) / (640 - 400);
    let leftEdge = Phaser.Math.Linear(100, 0, t);
    let rightEdge = Phaser.Math.Linear(260, 360, t);
    let roadWidth = rightEdge - leftEdge;

    let frac = (this.playerLaneIndex + 1) / (this.laneCount + 1);
    let screenX = leftEdge + roadWidth * frac;
    let screenY = this.playerY;
    let scale = Phaser.Math.Linear(0.5, 1.5, t);

    this.batmanContainer.x = screenX;
    this.batmanContainer.y = screenY;
    this.batmanContainer.setScale(scale);
  }

  handleCollision(playerObj, obstacle) {
    this.gameOver = true;
    this.gameOverText.style.display = 'block';
  }

  handleSwipe() {
    const distX = this.endX - this.startX;
    const distY = this.endY - this.startY;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(distX) > Math.abs(distY)) {
      // Left
      if (distX < -SWIPE_THRESHOLD && this.playerLaneIndex > 0) {
        this.playerLaneIndex--;
      }
      // Right
      else if (distX > SWIPE_THRESHOLD && this.playerLaneIndex < 2) {
        this.playerLaneIndex++;
      }
    }
  }

  restartGame() {
    this.gameOver = false;
    this.gameOverText.style.display = 'none';
    this.score = 0;
    this.playerLaneIndex = 1;
    this.obstacles.clear(true, true);
  }
}
