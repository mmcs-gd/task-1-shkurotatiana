const canvas = document.getElementById("cnvs");
const newGameBtn = document.getElementById("new-game-btn");
const scoreDiv = document.getElementById("score");

const platformColor = "#a19da0";
const platformBorderColor = "#a19da0";
const ballColor = "#e6ca17";

const bonusColors = [
  '#a3ff9e', '#85ff85', '#70ff7e', '#5cff7d', '#47ff7e', '#2cf57d', '#12eb7f',
  '#2cf57d', '#47ff7e', '#5cff7d', '#70ff7e', '#85ff85'
];

let curBonusColor = 0;

const gameState = {};

const walls = {};

newGameBtn.addEventListener("click", () => {
  setup();
  run();
  newGameBtn.hidden = true;
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

  if (Math.abs(bonus.x - bonus.nextX) < 0.1 || Math.abs(bonus.y - bonus.nextY) < 0.1) {
    bonus.nextX = bonus.getNextX();
    bonus.nextY = bonus.getNextY();    
    bonus.vx = (bonus.nextX - bonus.x) / 70;
    bonus.vy = (bonus.nextY - bonus.y) / 70;  
  }

  bonus.x += bonus.vx;
  bonus.y += bonus.vy;
  bonus.checkTouchedBottom();
  bonus.checkTouchedPlatform();
}

function update(tick) {
  const vx = (gameState.pointer.x - gameState.player.x) / 10;
  gameState.player.x += vx;

  setBallSpeed();
  const ball = gameState.ball;
  ball.y += ball.vy;
  ball.x += ball.vx;

  if (gameState.bonus.isActive) {
    moveBonus();
  }
}

function setBallSpeed() {
  const ball = gameState.ball;
  if (ball.touchedTop()) {
    ball.vy *= -1;
  }
  if (ball.touchedLeft()) {
    ball.vx *= -1;
  }
  if (ball.touchedRight()) {
    ball.vx *= -1;
  }
  if (ball.vy > 0 && ball.touchedPlatform()) {
    ball.vy *= -1;
  }
  if (ball.touchedBottom()) {
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
  window.clearInterval(gameState.bonusTimer);
  window.clearInterval(gameState.bonusColorTimer); 
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
  grad.addColorStop(0, "white");
  grad.addColorStop(1, ballColor);

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
    context.fillStyle = bonusColors[curBonusColor];
    context.fill();
  }
}

function increaseScore(value) {
  gameState.score += value;
  scoreDiv.innerText = gameState.score;
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
    width: 400,
    height: 30,
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
    vx: 5,
    vy: 5,

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

      if (ball.x >= playerLeftX && ball.x <= playerRightX) {
        const dist = playerTopY - ball.y;
        if (dist <= ball.radius) {
          return true;
        }
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
  };

  gameState.bonus = {
    isActive: false,
    x: 0,
    y: 0,
    size: 50,
    getNextX: () => {
      let random = gameState.bonus.x + (Math.random() > 0.5 ? 1 : -1) * canvas.width / 5;
      while (random < 0 || random > canvas.width) {
        random = gameState.bonus.x + (Math.random() > 0.5 ? 1 : -1) * canvas.width / 5;
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
      
      // lower square touched the platform
      if (bottomY >= playerTopY && bottomX1 > playerLeftX && bottomX2 < playerRightX) {
        bonus.isActive = false;
        increaseScore(15);
        return;
      }
      // left square touched the platform
      if (sideY >= playerTopY && leftX < playerRightX && rightX > playerRightX) {
        bonus.isActive = false;
        increaseScore(15);
        return;
      }
      // right square touched the platform
      if (sideY >= playerTopY && rightX > playerLeftX && leftX < playerLeftX) {
        bonus.isActive = false;
        increaseScore(15);
        return;
      }
    }
  };

  gameState.scoreTimer = window.setInterval(() => {
    increaseScore(1);
  }, 1000);

  gameState.speedTimer = window.setInterval(() => {
    gameState.ball.vx *= 1.1;
    gameState.ball.vy *= 1.1;
  }, 15000);

  gameState.bonusTimer = window.setInterval(() => {
    if (! gameState.bonus.isActive) {
    gameState.bonus.isActive = true;
    gameState.bonus.x = Math.random() * canvas.width;
    gameState.bonus.y = 0;
    gameState.bonus.nextX = gameState.bonus.x;
    gameState.bonus.nextY = 0;
    }
  }, 15000);

  gameState.bonusColorTimer = window.setInterval(() => {
    curBonusColor += 1;
    if (curBonusColor >= bonusColors.length) {
      curBonusColor = 0;
    }
  }, 200);
}
