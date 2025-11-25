let spriteSheet;
let walkSpriteSheet;
let runSpriteSheet;
let jumpSpriteSheet;
let shootSpriteSheet;
let projectileSpriteSheet;
let shootFrameWidth;
let shootFrameHeight;
let projFrameWidth;
let projFrameHeight;
let frameWidth;
let frameHeight;
let walkFrameWidth;
let walkFrameHeight;
let runFrameWidth;
let runFrameHeight;
let jumpFrameWidth;
let jumpFrameHeight;
let currentFrame = 0;
let frameCount = 0;
let animationSpeed = 10; // 控制播放速度，值越小越快
let isWalking = false;
let isRunning = false;
let isJumping = false;
let shiftPressed = false;
let isFinishingRun = false; // 標記是否在完成跑步動畫
let isFinishingJump = false; // 標記是否在完成跳躍動畫
let isShooting = false;
let shootCurrentFrame = 0;
let shootFrameTimer = 0;
let shootFrameSpeed = 6;
let walkDirection = 1; // 1 = 向右, -1 = 向左
let characterDirection = 1; // 1 = 向右, -1 = 向左（持續方向）
let characterScale = 2; // 角色放大倍數
let characterX = 0; // 角色 X 位置
let characterY = 0; // 角色 Y 位置
let moveSpeed = 5; // 走路速度
let runSpeed = 8; // 跑步速度
// 子彈系統
let bullets = []; // 每個子彈: {stage:'attach'|'fly', dir, frameIndex, timer, x, y, vx}
let bulletAnimSpeed = 8;
let bulletSpeed = 12;
let lastFireTime = 0;
let fireRate = 160; // ms, 按住空白時的持續開火速率

