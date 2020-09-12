const canvas = document.getElementById("cnvs");
const newGameBtn = document.getElementById("new-game-btn");
const scoreDiv = document.getElementById("score");
const scoreAnimDiv = document.getElementById("score-anim");
//#region Colors
const PLATFORM_COLOR = "#a19da0";
const PLATFORM_BORDER_COLOR = "#a19da0";
const BALL_COLOR = "#e6ca17";

const BONUS_COLORS = [
  "#a3ff9e",
  "#85ff85",
  "#70ff7e",
  "#5cff7d",
  "#47ff7e",
  "#2cf57d",
  "#12eb7f",
  "#2cf57d",
  "#47ff7e",
  "#5cff7d",
  "#70ff7e",
  "#85ff85",
];
let curBonusColor = 0;
//#endregion

const TOTAL_BALL_START_SPEED = 5;

const gameState = {};

newGameBtn.addEventListener("click", () => {
  setup();
  run();
  newGameBtn.style.display = "none";
});

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
  drawBonus(context);
}

function moveBonus() {
  const bonus = gameState.bonus;

  if (
    Math.abs(bonus.x - bonus.nextX) < 0.1 ||
    Math.abs(bonus.y - bonus.nextY) < 0.1
  ) {
    bonus.nextX = bonus.getNextX();
    bonus.nextY = bonus.getNextY();
    bonus.vx = (bonus.nextX - bonus.x) / 50;
    bonus.vy = (bonus.nextY - bonus.y) / 50;
  }

  bonus.x += bonus.vx;
  bonus.y += bonus.vy;
  bonus.checkTouchedBottom();
  bonus.checkTouchedPlatform();
}

function update(tick) {
  const vx = (gameState.pointer.x - gameState.player.x) / 10;
  gameState.player.prevX = gameState.player.x;
  gameState.player.x += vx;

  moveBall();

  if (gameState.bonus.isActive) {
    moveBonus();
  }
}

function moveBall() {
  const ball = gameState.ball;

  if (ball.touchedBottom()) {
    stopGame(gameState.stopCycle);
  } else if (ball.touchedTop()) {
    ball.vy *= -1;
  } else if (ball.touchedLeft() || ball.touchedRight()) {
    ball.vx *= -1;
  } else {
    if (ball.vy > 0 && ball.touchedPlatform()) {
      ball.setBallSpeed();
    }
  }

  ball.y += ball.vy;
  ball.x += ball.vx;
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
  newGameBtn.style.display = "block";

  window.cancelAnimationFrame(handle);
  window.clearInterval(gameState.scoreTimer);
  window.clearInterval(gameState.speedTimer);
  window.clearInterval(gameState.bonusTimer);
  window.clearInterval(gameState.bonusColorTimer);
}

function drawPlatform(context) {
  const { x, y, width, height } = gameState.player;
  context.beginPath();
  context.rect(x - width / 2, y - height / 2, width, height);
  context.fillStyle = PLATFORM_COLOR;
  context.fill();
  context.strokeStyle = PLATFORM_BORDER_COLOR;
  context.lineWidth = 2;
  context.stroke();
  context.closePath();
}

function drawBall(context) {
  const { x, y, radius } = gameState.ball;

  const q = radius / 4;
  let grad = context.createRadialGradient(x + q, y - q, 1, x, y, radius);
  grad.addColorStop(0, "white");
  grad.addColorStop(1, BALL_COLOR);

  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = grad;
  context.fill();
  context.closePath();
}

function drawBonus(context) {
  const { x, y, size, isActive } = gameState.bonus;
  if (isActive) {
    const tailSize = size / 3;

    context.beginPath();
    context.rect(x - tailSize * 0.5, y - tailSize * 1.5, tailSize, size);
    context.rect(x - tailSize * 1.5, y - tailSize * 0.5, size, tailSize);
    context.fillStyle = BONUS_COLORS[curBonusColor];
    context.fill();
  }
}

function increaseScore(value) {
  gameState.score += value;
  scoreDiv.innerText = gameState.score;
}

function getRandomFromRange(min, max) {
  return min + Math.random() * (max - min);
}

