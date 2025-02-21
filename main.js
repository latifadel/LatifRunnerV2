const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: 'gameContainer',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: { preload, create, update }
};
let game = new Phaser.Game(config);
let background, player, obstacles, coins, scoreText, gameOverText;
let lanes = [90, 180, 270], currentLane = 1, score = 0, gameOver = false;
let spawnTimer = 0, spawnInterval = 1200, obstacleSpeed = 240, coinSpeed = 240;
let startX, startY, endX, endY, SWIPE_THRESHOLD = 50;
function preload() {
  this.load.image('bg', 'https://i.imgur.com/LPhWM85.png');
  this.load.spritesheet('player_run','https://i.imgur.com/XNCKB6a.png',{ frameWidth: 48, frameHeight: 48 });
  this.load.image('obstacle','https://i.imgur.com/RqZ7M3a.png');
  this.load.image('coin','https://i.imgur.com/PknkWvS.png');
}
function create() {
  background = this.add.tileSprite(0, 0, 360, 640, 'bg').setOrigin(0, 0);
  player = this.physics.add.sprite(lanes[currentLane], 550, 'player_run').setCollideWorldBounds(true).setScale(1.2);
  this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
  player.play('run');
  obstacles = this.physics.add.group();
  coins = this.physics.add.group();
  this.physics.add.overlap(player, obstacles, gameOverHandler, null, this);
  this.physics.add.overlap(player, coins, collectCoin, null, this);
  scoreText = document.createElement('div');
  scoreText.id = 'scoreText';
  scoreText.innerHTML = 'Score: 0';
  document.getElementById('gameContainer').appendChild(scoreText);
  gameOverText = document.createElement('div');
  gameOverText.id = 'gameOverText';
  gameOverText.innerHTML = 'GAME OVER<br><small>Tap to Restart</small>';
  document.getElementById('gameContainer').appendChild(gameOverText);
  this.input.on('pointerdown', p => { startX = p.x; startY = p.y; });
  this.input.on('pointerup', p => { endX = p.x; endY = p.y; handleSwipe(); if (gameOver) restartGame(); });
}
function update(time, delta) {
  if (gameOver) return;
  background.tilePositionY -= 2;
  spawnTimer += delta;
  if (spawnTimer > spawnInterval) { spawnTimer = 0; spawnObstacle(this); spawnCoin(this); }
  score += delta * 0.01;
  scoreText.innerHTML = 'Score: ' + Math.floor(score);
  obstacles.children.iterate(o => { if (o) { o.y += obstacleSpeed*(delta/1000); if (o.y > 700) o.destroy(); } });
  coins.children.iterate(c => { if (c) { c.y += coinSpeed*(delta/1000); if (c.y > 700) c.destroy(); } });
}
function handleSwipe() {
  let distX = endX - startX, distY = endY - startY;
  if (Math.abs(distX) > Math.abs(distY)) {
    if (distX < -SWIPE_THRESHOLD && currentLane > 0) { currentLane--; player.x = lanes[currentLane]; }
    else if (distX > SWIPE_THRESHOLD && currentLane < lanes.length-1) { currentLane++; player.x = lanes[currentLane]; }
  }
}
function spawnObstacle(scene) {
  let laneIndex = Phaser.Math.Between(0, lanes.length - 1);
  let o = scene.physics.add.sprite(lanes[laneIndex], -50, 'obstacle');
  obstacles.add(o);
}
function spawnCoin(scene) {
  if (Math.random() < 0.5) {
    let laneIndex = Phaser.Math.Between(0, lanes.length - 1);
    let c = scene.physics.add.sprite(lanes[laneIndex], -150, 'coin').setScale(0.8);
    coins.add(c);
  }
}
function collectCoin(player, coin) {
  coin.destroy();
  score += 10;
}
function gameOverHandler() {
  gameOver = true;
  gameOverText.style.display = 'block';
}
function restartGame() {
  gameOver = false;
  gameOverText.style.display = 'none';
  score = 0;
  currentLane = 1;
  player.x = lanes[currentLane];
  obstacles.clear(true, true);
  coins.clear(true, true);
}