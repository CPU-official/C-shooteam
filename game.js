const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const timeElement = document.querySelector('#time');
const lifeElement = document.querySelector('#life');
const gameOverElement = document.querySelector('#gameOver');
const finalScoreElement = document.querySelector('#finalScore');
const restartButton = document.querySelector('#restartButton');
const startButton = document.querySelector('#startButton');
const missionIntroElement = document.querySelector('#missionIntro');
const difficultyElement = document.querySelector('#difficulty');
const resultKickerElement = document.querySelector('#resultKicker');
const resultTitleElement = document.querySelector('#resultTitle');
const resultMessageElement = document.querySelector('#resultMessage');

const difficultySettings = {
  easy: { life: 7, maxLife: 7, spawnEvery: 1600, speed: 0.65, minSize: 48, sizeRange: 24, fireInterval: 180, autoFire: true },
  normal: { life: 5, maxLife: 7, spawnEvery: 1200, speed: 1.15, minSize: 38, sizeRange: 22, fireInterval: 180, autoFire: true },
  hard: { life: 3, maxLife: 5, spawnEvery: 850, speed: 2.0, minSize: 30, sizeRange: 18, fireInterval: 450, autoFire: false }
};

const keys = { left: false, right: false, firing: false };
let player;
let bullets;
let enemies;
let explosions;
let score;
let life;
let timeLeft;
let gameOver;
let lastTimestamp;
let secondAccumulator;
let spawnAccumulator;
let fireAccumulator;
let ufoAccumulator;
let difficulty;
let missionStarted = false;

function resetGame() {
  player = { x: 430, y: 450, width: 40, height: 40 };
  bullets = [];
  enemies = [];
  explosions = [];
  score = 0;
  difficulty = difficultySettings[difficultyElement.value];
  life = difficulty.life;
  timeLeft = 100;
  gameOver = false;
  missionStarted = false;
  gameOverElement.classList.remove('clear');
  lastTimestamp = performance.now();
  secondAccumulator = 0;
  spawnAccumulator = 0;
  ufoAccumulator = 0;
  fireAccumulator = difficulty.fireInterval;
  gameOverElement.hidden = true;
  missionIntroElement.hidden = false;
  updateHud();
}

function updateHud() {
  scoreElement.textContent = String(score).padStart(4, '0');
  timeElement.textContent = String(timeLeft).padStart(3, '0');
  lifeElement.innerHTML = '';
  for (let index = 0; index < 7; index += 1) {
    const light = document.createElement('i');
    light.className = index >= life ? 'off' : '';
    lifeElement.append(light);
  }
  lifeElement.setAttribute('aria-label', `남은 생명 ${life}개`);
}

function finishGame(cleared) {
  gameOver = true;
  finalScoreElement.textContent = String(score).padStart(4, '0');
  resultKickerElement.textContent = cleared ? 'MISSION COMPLETE' : 'SIGNAL LOST';
  resultTitleElement.textContent = cleared ? 'MISSION CLEAR' : 'GAME OVER';
  resultMessageElement.innerHTML = `FINAL SCORE <strong>${String(score).padStart(4, '0')}</strong>`;
  gameOverElement.classList.toggle('clear', cleared);
  gameOverElement.hidden = false;
}

function shoot() {
  if (gameOver || fireAccumulator < difficulty.fireInterval) return;
  bullets.push({ x: player.x + 18, y: player.y - 28, width: 4, height: 42 });
  fireAccumulator = 0;
}

function intersects(first, second, padding = 0) {
  return first.x < second.x + second.width + padding && first.x + first.width > second.x - padding && first.y < second.y + second.height + padding && first.y + first.height > second.y - padding;
}