function getBallStartSpeed() {
  const angle = (getRandomFromRange(0, 60) * Math.PI) / 180;
  const vx = TOTAL_BALL_START_SPEED * Math.sin(angle);
  const vy = TOTAL_BALL_START_SPEED * Math.cos(angle);
  return { vx, vy };
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

  const platform = {
    width: 300,
    height: 30,
  };

  gameState.player = {
    x: 100,
    y: canvas.height - platform.height / 2,
    width: platform.width,
    height: platform.height,
    prevX: 100
  };

  gameState.pointer = {
    x: 0,
    y: 0,
  };

  const speed = getBallStartSpeed();
  gameState.ball = {
    x: Math.random() * canvas.width,
    y: 0,
    radius: 25,
    vx: speed.vx,
    vy: speed.vy,

    touchedTop: () => {
      const ball = gameState.ball;
      return ball.vy < 0 && ball.y - ball.radius <= 0;
    },

    touchedBottom: () => {
      const ball = gameState.ball;
      return ball.vy > 0 && ball.y + ball.radius >= canvas.height;
    },

    touchedLeft: () => {
      const ball = gameState.ball;
      return ball.vx < 0 && ball.x - ball.radius <= 0;
    },

    touchedRight: () => {
      const ball = gameState.ball;
      return ball.vx > 0 && ball.x + ball.radius >= canvas.width;
    },

    touchedPlatform: () => {
      const ball = gameState.ball;
      const player = gameState.player;

      const halfW = player.width / 2;
      const halfH = player.height / 2;
      const playerLeftX = player.x - halfW;
      const playerRightX = player.x + halfW;
      const playerTopY = player.y - halfH;

      // ball is above the platform
      if (ball.x >= playerLeftX && ball.x <= playerRightX) {
        const dist = playerTopY - ball.y;
        return dist <= ball.radius;
      // ball is touching left/right side of a platform
      } else if (ball.y < playerTopY && playerTopY - ball.y < ball.radius) {
        const distY = playerTopY - ball.y;
        let distX = 0;
        if (ball.x < playerLeftX) {
          distX = ball.x - playerLeftX;
        } else {
          distX = ball.x - playerRightX;
        }
        const dist = Math.sqrt(distY * distY + distX * distX);
        return dist < ball.radius;
      }
    },
    setBallSpeed: () => {
      const ball = gameState.ball;
      let angle = Math.atan(Math.abs(ball.vy) / Math.abs(ball.vx));
      const total = Math.abs(ball.vy) / Math.sin(angle);

      const platformVx = gameState.player.x - gameState.player.prevX;

      const tmpVx = ball.vx + platformVx;
      const tmpVy = ball.vy * -1;
      angle = Math.atan(Math.abs(tmpVy) / Math.abs(tmpVx));
      ball.vx = total * Math.cos(angle) * Math.sign(tmpVx);
      ball.vy = total * Math.sin(angle) * Math.sign(tmpVy);
    }
  };

  gameState.bonus = {
    isActive: false,
    x: 0,
    y: 0,
    size: 50,
    getNextX: () => {
      let random =
        gameState.bonus.x + ((Math.random() > 0.5 ? 1 : -1) * canvas.width) / 5;
      while (random < 0 || random > canvas.width) {
        random =
          gameState.bonus.x +
          ((Math.random() > 0.5 ? 1 : -1) * canvas.width) / 5;
      }
      return random;
    },
    getNextY: () => gameState.bonus.y + canvas.height / 10,
    vx: 3,
    vy: 3,
    checkTouchedBottom: () => {
      const bonus = gameState.bonus;
      if (bonus.y + bonus.size / 2 >= canvas.height) {
        bonus.isActive = false;
      }
    },

    checkTouchedPlatform: () => {
      const bonus = gameState.bonus;
      const tailSize = bonus.size / 3;
      const bottomY = bonus.y + bonus.size / 2;
      const bottomX1 = bonus.x - tailSize;
      const bottomX2 = bonus.x + tailSize;

      const sideY = bonus.y + tailSize;
      const leftX = bonus.x - bonus.size / 2;
      const rightX = bonus.x + bonus.size / 2;

      const player = gameState.player;

      const halfW = player.width / 2;
      const halfH = player.height / 2;
      const playerLeftX = player.x - halfW;
      const playerRightX = player.x + halfW;
      const playerTopY = player.y - halfH;

      if (
        // lower square touched the platform
        (bottomY >= playerTopY &&
          bottomX1 > playerLeftX &&
          bottomX2 < playerRightX) ||
        // left square touched the platform
        (sideY >= playerTopY &&
          leftX < playerRightX &&
          rightX > playerRightX) ||
        // right square touched the platform
        (sideY >= playerTopY &&
          rightX > playerLeftX &&
          leftX < playerLeftX)
      ) {
        bonus.isActive = false;
        scoreAnimDiv.innerText = "+15";
        scoreAnimDiv.style.opacity = "100%";

        increaseScore(15);

        setTimeout(() => {
          scoreAnimDiv.style.opacity = "0%";
        }, 500);
      }
    },
  };

  gameState.scoreTimer = window.setInterval(() => {
    increaseScore(1);
  }, 1000);

  gameState.speedTimer = window.setInterval(() => {
    gameState.ball.vx *= 1.3;
    gameState.ball.vy *= 1.3;
  }, 30000);

  gameState.bonusTimer = window.setInterval(() => {
    if (!gameState.bonus.isActive) {
      gameState.bonus.isActive = true;
      gameState.bonus.x = Math.random() * canvas.width;
      gameState.bonus.y = 0;
      gameState.bonus.nextX = gameState.bonus.x;
      gameState.bonus.nextY = 0;
    }
  }, 15000);

  gameState.bonusColorTimer = window.setInterval(() => {
    curBonusColor += 1;
    if (curBonusColor >= BONUS_COLORS.length) {
      curBonusColor = 0;
    }
  }, 200);
}
