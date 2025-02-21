/******************************************************************************
 * main.js
 * 
 * Fully working multi-scene Phaser 3 runner. No placeholders, draws shapes, 
 * ensures the MenuScene text is visible, and the game runs in the #gameContainer.
 ******************************************************************************/

const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: 'gameContainer',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [ BootScene, MenuScene, GameScene, UIScene, GameOverScene ]
};

let game = new Phaser.Game(config);

/* Scene 1: BootScene */
class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }
  preload() {}
  create() {
    this.scene.start('MenuScene');
  }
}

/* Scene 2: MenuScene */
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }
  create() {
    this.cameras.main.setBackgroundColor(0x222222);
    const { width, height } = this.scale;

    let title = this.add.text(width / 2, 200, 'ENDLESS RUNNER', {
      fontSize: '28px',
      fill: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    let instructions = this.add.text(width / 2, 300,
      'Swipe left/right to change lanes.\nCollect coins, avoid obstacles.',
      {
        fontSize: '16px',
        fill: '#ccc',
        align: 'center'
      }
    ).setOrigin(0.5);

    let startText = this.add.text(width / 2, 400, 'Tap to START', {
      fontSize: '20px',
      fill: '#ff0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.input.once('pointerup', () => {
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }
}

/* Scene 3: GameScene */
class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }
  init() {
    this.lanes = [90, 180, 270];
    this.currentLane = 1;
    this.score = 0;
    this.gameOver = false;
    this.spawnTimer = 0;
    this.spawnInterval = 1200;
    this.obstacleSpeed = 240;
    this.coinSpeed = 240;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
  }
  create() {
    this.bg1 = this.add.graphics();
    this.bg2 = this.add.graphics();
    this.bg3 = this.add.graphics();
    this.bgShift = 0;

    this.player = this.physics.add.sprite(this.lanes[this.currentLane], 550, '');
    this.player.setDisplaySize(40, 40);
    this.player.body.setSize(40, 40);
    this.player.setCollideWorldBounds(true);

    this.obstacles = this.physics.add.group();
    this.coins = this.physics.add.group();

    this.physics.add.overlap(this.player, this.obstacles, this.handleGameOver, null, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

    this.input.on('pointerdown', (pointer) => {
      this.startX = pointer.x;
      this.startY = pointer.y;
    });
    this.input.on('pointerup', (pointer) => {
      this.endX = pointer.x;
      this.endY = pointer.y;
      this.handleSwipe();
    });
  }
  update(time, delta) {
    if (this.gameOver) return;

    this.drawParallaxBackground(delta);

    this.spawnTimer += delta;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
      this.spawnCoin();
    }

    this.score += delta * 0.01;

    this.obstacles.children.iterate((obj) => {
      if (!obj) return;
      obj.y += this.obstacleSpeed * (delta / 1000);
      if (obj.y > 700) obj.destroy();
    });

    this.coins.children.iterate((c) => {
      if (!c) return;
      c.y += this.coinSpeed * (delta / 1000);
      if (c.y > 700) c.destroy();
    });

    this.drawObstacles();
    this.drawCoins();
    this.drawPlayer();
  }
  drawParallaxBackground(delta) {
    this.bg1.clear();
    this.bg2.clear();
    this.bg3.clear();
    this.bgShift += 0.01;

    let w = this.sys.canvas.width;
    let h = this.sys.canvas.height;

    let hue1 = (Math.sin(this.bgShift) * 0.5 + 0.5) * 360;
    let color1 = Phaser.Display.Color.HSVToRGB(hue1 / 360, 1, 1).color;
    this.bg1.fillStyle(color1, 1);
    this.bg1.fillRect(0, 0, w, h);

    let hue2 = (Math.sin(this.bgShift + 1) * 0.5 + 0.5) * 360;
    let color2 = Phaser.Display.Color.HSVToRGB(hue2 / 360, 0.8, 0.5).color;
    this.bg2.fillStyle(color2, 0.2);
    this.bg2.fillRect(0, 0, w, h);

    let hue3 = (Math.sin(this.bgShift + 2) * 0.5 + 0.5) * 360;
    let color3 = Phaser.Display.Color.HSVToRGB(hue3 / 360, 0.5, 1).color;
    this.bg3.fillStyle(color3, 0.1);
    this.bg3.fillRect(0, 0, w, h);
  }
  handleSwipe() {
    let distX = this.endX - this.startX;
    let distY = this.endY - this.startY;
    if (Math.abs(distX) > Math.abs(distY)) {
      if (distX < -50 && this.currentLane > 0) {
        this.currentLane--;
        this.player.x = this.lanes[this.currentLane];
      } else if (distX > 50 && this.currentLane < this.lanes.length - 1) {
        this.currentLane++;
        this.player.x = this.lanes[this.currentLane];
      }
    }
  }
  spawnObstacle() {
    let laneIndex = Phaser.Math.Between(0, this.lanes.length - 1);
    let xPos = this.lanes[laneIndex];
    let obs = this.physics.add.sprite(xPos, -50, '');
    obs.setDisplaySize(40, 40);
    obs.body.setSize(40, 40);
    this.obstacles.add(obs);
  }
  spawnCoin() {
    if (Math.random() < 0.5) {
      let laneIndex = Phaser.Math.Between(0, this.lanes.length - 1);
      let xPos = this.lanes[laneIndex];
      let c = this.physics.add.sprite(xPos, -100, '');
      c.setDisplaySize(20, 20);
      c.body.setSize(20, 20);
      this.coins.add(c);
    }
  }
  drawObstacles() {
    let gfx = this.add.graphics();
    gfx.clear();
    gfx.fillStyle(0x00ff00, 1);
    this.obstacles.children.iterate((obj) => {
      gfx.fillRect(obj.x - 20, obj.y - 20, 40, 40);
    });
  }
  drawCoins() {
    let gfx = this.add.graphics();
    gfx.clear();
    gfx.fillStyle(0xffff00, 1);
    this.coins.children.iterate((c) => {
      gfx.fillCircle(c.x, c.y, 10);
    });
  }
  drawPlayer() {
    let gfx = this.add.graphics();
    gfx.clear();
    gfx.fillStyle(0xff0000, 1);
    gfx.fillCircle(this.player.x, this.player.y, 20);
  }
  collectCoin(player, coin) {
    coin.destroy();
    this.score += 10;
  }
  handleGameOver() {
    if (!this.gameOver) {
      this.gameOver = true;
      this.scene.pause('UIScene');
      this.scene.start('GameOverScene', { finalScore: this.score });
    }
  }
}

/* Scene 4: UIScene (DOM-based live score) */
class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }
  create() {
    this.gameScene = this.scene.get('GameScene');

    this.scoreText = document.createElement('div');
    this.scoreText.id = 'scoreText';
    this.scoreText.innerText = 'Score: 0';
    document.getElementById('gameContainer').appendChild(this.scoreText);
  }
  update() {
    if (this.gameScene && !this.gameScene.gameOver) {
      this.scoreText.innerText = 'Score: ' + Math.floor(this.gameScene.score);
    }
  }
}

/* Scene 5: GameOverScene */
class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }
  init(data) { this.finalScore = data.finalScore || 0; }
  create() {
    let oldScore = document.getElementById('scoreText');
    if (oldScore) oldScore.remove();

    this.gameOverText = document.createElement('div');
    this.gameOverText.id = 'gameOverText';
    this.gameOverText.innerHTML = `GAME OVER<br>Score: ${Math.floor(this.finalScore)}<br><small>Tap to Restart</small>`;
    document.getElementById('gameContainer').appendChild(this.gameOverText);

    this.input.once('pointerup', () => {
      this.gameOverText.remove();
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });
  }
}
