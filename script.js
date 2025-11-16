//varijable za cigle
const ROWS = 5;
const COLUMNS = 10;
const BRICK_WIDTH = 40;
const BRICK_HEIGHT = 15;
const BRICK_COLORS = [
    "rgb(153, 51, 0)",   
    "rgb(255, 0, 0)",    
    "rgb(255, 153, 204)",
    "rgb(0, 255, 0)",    
    "rgb(255, 255, 153)" 
];
let bricks = [];

//varijable za palicu
const PADDLE_WIDTH = 60;
const PADDLE_HEIGHT = 15;
let PADDLE_SPEED = 7;
let paddleX;
let paddleY;
let rightPressed = false;
let leftPressed = false;

//varijable za lopticu
const BALL_SIZE = 10;
let BALL_SPEED = 4;
let ballX;
let ballY;
//sluzi za odbijanje loptice
let ballSpeedX;
let ballSpeedY;

let score = 0;
let highScore = 0;

//start, playing, gameOver, win
let currentState = "start";

//inicijalizacija 
window.onload = function () {

    var lastHighScore = localStorage.getItem("highestScore"); //dohvat iz localStorage
    if (lastHighScore !== null) highScore = parseInt(lastHighScore, 10); //jer je iz localStorage string

    //postavljanje event listenera za tipke
    document.addEventListener("keydown", e => handlePressedKey(e, true));
    document.addEventListener("keyup", e => handlePressedKey(e, false));

    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");

    //pokretanje game loopa
    setInterval(checkState, 20);

    //postavljanje palice na sredinu
    paddleX = (canvas.width - PADDLE_WIDTH) / 2;
    paddleY = canvas.height - 40;

    initBricks();
};

//kreira i pozicionira sve cigle
function initBricks() {
    bricks = [];
    var totalWidth = COLUMNS * BRICK_WIDTH + (COLUMNS - 1) * 30; //ukljucujuci razmake
    var marginLeft = (canvas.width - totalWidth) / 2; //centriranje cigli

    for (var r = 0; r < ROWS; r++) {
        bricks[r] = [];
        for (var c = 0; c < COLUMNS; c++) {
            bricks[r][c] = {
                x: marginLeft + c * (BRICK_WIDTH + 30),
                y: 60 + r * (BRICK_HEIGHT + 15),
                alive: true,
                color: BRICK_COLORS[r]
            };
        }
    }
}


//postavljanje loptice i palice na sredinu i dajemo loptici pocetni smjer
function setBP() {

    BALL_SPEED = 4; //reset brzine loptice
    paddleX = (canvas.width - PADDLE_WIDTH) / 2;
    paddleY = canvas.height - 40;

    //loptica u sredini palice
    ballX = paddleX + PADDLE_WIDTH / 2 - BALL_SIZE / 2;
    ballY = paddleY - BALL_SIZE - 2;

    //slucajni smjer
    var dir = Math.random() < 0.5 ? -1 : 1;
    ballSpeedX = dir * BALL_SPEED;
    ballSpeedY = -BALL_SPEED;
}

//obrada tipki
function handlePressedKey(e, isDown) {
    const code = e.code;

    //lijevo/desno za pomicanje palice
    if (code === "ArrowRight") rightPressed = isDown;
    else if (code === "ArrowLeft") leftPressed = isDown;

    //space za start/replay
    else if (code === "Space" && isDown && (currentState === "start" || currentState === "gameOver" || currentState === "win")) {
        score = 0;
        initBricks();
        setBP();
        currentState = "playing";
    }

    e.preventDefault();
}

//zove se svakih 20 ms
function checkState() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //brisi ekran
    if (currentState === "start") {
        drawStart();
    } else if (currentState === "playing") {
        updateGame();
        drawGame();
    } else if (currentState === "gameOver") {
        drawGame();
        drawGameOver();
    } else if (currentState === "win") {
        drawGame();
        drawWin();
    }
}

