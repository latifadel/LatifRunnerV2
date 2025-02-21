/******************************************************************************
 * main.js
 * A minimal multi-scene endless runner with swipe-based lane switching, 
 * coins, obstacles, shape-drawn everything, no extra text.
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
  create() {
    this.scene.start('MenuScene');
  }
}

/* Scene 2: MenuScene */
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }
  create() {
    this.cameras.main.setBackgroundColor(0x000000);
    let w = this.scale.width, h = this.scale.height;

    this.add.text(w/2, h/2 - 50, 'ENDLESS RUNNER', {
      fontSize: '28px',
      fill: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    let startText = this.add.text(w/2, h/2 + 20, 'Tap to START', {
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
  }

  create() {
    this.bgLayer = this.add.graphics();
    this.shiftVal = 0;

    this.player = this.physics.add.sprite(this.lanes[this.currentLane], 550, '');
    this.player.setDisplaySize(40, 40).setCollideWorldBounds(true);

    this.obstacles = this.physics.add.group();
    this.coins = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, this.handleGameOver, null, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

    this.input.on('pointerdown', pointer => {
      this.startX = pointer.x; this.startY = pointer.y;
    });
    this.input.on('pointerup', pointer => {
      this.endX = pointer.x; this.endY = pointer.y;
      this.handleSwipe();
    });
  }

  update(time, delta) {
    if (this.gameOver) return;

    this.drawBackground();
    this.spawnTimer += delta;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObstacle();
      this.spawnCoin();
    }
    this.score += delta * 0.01;

    this.obstacles.children.iterate(obj => {
      obj.y += this.obstacleSpeed * (delta / 1000);
      if (obj.y > 700) obj.destroy();
    });
    this.coins.children.iterate(c => {
      c.y += this.coinSpeed * (delta / 1000);
      if (c.y > 700) c.destroy();
    });

    this.drawObstacles();
    this.drawCoins();
    this.drawPlayer();
  }

  drawBackground() {
    this.bgLayer.clear();
    this.shiftVal += 0.01;
    let hue = (Math.sin(this.shiftVal) * 0.5 + 0.5) * 360;
    let color = Phaser.Display.Color.HSVToRGB(hue / 360, 1, 0.5).color;
    this.bgLayer.fillStyle(color, 0.5);
    this.bgLayer.fillRect(0, 0, 360, 640);
  }

  spawnObstacle() {
    let lane = Phaser.Math.Between(0, this.lanes.length - 1);
    let obs = this.physics.add.sprite(this.lanes[lane], -50, '').setDisplaySize(40, 40);
    this.obstacles.add(obs);
  }

  spawnCoin() {
    if (Math.random() < 0.5) {
      let lane = Phaser.Math.Between(0, this.lanes.length - 1);
      let coin = this.physics.add.sprite(this.lanes[lane], -120, '').setDisplaySize(20, 20);
      this.coins.add(coin);
    }
  }

  drawObstacles() {
    let gfx = this.add.graphics();
    gfx.fillStyle(0x00ff00, 1);
    this.obstacles.children.iterate(obj => {
      gfx.fillRect(obj.x - 20, obj.y - 20, 40, 40);
    });
  }

  drawCoins() {
    let gfx = this.add.graphics();
    gfx.fillStyle(0xffff00, 1);
    this.coins.children.iterate(c => {
      gfx.fillCircle(c.x, c.y, 10);
    });
  }

  drawPlayer() {
    let gfx = this.add.graphics();
    gfx.fillStyle(0xff0000, 1);
    gfx.fillCircle(this.player.x, this.player.y, 20);
  }

  handleSwipe() {
    let distX = this.endX - this.startX;
    let distY = this.endY - this.startY;
    if (Math.abs(distX) > Math.abs(distY)) {
      if (distX < -50 && this.currentLane > 0) {
        this.currentLane--;
      } else if (distX > 50 && this.currentLane < this.lanes.length - 1) {
        this.currentLane++;
      }
      this.player.x = this.lanes[this.currentLane];
    }
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

    let goText = document.createElement('div');
    goText.id = 'gameOverText';
    goText.innerHTML = `GAME OVER<br>Score: ${Math.floor(this.finalScore)}<br><small>Tap to Restart</small>`;
    document.getElementById('gameContainer').appendChild(goText);

    this.input.once('pointerup', () => {
      goText.remove();
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });
  }
}
