/**
 * Latif Runner 3D (Shapes)
 * 
 * A pseudo-3D runner using only shapes for a "third-person" road perspective:
 * - The road is a trapezoid (vanishing near the top).
 * - Lanes converge upward, obstacles grow as they come "closer."
 * - Player can swipe lanes, see obstacles approach in perspective.
 * - Score increments, collision triggers Game Over.
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
    // No external images needed
  }

  create() {
    // Basic config
    this.gameOver = false;
    this.score = 0;

    // Draw sky + ground
    this.drawBackground();

    // Draw the trapezoid road itself (just for visual reference)
    // We'll still do actual transformations for objects
    this.drawRoadShape();

    // Lane config:
    // We'll treat "virtualY" = 0 at the horizon, 640 at bottom (player area).
    // 3 lanes: -1, 0, +1 offset from center line
    this.laneOffsets = [-1, 0, +1];
    this.currentLaneIndex = 1; // start in center lane

    // Player shape: A rectangle that we scale/position each frame
    this.playerRect = this.add.rectangle(0, 0, 40, 40, 0xff4444);
    // Give it physics for collision with obstacles
    this.physics.add.existing(this.playerRect);

    // Obstacles group
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.playerRect, this.obstacles, this.handleCollision, null, this);

    // Dom elements for score + gameOver
    this.createUI();

    // Swipe input
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
    this.obstacleSpeed = 0.05; // How fast obstacles move from top to bottom in virtual coords
    this.spawnTimer = 0;
    this.spawnInterval = 1200; // ms

    // We'll define the "player's virtual Y" near the bottom
    this.playerY = 600; // 0=top horizon, 640=bottom
    this.updatePlayerPosition();
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Spawn obstacles
    this.spawnTimer += delta;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
    }

    // Update obstacles
    this.obstacles.children.each(obs => {
      // obs.virtY goes from 0 (top/horizon) to 640 (bottom)
      obs.virtY += this.obstacleSpeed * delta;
      // If off the bottom, destroy
      if (obs.virtY > 700) {
        obs.destroy();
        return;
      }
      // Update its position + scale based on virtY
      this.updateObstacle(obs);
    });

    // Increase score
    this.score += delta * 0.01;
    this.scoreText.innerHTML = 'Score: ' + Math.floor(this.score);

    // Update the player shape each frame
    this.updatePlayerPosition();
  }

  /** 
   * Draw a gradient background: 
   * - Blue sky at top
   * - Brownish ground at bottom
   * We'll just use 2 large rectangles for simplicity. 
   */
  drawBackground() {
    let sky = this.add.graphics();
    sky.fillStyle(0x87CEEB, 1); // sky color
    sky.fillRect(0, 0, 360, 320);

    let ground = this.add.graphics();
    ground.fillStyle(0x6B4A2C, 1); // brownish
    ground.fillRect(0, 320, 360, 320);
  }

  /**
   * Draw the main trapezoid road shape for reference:
   * We'll define top corners narrower, bottom corners wider.
   */
  drawRoadShape() {
    // top: x=130, x=230
    // bottom: x=40, x=320
    let road = this.add.graphics();
    road.fillStyle(0x333333, 1);
    road.beginPath();
    road.moveTo(130, 0);
    road.lineTo(230, 0);
    road.lineTo(320, 640);
    road.lineTo(40, 640);
    road.closePath();
    road.fill();

    // Now let's draw white lane lines in perspective
    // We'll do 2 lines dividing the road into 3 lanes
    // We'll do them from top (somewhere between 130->230) down to bottom (somewhere between 40->320)
    let laneGraphics = this.add.graphics({ lineStyle: { width: 2, color: 0xffffff, alpha: 0.8 } });
    // Lane 1: 1/3 from left
    // Lane 2: 2/3 from left
    // We'll param t from 0->1 for top->bottom
    // leftEdge at top = 130, rightEdge at top = 230
    // leftEdge at bottom = 40, rightEdge at bottom = 320
    const steps = 20;
    for (let l = 1; l < 3; l++) {
      laneGraphics.beginPath();
      for (let s = 0; s <= steps; s++) {
        let t = s / steps;
        let topLeft = Phaser.Math.Linear(130, 40, t);
        let topRight = Phaser.Math.Linear(230, 320, t);
        let x = Phaser.Math.Linear(topLeft, topRight, l / 3);
        let y = t * 640;
        if (s === 0) {
          laneGraphics.moveTo(x, y);
        } else {
          laneGraphics.lineTo(x, y);
        }
      }
      laneGraphics.strokePath();
    }
  }

  /**
   * Create UI (score + game over text)
   */
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

  /**
   * Spawn an obstacle at the horizon (virtY=0) in one of the 3 lanes
   */
  spawnObstacle() {
    const laneIndex = Phaser.Math.Between(0, 2);
    const color = Phaser.Display.Color.RandomRGB().color;

    // We'll create a rectangle for the obstacle, store a 'virtY' property
    let obsRect = this.add.rectangle(0, 0, 30, 30, color);
    this.physics.add.existing(obsRect);
    obsRect.virtLane = laneIndex;
    obsRect.virtY = 0; // start at horizon
    this.obstacles.add(obsRect);
    this.updateObstacle(obsRect);
  }

  /**
   * Each frame, update an obstacle's position & scale based on virtY
   */
  updateObstacle(obs) {
    const laneIndex = obs.virtLane;
    const y = obs.virtY;
    // We'll get the (x, screenY, scale) from our perspective transform
    const { x, screenY, scale } = this.getPerspective(laneIndex, y);

    obs.x = x;
    obs.y = screenY;
    // Adjust the rectangle's size according to scale
    // original is 30×30 at the bottom, so multiply
    obs.setScale(scale);
  }

  /**
   * Update player shape each frame. 
   * We'll treat the player's laneIndex and virtualY ~ 600.
   */
  updatePlayerPosition() {
    const { x, screenY, scale } = this.getPerspective(this.currentLaneIndex, this.playerY);
    this.playerRect.x = x;
    this.playerRect.y = screenY;
    this.playerRect.setScale(scale);
  }

  /**
   * A simple perspective transform:
   * - The road top is narrower (130->230).
   * - The road bottom is wider (40->320).
   * - y=0 = horizon, y=640=bottom
   * 
   * We'll find the leftEdge & rightEdge at that virtual y, then compute x 
   * for the 3-lane system. We'll also compute a scale for object size. 
   */
  getPerspective(laneIndex, virtY) {
    // 1) Interpolate left & right edges
    // At top (y=0), left=130, right=230
    // At bottom (y=640), left=40, right=320
    const t = virtY / 640; // 0 at top, 1 at bottom
    const leftEdge = Phaser.Math.Linear(130, 40, t);
    const rightEdge = Phaser.Math.Linear(230, 320, t);
    const roadWidth = rightEdge - leftEdge;

    // 2) Lane: -1,0,+1 => 3 lanes => positions are 1/6, 3/6, 5/6 across road 
    // (since -1,0,+1 is basically 3 steps)
    // We'll map lane offsets to something like 1/6, 3/6, 5/6
    // but let's do:
    // lane=0 => 1/4, lane=1 => 1/2, lane=2 => 3/4 across the road
    const fraction = 0.25 + laneIndex * 0.25;

    const x = leftEdge + roadWidth * fraction;
    const screenY = virtY;

    // 3) Scale: We'll assume 0.5 at horizon, 1.0 at bottom
    // Or you can do a bigger difference. Let's do 0.3 at top, 1.2 at bottom
    const scale = Phaser.Math.Linear(0.3, 1.2, t);

    return { x, screenY, scale };
  }

  /**
   * Collision callback
   */
  handleCollision() {
    this.gameOver = true;
    this.gameOverText.style.display = 'block';
  }

  /**
   * Handle swipe
   */
  handleSwipe() {
    const distX = this.endX - this.startX;
    const distY = this.endY - this.startY;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(distX) > Math.abs(distY)) {
      // left
      if (distX < -SWIPE_THRESHOLD && this.currentLaneIndex > 0) {
        this.currentLaneIndex--;
      }
      // right
      else if (distX > SWIPE_THRESHOLD && this.currentLaneIndex < 2) {
        this.currentLaneIndex++;
      }
    }
  }

  /**
   * Restart game
   */
  restartGame() {
    this.gameOver = false;
    this.gameOverText.style.display = 'none';
    this.score = 0;

    // Reset lanes
    this.currentLaneIndex = 1;
    this.playerY = 600;
    this.obstacles.clear(true, true);
  }
}