function preload() {
  spriteSheet = loadImage('不動/不動.png');
  walkSpriteSheet = loadImage('走/走.png');
  runSpriteSheet = loadImage('跑/跑.png');
  jumpSpriteSheet = loadImage('跳/跳.png');
  shootSpriteSheet = loadImage('射/射.png');
  projectileSpriteSheet = loadImage('彈/彈.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 不動：6 個圖像排成一排
  frameWidth = spriteSheet.width / 6;
  frameHeight = spriteSheet.height;
  // 走：12 個圖像排成一排
  walkFrameWidth = walkSpriteSheet.width / 12;
  walkFrameHeight = walkSpriteSheet.height;
  // 跑：10 個圖像排成一排
  runFrameWidth = runSpriteSheet.width / 10;
  runFrameHeight = runSpriteSheet.height;
  // 跳：15 個圖像排成一排
  jumpFrameWidth = jumpSpriteSheet.width / 15;
  jumpFrameHeight = jumpSpriteSheet.height;
  // 射：5 個圖像排成一排
  shootFrameWidth = shootSpriteSheet.width / 5;
  shootFrameHeight = shootSpriteSheet.height;
  // 彈：4 個圖像排成一排
  projFrameWidth = projectileSpriteSheet.width / 4;
  projFrameHeight = projectileSpriteSheet.height;
  
  // 初始化角色位置為螢幕中心
  characterX = windowWidth / 2;
  characterY = windowHeight / 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);
  
  // 根據按下的鍵更新位置
  let currentSpeed = isRunning ? runSpeed : moveSpeed;
  if (keyIsDown(LEFT_ARROW)) {
    characterX -= currentSpeed;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    characterX += currentSpeed;
  }
  if (keyIsDown(UP_ARROW)) {
    characterY -= currentSpeed;
  }
  if (keyIsDown(DOWN_ARROW)) {
    characterY += currentSpeed;
  }
  
  // 按住空白時自動連發 (fireRate)
  if (keyIsDown(32)) {
    let now = millis();
    if (now - lastFireTime >= fireRate) {
      spawnBullet();
      lastFireTime = now;
      // 觸發射擊動畫
      isShooting = true;
      shootCurrentFrame = 0;
      shootFrameTimer = 0;
    }
  }

  // 計算顯示尺寸
  let displayWidth = frameWidth * characterScale;
  let displayHeight = frameHeight * characterScale;
  
  // 根據角色位置計算繪製位置（中心點對齐）
  let drawX = characterX - displayWidth / 2;
  let drawY = characterY - displayHeight / 2;
  
  // 保存畫布狀態
  push();
  
  // 根據方向進行水平翻轉
  if (characterDirection === -1) {
    translate(drawX + displayWidth / 2, drawY);
    scale(-1, 1);
    translate(-displayWidth / 2, 0);
  } else {
    translate(drawX, drawY);
  }
  
  // 顯示當前幀 (射擊優先)
  let sx, srcWidth, srcHeight;
  if (isShooting) {
    // 射擊動畫：5 幀
    sx = shootCurrentFrame * shootFrameWidth;
    srcWidth = shootFrameWidth;
    srcHeight = shootFrameHeight;
    image(shootSpriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, shootFrameWidth, shootFrameHeight);
  } else if (isJumping || isFinishingJump) {
    // 跳躍動畫邏輯
    let jumpFrame = currentFrame;
    if (!isFinishingJump) {
      // 跳躍按下時：第 1-9 幀，然後循環第 6-9 幀
      if (currentFrame < 9) {
        jumpFrame = currentFrame;
      } else {
        // 循環第 6-9 幀（索引 5-8）
        jumpFrame = 5 + ((currentFrame - 9) % 4);
      }
    } else {
      // 跳躍放開時：播放第 10-15 幀（索引 9-14）
      jumpFrame = 9 + currentFrame;
    }
    sx = jumpFrame * jumpFrameWidth;
    srcWidth = jumpFrameWidth;
    srcHeight = jumpFrameHeight;
    image(jumpSpriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, jumpFrameWidth, jumpFrameHeight);
  } else if (isRunning || isFinishingRun) {
    // 跑步動畫邏輯
    let runFrame = currentFrame;
    if (shiftPressed) {
      // Shift 按下時：第 1-5 幀，然後循環第 4-5 幀
      if (currentFrame < 5) {
        runFrame = currentFrame;
      } else {
        // 循環第 4-5 幀（索引 3-4）
        runFrame = 3 + ((currentFrame - 5) % 2);
      }
    } else {
      // Shift 放開時：播放第 6-10 幀（索引 5-9）
      runFrame = 5 + currentFrame;
    }
    sx = runFrame * runFrameWidth;
    srcWidth = runFrameWidth;
    srcHeight = runFrameHeight;
    image(runSpriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, runFrameWidth, runFrameHeight);
  } else if (isWalking) {
    sx = currentFrame * walkFrameWidth;
    srcWidth = walkFrameWidth;
    srcHeight = walkFrameHeight;
    image(walkSpriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, walkFrameWidth, walkFrameHeight);
  } else {
    sx = currentFrame * frameWidth;
    srcWidth = frameWidth;
    srcHeight = frameHeight;
    image(spriteSheet, 0, 0, displayWidth, displayHeight, sx, 0, frameWidth, frameHeight);
  }
  
  // 恢復畫布狀態
  pop();
  
  // ------------------ 子彈更新與繪製 ------------------
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];

    b.timer++;
    if (b.stage === 'attach') {
      if (b.timer >= bulletAnimSpeed) {
        b.timer = 0;
        b.frameIndex++;
        if (b.frameIndex > 2) {
          // 轉為飛行
          b.stage = 'fly';
          b.frameIndex = 3; // 第四幀
          b.vx = b.dir * bulletSpeed;
          // 設定實際起始 x，使用較靠近角色中間的偏移量
          let attachOffset = displayWidth * -0.9; // 往中間靠 -60% 寬度（負值表示往角色反方向偏移）
          if (b.dir === 1) {
            b.x = characterX + attachOffset;
          } else {
            b.x = characterX - attachOffset - projFrameWidth * characterScale;
          }
        }
      }
    } else if (b.stage === 'fly') {
      // 移動
      b.x += b.vx;
    }

    // 計算繪製位置
    let bulletDisplayW = projFrameWidth * characterScale;
    let bulletDisplayH = projFrameHeight * characterScale;
    let bx, by;
    if (b.stage === 'attach') {
      // 顯示在角色邊緣但更靠中間一些
      let attachOffset = displayWidth * -0.6; // 往中間靠 -60% 寬度（負值表示往角色反方向偏移）
      if (b.dir === 1) {
        bx = characterX + attachOffset;
      } else {
        bx = characterX - attachOffset - bulletDisplayW;
      }
      by = characterY - bulletDisplayH / 2;
    } else {
      bx = b.x;
      by = characterY - bulletDisplayH / 2;
    }

    // 繪製子彈（依方向翻轉）
    push();
    if (b.dir === -1) {
      translate(bx + bulletDisplayW / 2, by);
      scale(-1, 1);
      translate(-bulletDisplayW / 2, 0);
      image(projectileSpriteSheet, 0, 0, bulletDisplayW, bulletDisplayH, b.frameIndex * projFrameWidth, 0, projFrameWidth, projFrameHeight);
    } else {
      translate(bx, by);
      image(projectileSpriteSheet, 0, 0, bulletDisplayW, bulletDisplayH, b.frameIndex * projFrameWidth, 0, projFrameWidth, projFrameHeight);
    }
    pop();

    // 移除離開畫面的飛行子彈
    if (b.stage === 'fly') {
      if (b.x > width + 200 || b.x < -200) {
        bullets.splice(i, 1);
      }
    }
  }

  // ------------------ 射擊動畫更新 ------------------
  if (isShooting) {
    shootFrameTimer++;
    if (shootFrameTimer >= shootFrameSpeed) {
      shootFrameTimer = 0;
      shootCurrentFrame++;
      if (shootCurrentFrame >= 5) {
        isShooting = false;
        shootCurrentFrame = 0;
      }
    }
  }
  
  // 更新幀計數
  frameCount++;
  let currentAnimationSpeed = animationSpeed;
  
  // 完成跑步或跳躍動畫時速度不同
  if (isFinishingRun) {
    currentAnimationSpeed = animationSpeed + 5;
  } else if (isFinishingJump) {
    currentAnimationSpeed = animationSpeed - 3; // 跳躍完成動畫更快
  }
  
  if (frameCount >= currentAnimationSpeed) {
    frameCount = 0;
    if (isFinishingJump) {
      // 播放第 10-15 幀（6 幀）
      currentFrame++;
      if (currentFrame >= 6) {
        isFinishingJump = false;
        isJumping = false;
        currentFrame = 0;
      }
    } else if (isJumping) {
      // 播放第 1-9 幀，然後循環第 6-9 幀
      if (currentFrame < 8) {
        currentFrame++;
      } else {
        currentFrame++;
      }
    } else if (isFinishingRun) {
      // 播放第 6-10 幀（5 幀）
      currentFrame++;
      if (currentFrame >= 5) {
        isFinishingRun = false;
        isRunning = false;
        currentFrame = 0;
      }
    } else if (isRunning) {
      if (shiftPressed) {
        // Shift 按下時：播放第 1-5 幀，然後循環第 4-5 幀
        if (currentFrame < 4) {
          currentFrame++;
        } else {
          currentFrame++;
        }
      } else {
        currentFrame++;
      }
    } else if (isWalking) {
      currentFrame = (currentFrame + 1) % 12;
    } else {
      currentFrame = (currentFrame + 1) % 6;
    }
  }
}

