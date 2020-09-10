const canvas = document.getElementById("cnvs");
const newGameBtn = document.getElementById("new-game-btn");
const scoreDiv = document.getElementById("score");

const platformColor = "#a19da0";
const platformBorderColor = "#a19da0";
const ballColor = "#e6ca17";

const gameState = {};

const walls = {};

newGameBtn.addEventListener('click', () => {
  setup();
  run();
  newGameBtn.hidden = true;
})

function onMouseMove(e) {
  gameState.pointer.x = e.pageX;
  gameState.pointer.y = e.pageY;
}

function queueUpdates(numTicks) {
  for (let i = 0; i < numTicks; i++) {
    gameState.lastTick = gameState.lastTick + gameState.tickLength;
    update(gameState.lastTick);
  }
}

function draw(tFrame) {
  const context = canvas.getContext("2d");

  // clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawPlatform(context);
  drawBall(context);
}

function update(tick) {
  const vx = (gameState.pointer.x - gameState.player.x) / 10;
  gameState.player.x += vx;

  setBallSpeed();
  const ball = gameState.ball;
  ball.y += ball.vy * gameState.speed.vy;
  ball.x += ball.vx * gameState.speed.vx;
}

function touchedTop() {
  const ball = gameState.ball;
  return ball.vy < 0 && ball.y - ball.radius <= 0;
}

function touchedBottom() {
  const ball = gameState.ball;
  return ball.vy > 0 && ball.y + ball.radius >= canvas.height;
}

function touchedLeft() {
  const ball = gameState.ball;
  return ball.vx < 0 && ball.x - ball.radius <= 0;
}

function touchedRight() {
  const ball = gameState.ball;
  return ball.vx > 0 && ball.x + ball.radius >= canvas.width;
}

const touchMode = { None: 0, Left: 1, Middle: 2, Right: 3 };

function touchedPlatform() {
  const ball = gameState.ball;
  const player = gameState.player;

  const halfW = player.width / 2;
  const halfH = player.height / 2;
  const playerLeftX = player.x - halfW;
  const playerRightX = player.x + halfW;
  const playerTopY = player.y - halfH;

  if (ball.x >= playerLeftX && ball.x <= playerRightX) {
    const dist = playerTopY - ball.y;
    if (dist <= ball.radius) {
      return true;
    }
  }
  else if (ball.y < playerTopY && playerTopY - ball.y < ball.radius) {
    const distY = playerTopY - ball.y;
    let distX = 0;
    if (ball.x < playerLeftX) {
      distX = ball.x - playerLeftX;
    } else {
      distX = ball.x - playerRightX;
    }
    const dist = Math.sqrt(distY*distY + distX*distX);
    return dist < ball.radius;
  } 
}

function setBallSpeed() {
  const ball = gameState.ball;
  if (touchedTop()) {
    ball.vy *= -1;
  }
  if (touchedLeft()) {
    ball.vx *= -1;
  }
  if (touchedRight()) {
    ball.vx *= -1;
  }
  if (ball.vy > 0 && touchedPlatform()) {
    ball.vy *= -1;
  }
  if (touchedBottom()) {
    stopGame(gameState.stopCycle);
  }
}

function run(tFrame) {
  gameState.stopCycle = window.requestAnimationFrame(run);

  const nextTick = gameState.lastTick + gameState.tickLength;
  let numTicks = 0;

  if (tFrame > nextTick) {
    const timeSinceTick = tFrame - gameState.lastTick;
    numTicks = Math.floor(timeSinceTick / gameState.tickLength);
  }
  queueUpdates(numTicks);
  draw(tFrame);
  gameState.lastRender = tFrame;
}

function stopGame(handle) {
  newGameBtn.hidden = false;
  window.cancelAnimationFrame(handle);
  window.clearInterval(gameState.scoreTimer);
  window.clearInterval(gameState.speedTimer);  
}

function drawPlatform(context) {
  const { x, y, width, height } = gameState.player;
  context.beginPath();
  context.rect(x - width / 2, y - height / 2, width, height);
  context.fillStyle = platformColor;
  context.fill();
  context.strokeStyle = platformBorderColor;
  context.lineWidth = 2;
  context.stroke();
  context.closePath();
}

function drawBall(context) {
  const { x, y, radius } = gameState.ball;

  const q = radius / 4;
  let grad = context.createRadialGradient(x + q, y - q, 1, x, y, radius);
  grad.addColorStop(0, 'white');
  grad.addColorStop(1, ballColor);
  
  

  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = grad;
  context.fill();
  context.closePath();
}

function setup() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  scoreDiv.innerText = 0;

  canvas.addEventListener("mousemove", onMouseMove, false);

  gameState.lastTick = performance.now();
  gameState.lastRender = gameState.lastTick;
  gameState.tickLength = 15; //ms

  gameState.score = 0;
  gameState.speed = { vx: 5, vy: 5 };

  gameState.scoreTimer = window.setInterval(() => {
    gameState.score += 1;
    scoreDiv.innerText = gameState.score;
  }, 1000);

  gameState.speedTimer = window.setInterval(() => {
    gameState.speed.vx *= 1.1;
    gameState.speed.vy *= 1.1;
  }, 15000);

  const platform = {
    width: 400,
    height: 50,
  };

  gameState.player = {
    x: 100,
    y: canvas.height - platform.height / 2,
    width: platform.width,
    height: platform.height,
  };
  gameState.pointer = {
    x: 0,
    y: 0,
  };
  gameState.ball = {
    x: canvas.width / 2,
    y: 0,
    radius: 25,
    vx: 1,
    vy: 1,
  };

  walls.leftWall = {
    x: 0,
    y: canvas.height / 2,
    width: 1,
    height: canvas.height,
  };
  walls.rightWall = {
    x: canvas.width,
    y: canvas.height / 2,
    width: 1,
    height: canvas.height,
  };
  walls.topWall = { x: canvas.width / 2, y: 0, width: canvas.width, height: 2 };
}

// setup();
// run();
