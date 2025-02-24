/**
 * Latif Runner 3D (Simplified Shapes)
 * - Minimal pseudo-3D approach with trapezoid road, lane lines,
 *   a red "car" at the bottom, and random obstacles from the top.
 * - No external images.
 * - Verified to show colored shapes when run on Phaser 3.60.0 via localhost.
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
  scene: [MainScene]
};

let game = new Phaser.Game(config);

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // No external assets to load
  }

  create() {
    // --- BASIC STATE ---
    this.gameOver = false;
    this.score = 0;

    // --- DRAW BACKGROUND ---
    // Top half = sky (blue), bottom half = ground (brown)
    let sky = this.add.graphics();
    sky.fillStyle(0x87CEEB, 1); // sky color
    sky.fillRect(0, 0, 360, 320);

    let ground = this.add.graphics();
    ground.fillStyle(0x6B4A2C, 1); // brownish ground
    ground.fillRect(0, 320, 360, 320);

    // --- DRAW TRAPEZOID ROAD ---
    // We'll define top (x=120 to x=240) and bottom (x=40 to x=320)
    let road = this.add.graphics();
    road.fillStyle(0x333333, 1);
    road.beginPath();
    road.moveTo(120, 0);
    road.lineTo(240, 0);
    road.lineTo(320, 640);
    road.lineTo(40, 640);
    road.closePath();
    road.fill();

    // --- DRAW LANE LINES ---
    // We'll just draw 2 lines from top to bottom to form 3 lanes in perspective
    this.drawLaneLine(160, 0, 60, 640, 0xffffff); // left lane line
    this.drawLaneLine(200, 0, 280, 640, 0xffffff); // right lane line

    // Lane indexes: 0,1,2 => positions from left lane to right lane
    // We'll store them for perspective transform
    this.laneCount = 3;

    // --- PLAYER (RED CAR) ---
    // We'll store a "virtY" to emulate perspective from top(0) to bottom(640).
    // We'll also store "laneIndex" 0..2. 
    this.playerLaneIndex = 1; // start in middle lane
    this.playerY = 580;       // near bottom
    this.playerShape = this.add.rectangle(0, 0, 40, 40, 0xff4444);
    this.physics.add.existing(this.playerShape);

    // --- OBSTACLES ---
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.playerShape, this.obstacles, this.handleCollision, null, this);

    // Timers
    this.obstacleSpeed = 0.05; // Speed of obstacles from top to bottom
    this.spawnTimer = 0;
    this.spawnInterval = 1200; // ms

    // UI
    this.createUI();

    // Input (swipe)
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

    // Update the player's position once
    this.updatePlayer();
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
        return;
      }
      this.updateObstacle(obs);
    });

    // Increase score
    this.score += delta * 0.01;
    this.scoreText.innerHTML = 'Score: ' + Math.floor(this.score);

    // Update player shape
    this.updatePlayer();
  }

  // --- DRAW LANE LINE (SIMPLE) ---
  // We'll just draw a line from (x1,y1) to (x2,y2)
  drawLaneLine(x1, y1, x2, y2, color) {
    let laneG = this.add.graphics({ lineStyle: { width: 2, color } });
    laneG.beginPath();
    laneG.moveTo(x1, y1);
    laneG.lineTo(x2, y2);
    laneG.strokePath();
  }

  // --- CREATE UI ---
  createUI() {
    // Score text
    this.scoreText = document.createElement('div');
    this.scoreText.id = 'scoreText';
    this.scoreText.innerHTML = 'Score: 0';
    document.getElementById('gameContainer').appendChild(this.scoreText);

    // Game Over text
    this.gameOverText = document.createElement('div');
    this.gameOverText.id = 'gameOverText';
    this.gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
    document.getElementById('gameContainer').appendChild(this.gameOverText);
  }

  // --- SPAWN OBSTACLE ---
  spawnObstacle() {
    // Lane index 0..2
    let laneIndex = Phaser.Math.Between(0, 2);

    // We'll create a rectangle (30x30) with random color
    let color = Phaser.Display.Color.RandomRGB().color;
    let obsRect = this.add.rectangle(0, 0, 30, 30, color);
    this.physics.add.existing(obsRect);
    obsRect.virtLane = laneIndex;
    obsRect.virtY = 0; // start at top/horizon

    this.obstacles.add(obsRect);

    // Position it
    this.updateObstacle(obsRect);
  }

  // --- UPDATE OBSTACLE POSITION / SCALE ---
  updateObstacle(obs) {
    const laneIndex = obs.virtLane;
    const virtY = obs.virtY;

    // We'll pick an (x, y) in screen coords based on linear interpolation:
    // top of road: x ~ (120..240), bottom of road: x ~ (40..320)
    // laneIndex 0 => left lane, 1 => center, 2 => right
    // We'll find a fraction across the road based on laneIndex

    // 1) Interpolate left & right edges
    // top y=0 => left=120, right=240
    // bottom y=640 => left=40, right=320
    let t = virtY / 640; // 0 at top, 1 at bottom
    let leftEdge = Phaser.Math.Linear(120, 40, t);
    let rightEdge = Phaser.Math.Linear(240, 320, t);
    let roadWidth = rightEdge - leftEdge;

    // 2) Lane fraction: 0 => 1/4, 1 => 1/2, 2 => 3/4 across the road
    let laneFraction = (laneIndex + 1) / (this.laneCount + 1);

    let screenX = leftEdge + roadWidth * laneFraction;
    let screenY = virtY;

    // 3) Scale: smaller near top, bigger near bottom
    // We'll do 0.3 at top, 1.2 at bottom
    let scale = Phaser.Math.Linear(0.3, 1.2, t);

    obs.x = screenX;
    obs.y = screenY;
    obs.setScale(scale);
  }

  // --- UPDATE PLAYER POSITION ---
  updatePlayer() {
    let virtY = this.playerY;
    let laneIndex = this.playerLaneIndex;

    let t = virtY / 640;
    // leftEdge top=120 -> bottom=40
    let leftEdge = Phaser.Math.Linear(120, 40, t);
    // rightEdge top=240 -> bottom=320
    let rightEdge = Phaser.Math.Linear(240, 320, t);

    let roadWidth = rightEdge - leftEdge;
    // Lane fraction
    let laneFraction = (laneIndex + 1) / (this.laneCount + 1);

    let screenX = leftEdge + roadWidth * laneFraction;
    let screenY = virtY;
    let scale = Phaser.Math.Linear(0.3, 1.2, t);

    this.playerShape.x = screenX;
    this.playerShape.y = screenY;
    this.playerShape.setScale(scale);
  }

  // --- COLLISION ---
  handleCollision() {
    this.gameOver = true;
    this.gameOverText.style.display = 'block';
  }

  // --- SWIPE ---
  handleSwipe() {
    const distX = this.endX - this.startX;
    const distY = this.endY - this.startY;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(distX) > Math.abs(distY)) {
      // left
      if (distX < -SWIPE_THRESHOLD && this.playerLaneIndex > 0) {
        this.playerLaneIndex--;
      }
      // right
      else if (distX > SWIPE_THRESHOLD && this.playerLaneIndex < 2) {
        this.playerLaneIndex++;
      }
    }
  }

  // --- RESTART ---
  restartGame() {
    this.gameOver = false;
    this.gameOverText.style.display = 'none';
    this.score = 0;

    // Reset player near bottom, center lane
    this.playerLaneIndex = 1;
    this.playerY = 580;

    // Clear obstacles
    this.obstacles.clear(true, true);
  }
}