function keyPressed() {
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    isWalking = true;
    walkDirection = keyCode === RIGHT_ARROW ? 1 : -1;
    characterDirection = walkDirection;
    currentFrame = 0;
    frameCount = 0;
    return false;
  }
  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    isJumping = true;
    currentFrame = 0;
    frameCount = 0;
    return false;
  }
  if (keyCode === SHIFT) {
    if (isWalking) {
      isRunning = true;
      shiftPressed = true;
      currentFrame = 0;
      frameCount = 0;
    }
    return false;
  }
  // 空白鍵觸發射擊（單次）
  if (key === ' ' || keyCode === 32) {
    spawnBullet();
    // 觸發射擊動畫
    isShooting = true;
    shootCurrentFrame = 0;
    shootFrameTimer = 0;
    return false;
  }
}

function spawnBullet() {
  // 建立一個子彈物件，前三幀為 attach（跟隨角色邊緣顯示），第 4 幀飛行
  let b = {
    stage: 'attach',
    dir: characterDirection,
    frameIndex: 0,
    timer: 0,
    x: 0,
    y: 0,
    vx: 0
  };
  bullets.push(b);
}

function keyReleased() {
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    // 如果正在播放跑步動畫（無論 Shift 是否按下），都要完成第 6-10 幀
    if (isRunning || isFinishingRun) {
      isWalking = false;
      if (!isFinishingRun) {
        // 如果還沒開始播放第 6-10 幀，就開始
        isFinishingRun = true;
        isRunning = false;
        currentFrame = 0;
        frameCount = 0;
      }
      // 如果已經在播放第 6-10 幀，繼續播放
    } else {
      isWalking = false;
      isRunning = false;
      isFinishingRun = false;
      currentFrame = 0;
      frameCount = 0;
    }
    return false;
  }
  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    // 如果正在跳躍，完成跳躍動畫
    if (isJumping) {
      isFinishingJump = true;
      isJumping = false;
      currentFrame = 0;
      frameCount = 0;
    }
    return false;
  }
  if (keyCode === SHIFT) {
    shiftPressed = false;
    if (isRunning) {
      // 開始播放第 6-10 幀
      isFinishingRun = true;
      isRunning = false;
      currentFrame = 0;
      frameCount = 0;
    }
    return false;
  }
}