//update igre u jednom koraku
function updateGame() {
    
    //kretanje palice
    if (rightPressed) paddleX = Math.min(paddleX + PADDLE_SPEED, canvas.width - PADDLE_WIDTH);
    if (leftPressed) paddleX = Math.max(paddleX - PADDLE_SPEED, 0);
    
    var beforeBallx = ballX;
    var beforebally = ballY;

    //kretanje loptice
    ballX += ballSpeedX;
    ballY += ballSpeedY; 

    var maxX = canvas.width - BALL_SIZE; //maksimalni x loptice

    //lijevi i desni rub
    if (ballX < 0) {
        ballX = 0;
        ballSpeedX = -ballSpeedX;
    } else if (ballX > maxX) {
        ballX = maxX;
        ballSpeedX = -ballSpeedX;
    }

    //gornji rub
    if (ballY < 0) {
        ballY = 0;
        ballSpeedY = -ballSpeedY;
    }

    //sudar s palicom ali samo kas loptica pada
    var ballBottom = ballY + BALL_SIZE;
    var paddleRight = paddleX + PADDLE_WIDTH;

    //provjera sudara
    if (ballBottom >= paddleY && ballBottom <= paddleY + PADDLE_HEIGHT && ballX + BALL_SIZE > paddleX && ballX < paddleRight && ballSpeedY > 0) {
        
        //odbijanje loptice
        ballSpeedY = -BALL_SPEED;

        //odskok lijevo/desno ovisno o dijelu palice
        var ballCenterX  = ballX + BALL_SIZE / 2;
        var paddleSection = PADDLE_WIDTH / 3;

        if (ballCenterX  < paddleX + paddleSection) {
            ballSpeedX = -BALL_SPEED; //lijevi dio
        } else if (ballCenterX  > paddleRight - paddleSection) {
            ballSpeedX = BALL_SPEED; //desni dio
        } else {
            ballSpeedX = 0; //sredina palice
        }
    }

    //ako padne na dno
    if (ballY > canvas.height) {
        updatehighScore();
        currentState = "gameOver";
        return;
    }

    //sudar s ciglom
    checkBrickHit(beforeBallx, beforebally);

    //win stanje
    if (score === ROWS * COLUMNS) {
        updatehighScore();
        currentState = "win";
    }
}

//sudar s ciglom
function checkBrickHit(oldBallX, oldBallY) {

    for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLUMNS; c++) {
            var b = bricks[r][c];
            if (!b.alive) continue;

            //jel udrila ciglu
            var hit = ballX < b.x + BRICK_WIDTH && ballX + BALL_SIZE > b.x && ballY < b.y + BRICK_HEIGHT && ballY + BALL_SIZE > b.y;
            if (!hit) continue;

            b.alive = false;
            score += 1;

            //pogodak 
            var hitY = oldBallY + BALL_SIZE <= b.y || oldBallY >= b.y + BRICK_HEIGHT;
            var hitX = oldBallX + BALL_SIZE <= b.x || oldBallX >= b.x + BRICK_WIDTH;

            //udrilo kut
            var hitCorner = hitY && hitX;

            if (hitCorner) {
                BALL_SPEED = Math.min(BALL_SPEED + 0.5, 10); //povecavamo brzinu loptice
                const signX = ballSpeedX >= 0 ? 1 : -1;
                const signY = ballSpeedY >= 0 ? 1 : -1;
                ballSpeedX = -signX * BALL_SPEED;
                ballSpeedY = -signY * BALL_SPEED;
            } else if (hitY) {
                ballSpeedY = -ballSpeedY; //samo mjenjamo smjer y
            } else {
                ballSpeedX = -ballSpeedX; //samo mjenjamo smjer x
            }

            return;
        }
    }
}

//crtanje igre
function drawGame() {
    //cigle
    for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLUMNS; c++) {
            var b = bricks[r][c];
            if (b.alive) {
                drawShadow(b.x, b.y, BRICK_WIDTH, BRICK_HEIGHT, b.color);
            }
        }
    }

    //palica
    drawShadow(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT, "rgba(255, 255, 255, 1)");
    //loptica
    drawShadow(ballX, ballY, BALL_SIZE, BALL_SIZE, "rgb(255,255,255)");
    //score
    drawScores();
}

//crtanje sjene
function drawShadow(x, y, w, h, color) {
    ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

//start ekran
function drawStart() {
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.font = "bold 36px Helvetica, Verdana, sans-serif";
    const centerX = canvas.width / 2;
    const textY = canvas.height / 2;
    ctx.fillText("BREAKOUT", centerX, textY - 20);
    ctx.font = "bold italic 18px Helvetica, Verdana, sans-serif";
    ctx.fillText("Press SPACE to begin", centerX, textY + 10);
    drawScores();
}

//game over ekran
function drawGameOver() {
    ctx.fillStyle = "yellow";
    ctx.textAlign = "center";
    ctx.font = "bold 40px Helvetica, Verdana, sans-serif";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "bold 18px Helvetica, Verdana, sans-serif";
    ctx.fillText("Press SPACE to play again", canvas.width / 2, canvas.height / 2 + 40);
}

//win ekran
function drawWin() {
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "bold 40px Helvetica, Verdana, sans-serif";
    ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2);
    ctx.font = "bold 18px Helvetica, Verdana, sans-serif";
    ctx.fillText("Press SPACE to play again", canvas.width / 2, canvas.height / 2 + 40);
}

//score u kutu
function drawScores() {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Helvetica, Verdana, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 20, 20);
    ctx.textAlign = "right";
    ctx.fillText("Max: " + highScore, canvas.width - 100, 20);
}
 
//vadimo najbolji score
function updatehighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highestScore", highScore);
    }
}