function update(delta) {
  if (gameOver || !missionStarted) return;
  if (keys.left) player.x -= 5;
  if (keys.right) player.x += 5;
  player.x = Math.max(0, Math.min(860, player.x));

  secondAccumulator += delta;
  spawnAccumulator += delta;
  ufoAccumulator += delta;
  fireAccumulator += delta;
  if (keys.firing && difficulty.autoFire) shoot();
  if (secondAccumulator >= 1000) {
    timeLeft -= Math.floor(secondAccumulator / 1000);
    secondAccumulator %= 1000;
    if (timeLeft <= 0) { timeLeft = 0; finishGame(true); }
    updateHud();
  }
  if (spawnAccumulator >= difficulty.spawnEvery) {
    const size = difficulty.minSize + Math.floor(Math.random() * difficulty.sizeRange);
    enemies.push({ x: Math.floor(Math.random() * (900 - size)), y: -size, width: size, height: size, rotation: Math.random() * Math.PI, rotationSpeed: (Math.random() - 0.5) * 0.02 });
    spawnAccumulator = 0;
  }
  if (ufoAccumulator >= 9000) {
    enemies.push({ type: 'ufo', x: Math.floor(Math.random() * 820), y: -42, width: 80, height: 42, rotation: 0, rotationSpeed: 0 });
    ufoAccumulator = 0;
  }

  bullets.forEach((bullet) => { bullet.y -= 10; });
  bullets = bullets.filter((bullet) => bullet.y >= -bullet.height);
  enemies.forEach((enemy) => {
    enemy.y += enemy.type === 'ufo' ? difficulty.speed * 0.85 : difficulty.speed;
    enemy.rotation += enemy.rotationSpeed;
  });
  explosions.forEach((explosion) => { explosion.life -= delta; explosion.radius += delta * 0.12; });
  explosions = explosions.filter((explosion) => explosion.life > 0);

  for (let index = enemies.length - 1; index >= 0; index -= 1) {
    if (enemies[index].y <= 600) continue;
    enemies.splice(index, 1);
    life -= 1;
    updateHud();
    if (life <= 0) finishGame(false);
  }
  for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      if (!intersects(bullets[bulletIndex], enemies[enemyIndex], 8)) continue;
      const enemy = enemies[enemyIndex];
      bullets.splice(bulletIndex, 1);
      enemies.splice(enemyIndex, 1);
      explosions.push({ x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2, radius: enemy.type === 'ufo' ? 16 : 8, life: 420, bonus: enemy.type === 'ufo' });
      if (enemy.type === 'ufo') {
        life = Math.min(life + 1, difficulty.maxLife);
        score += 3;
      } else {
        score += 1;
      }
      updateHud();
      break;
    }
  }
}

function draw() {
  ctx.fillStyle = '#050b1b';
  ctx.fillRect(0, 0, 900, 600);
  drawStars();
  ctx.strokeStyle = 'rgba(104, 246, 225, .06)';
  for (let line = 0; line <= 900; line += 60) {
    ctx.beginPath(); ctx.moveTo(line, 0); ctx.lineTo(line, 600); ctx.stroke();
    if (line <= 600) { ctx.beginPath(); ctx.moveTo(0, line); ctx.lineTo(900, line); ctx.stroke(); }
  }
  drawShip();
  ctx.shadowBlur = 0;
  drawLasers();
  enemies.forEach((enemy) => enemy.type === 'ufo' ? drawUfo(enemy) : drawAsteroid(enemy));
  explosions.forEach(drawExplosion);
}

function drawStars() {
  ctx.fillStyle = '#b7c9ff';
  for (let index = 0; index < 100; index += 1) {
    const x = (index * 97) % 900;
    const y = (index * 151) % 600;
    const size = index % 7 === 0 ? 2 : 1;
    ctx.globalAlpha = 0.25 + ((index * 13) % 60) / 100;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
}

function drawShip() {
  ctx.save();
  ctx.translate(player.x + 20, player.y + 20);
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = '#68f6e1'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#0aa7dc'; ctx.fillRect(-7, 17, 14, 10);
  ctx.fillStyle = '#42e3e4'; ctx.fillRect(-4, 25, 8, 7);
  ctx.fillStyle = '#ff9f1c'; ctx.fillRect(-5, 18, 10, 7);
  ctx.fillStyle = '#f45156'; ctx.fillRect(-19, 5, 12, 16); ctx.fillRect(7, 5, 12, 16);
  ctx.fillStyle = '#f4f0df';
  ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(13, -7); ctx.lineTo(13, 16); ctx.lineTo(-13, 16); ctx.lineTo(-13, -7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c9c4b4'; ctx.fillRect(-13, 8, 26, 9);
  ctx.fillStyle = '#49c8ed'; ctx.fillRect(-7, -7, 14, 12);
  ctx.fillStyle = '#168fc4'; ctx.fillRect(1, -5, 6, 8);
  ctx.restore();
}

function drawLasers() {
  bullets.forEach((bullet) => {
    const laserGradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bullet.height);
    laserGradient.addColorStop(0, '#ffffff'); laserGradient.addColorStop(0.45, '#68f6e1'); laserGradient.addColorStop(1, 'rgba(104, 246, 225, 0)');
    ctx.fillStyle = laserGradient; ctx.shadowColor = '#68f6e1'; ctx.shadowBlur = 20;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawExplosion(explosion) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, explosion.life / 360);
  ctx.strokeStyle = explosion.bonus ? '#68f6e1' : '#ffc857'; ctx.lineWidth = 3; ctx.shadowColor = explosion.bonus ? '#68f6e1' : '#ff6d67'; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawUfo(ufo) {
  ctx.save();
  ctx.translate(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2);
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = '#68f6e1'; ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(104, 246, 225, .22)';
  ctx.fillRect(-27, 14, 54, 12);
  ctx.fillStyle = '#324c78';
  ctx.fillRect(-40, -4, 80, 15);
  ctx.fillStyle = '#607aa8';
  ctx.fillRect(-31, -10, 62, 12);
  ctx.fillStyle = '#81a0d0';
  ctx.fillRect(-22, -17, 44, 10);
  ctx.fillStyle = '#68f6e1';
  ctx.fillRect(-15, -22, 30, 9);
  ctx.fillStyle = '#c9ffff';
  ctx.fillRect(-8, -20, 16, 5);
  ctx.fillStyle = '#ffc857';
  ctx.fillRect(-30, 10, 9, 5); ctx.fillRect(-15, 12, 9, 5); ctx.fillRect(6, 12, 9, 5); ctx.fillRect(21, 10, 9, 5);
  ctx.restore();
}

function drawAsteroid(asteroid) {
  const center = asteroid.width / 2;
  ctx.save();
  ctx.translate(asteroid.x + center, asteroid.y + center); ctx.rotate(asteroid.rotation); ctx.scale(asteroid.width / 44, asteroid.width / 44);
  ctx.imageSmoothingEnabled = false; ctx.shadowColor = 'rgba(255, 109, 103, .25)'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#941f2d'; ctx.fillRect(-13, -34, 10, 18); ctx.fillRect(4, -37, 9, 20);
  ctx.fillStyle = '#f05a24'; ctx.fillRect(-8, -32, 10, 19); ctx.fillRect(7, -29, 8, 15);
  ctx.fillStyle = '#ffb52e'; ctx.fillRect(-4, -26, 8, 14);
  ctx.fillStyle = '#414e6e';
  ctx.beginPath(); ctx.moveTo(-22, -8); ctx.lineTo(-14, -20); ctx.lineTo(3, -23); ctx.lineTo(19, -13); ctx.lineTo(22, 7); ctx.lineTo(12, 20); ctx.lineTo(-6, 23); ctx.lineTo(-20, 13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#63708e'; ctx.fillRect(-15, -7, 9, 10); ctx.fillRect(4, -14, 8, 8); ctx.fillRect(7, 7, 10, 7);
  ctx.fillStyle = '#303b5a'; ctx.fillRect(-12, -4, 6, 7); ctx.fillRect(5, -12, 6, 6); ctx.fillRect(9, 8, 7, 5);
  ctx.restore();
}

function gameLoop(timestamp) {
  const delta = Math.min(timestamp - lastTimestamp, 100);
  lastTimestamp = timestamp;
  update(delta); draw(); requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
  if (event.code === 'Enter' && !missionStarted) { startMission(); event.preventDefault(); return; }
  if (event.code === 'ArrowLeft') { keys.left = true; event.preventDefault(); }
  if (event.code === 'ArrowRight') { keys.right = true; event.preventDefault(); }
  if (event.code === 'Space') { if (!keys.firing) shoot(); keys.firing = true; event.preventDefault(); }
  if (event.code === 'KeyR' && gameOver) resetGame();
});
document.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowLeft') keys.left = false;
  if (event.code === 'ArrowRight') keys.right = false;
  if (event.code === 'Space') keys.firing = false;
});
restartButton.addEventListener('click', resetGame);
difficultyElement.addEventListener('change', resetGame);
function startMission() {
  missionStarted = true;
  missionIntroElement.hidden = true;
  lastTimestamp = performance.now();
}
startButton.addEventListener('click', startMission);
resetGame();
requestAnimationFrame(gameLoop);
