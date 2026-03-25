// Elementos del DOM
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const gameOverlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const gameStatsEl = document.getElementById("gameStats");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const levelElement = document.getElementById("level");
const comboDisplay = document.getElementById("comboDisplay");
const comboCount = document.getElementById("comboCount");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const rankingsList = document.getElementById("rankingsList");
const clearScoresButton = document.getElementById("clearScores");
const floatingScores = document.getElementById("floatingScores");
const wallModeToggle = document.getElementById("wallMode");
const wallModeDesc = document.getElementById("wallModeDesc");
const gridToggle = document.getElementById("gridToggle");

// Configuracion del juego
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Tipos de comida
const FOOD_TYPES = {
    normal: { points: 10, color: '#ef4444', glow: '#fca5a5', border: '#dc2626', shape: 'circle', label: '+10' },
    bonus:  { points: 25, color: '#f59e0b', glow: '#fcd34d', border: '#d97706', shape: 'star', label: '+25', duration: 5000 },
    golden: { points: 50, color: '#a78bfa', glow: '#c4b5fd', border: '#7c3aed', shape: 'diamond', label: '+50', duration: 3000 }
};

// Estado del juego
let gameState = {
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 5, y: 5, type: 'normal' },
    bonusFood: null,
    bonusFoodTimer: null,
    score: 0,
    level: 1,
    foodEaten: 0,
    speed: 140,
    gameActive: false,
    gamePaused: false,
    animationId: null,
    combo: 0,
    lastEatTime: 0,
    comboTimeout: null,
    particles: [],
    wallMode: true,
    showGrid: true,
    startTime: 0,
    maxCombo: 0
};

// Colores de la serpiente por nivel
const snakeThemes = [
    { head: '#10b981', body: '#059669', trail: '#047857' },  // Verde
    { head: '#3b82f6', body: '#2563eb', trail: '#1d4ed8' },  // Azul
    { head: '#f59e0b', body: '#d97706', trail: '#b45309' },  // Naranja
    { head: '#ef4444', body: '#dc2626', trail: '#b91c1c' },  // Rojo
    { head: '#a78bfa', body: '#7c3aed', trail: '#6d28d9' },  // Violeta
    { head: '#ec4899', body: '#db2777', trail: '#be185d' },  // Rosa
    { head: '#06b6d4', body: '#0891b2', trail: '#0e7490' },  // Cyan
    { head: '#f97316', body: '#ea580c', trail: '#c2410c' },  // Naranja fuerte
];

function getSnakeColors() {
    const idx = (gameState.level - 1) % snakeThemes.length;
    return snakeThemes[idx];
}

// Inicializacion
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
    updateHighScore();
    updateRankings();

    if (isMobile()) {
        document.getElementById('mobileControls').style.display = 'block';
    }
});

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

function setupEventListeners() {
    playButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    clearScoresButton.addEventListener('click', clearAllScores);
    document.addEventListener('keydown', handleKeyPress);
    setupMobileControls();
    window.addEventListener('resize', handleResize);

    // Opciones
    wallModeToggle.addEventListener('change', () => {
        gameState.wallMode = wallModeToggle.checked;
        wallModeDesc.textContent = wallModeToggle.checked ? 'Chocas con las paredes' : 'Atraviesas las paredes';
    });

    gridToggle.addEventListener('change', () => {
        gameState.showGrid = gridToggle.checked;
        if (!gameState.gameActive) {
            clearCanvas();
            if (gameState.showGrid) drawGrid();
            drawFood();
            drawSnake();
        }
    });

    // Boton pausa movil
    const mobilePauseBtn = document.getElementById('mobilePauseBtn');
    if (mobilePauseBtn) {
        mobilePauseBtn.addEventListener('click', () => {
            if (gameState.gameActive) togglePause();
            else startGame();
        });
    }
}

function setupMobileControls() {
    const dpadButtons = document.querySelectorAll('.d-pad-btn');
    dpadButtons.forEach(button => {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDirectionInput(button.dataset.direction);
            button.style.background = 'var(--primary)';
        });
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.style.background = '';
        });
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleDirectionInput(button.dataset.direction);
        });
    });
}

function handleResize() {
    if (isMobile()) {
        document.getElementById('mobileControls').style.display = 'block';
    }
}

function handleDirectionInput(direction) {
    if (!gameState.gameActive || gameState.gamePaused) return;
    const d = gameState.direction;
    switch (direction) {
        case 'up':    if (d.y === 0) gameState.nextDirection = { x: 0, y: -1 }; break;
        case 'down':  if (d.y === 0) gameState.nextDirection = { x: 0, y: 1 };  break;
        case 'left':  if (d.x === 0) gameState.nextDirection = { x: -1, y: 0 }; break;
        case 'right': if (d.x === 0) gameState.nextDirection = { x: 1, y: 0 };  break;
    }
}

function handleKeyPress(event) {
    if (!gameState.gameActive) {
        if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            startGame();
            return;
        }
    }
    if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
        return;
    }
    const keyMap = {
        'ArrowUp': 'up', 'KeyW': 'up',
        'ArrowDown': 'down', 'KeyS': 'down',
        'ArrowLeft': 'left', 'KeyA': 'left',
        'ArrowRight': 'right', 'KeyD': 'right'
    };
    if (keyMap[event.code]) {
        event.preventDefault();
        handleDirectionInput(keyMap[event.code]);
    }
}

// --- Juego ---

function initializeGame() {
    resetGameState();
    clearCanvas();
    if (gameState.showGrid) drawGrid();
    drawSnake();
    drawFood();
    showOverlay('Bienvenido!', 'Presiona JUGAR para comenzar o usa ESPACIO');
}

function resetGameState() {
    gameState.snake = [{ x: 10, y: 10 }];
    gameState.direction = { x: 1, y: 0 };
    gameState.nextDirection = { x: 1, y: 0 };
    gameState.score = 0;
    gameState.level = 1;
    gameState.foodEaten = 0;
    gameState.speed = 140;
    gameState.gameActive = false;
    gameState.gamePaused = false;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.lastEatTime = 0;
    gameState.particles = [];
    gameState.bonusFood = null;

    if (gameState.animationId) clearTimeout(gameState.animationId);
    if (gameState.bonusFoodTimer) clearTimeout(gameState.bonusFoodTimer);
    if (gameState.comboTimeout) clearTimeout(gameState.comboTimeout);

    updateScore();
    updateLevel();
    placeFood();
    hideCombo();
}

function startGame() {
    resetGameState();
    gameState.gameActive = true;
    gameState.startTime = Date.now();
    hideOverlay();
    playButton.style.display = 'none';
    pauseButton.style.display = 'inline-flex';
    gameStatsEl.style.display = 'none';
    gameLoop();
}

function togglePause() {
    if (!gameState.gameActive) return;
    gameState.gamePaused = !gameState.gamePaused;
    if (gameState.gamePaused) {
        showOverlay('Pausado', 'Presiona ESPACIO para continuar');
        pauseButton.innerHTML = '<i class="fas fa-play"></i> CONTINUAR';
    } else {
        hideOverlay();
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> PAUSA';
        gameLoop();
    }
}

function showOverlay(title, message) {
    overlayTitle.textContent = title;
    overlayMessage.textContent = message;
    gameOverlay.style.display = 'flex';
}

function hideOverlay() {
    gameOverlay.style.display = 'none';
}

// --- Game loop ---

function gameLoop() {
    if (!gameState.gameActive || gameState.gamePaused) return;

    gameState.direction = { ...gameState.nextDirection };
    moveSnake();

    clearCanvas();
    if (gameState.showGrid) drawGrid();
    drawFood();
    if (gameState.bonusFood) drawBonusFood();
    updateParticles();
    drawParticles();
    drawSnake();

    gameState.animationId = setTimeout(gameLoop, gameState.speed);
}

// --- Renderizado ---

function clearCanvas() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
        const pos = i * gridSize;
        ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(canvas.width, pos); ctx.stroke();
    }
}

function drawSnake() {
    const colors = getSnakeColors();
    const len = gameState.snake.length;

    gameState.snake.forEach((seg, i) => {
        const x = seg.x * gridSize;
        const y = seg.y * gridSize;
        const progress = i / Math.max(len - 1, 1);

        if (i === 0) {
            // Cabeza
            ctx.fillStyle = colors.head;
            roundRect(ctx, x + 1, y + 1, gridSize - 2, gridSize - 2, 5);
            ctx.fill();

            // Brillo cabeza
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            roundRect(ctx, x + 3, y + 2, gridSize - 8, (gridSize - 4) / 2, 3);
            ctx.fill();

            // Ojos
            drawEyes(x, y);
        } else {
            // Cuerpo con gradiente de opacidad
            const alpha = 1 - progress * 0.4;
            ctx.fillStyle = interpolateColor(colors.body, colors.trail, progress, alpha);
            roundRect(ctx, x + 2, y + 2, gridSize - 4, gridSize - 4, 4);
            ctx.fill();
        }
    });
}

function drawEyes(x, y) {
    const d = gameState.direction;
    const eyeSize = 3;
    let positions;

    if (d.x === 1) positions = [[x + 14, y + 4], [x + 14, y + 12]];
    else if (d.x === -1) positions = [[x + 3, y + 4], [x + 3, y + 12]];
    else if (d.y === -1) positions = [[x + 4, y + 3], [x + 12, y + 3]];
    else positions = [[x + 4, y + 14], [x + 12, y + 14]];

    positions.forEach(([ex, ey]) => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex + 1.5, ey + 1.5, eyeSize / 2 + 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(ex + 1.5 + d.x * 0.8, ey + 1.5 + d.y * 0.8, 1.2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawFood() {
    const food = gameState.food;
    const type = FOOD_TYPES[food.type];
    const x = food.x * gridSize + gridSize / 2;
    const y = food.y * gridSize + gridSize / 2;
    const pulse = 1 + Math.sin(Date.now() / 300) * 0.08;
    const r = (gridSize / 2 - 3) * pulse;

    // Glow
    ctx.shadowColor = type.color;
    ctx.shadowBlur = 12;

    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
}

function drawBonusFood() {
    const food = gameState.bonusFood;
    if (!food) return;
    const type = FOOD_TYPES[food.type];
    const x = food.x * gridSize + gridSize / 2;
    const y = food.y * gridSize + gridSize / 2;

    const elapsed = Date.now() - food.spawnTime;
    const remaining = type.duration - elapsed;
    const fadeAlpha = remaining < 1000 ? remaining / 1000 : 1;
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.12;
    const r = (gridSize / 2 - 2) * pulse;

    ctx.globalAlpha = fadeAlpha;
    ctx.shadowColor = type.color;
    ctx.shadowBlur = 16;

    if (food.type === 'golden') {
        // Diamante
        ctx.fillStyle = type.color;
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fill();
    } else {
        // Estrella
        drawStar(ctx, x, y, 5, r, r * 0.5, type.color);
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR, color) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
}

// --- Movimiento ---

function moveSnake() {
    const head = {
        x: gameState.snake[0].x + gameState.direction.x,
        y: gameState.snake[0].y + gameState.direction.y
    };

    // Paredes
    if (gameState.wallMode) {
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver();
            return;
        }
    } else {
        // Atravesar paredes
        if (head.x < 0) head.x = tileCount - 1;
        else if (head.x >= tileCount) head.x = 0;
        if (head.y < 0) head.y = tileCount - 1;
        else if (head.y >= tileCount) head.y = 0;
    }

    // Colision con cuerpo
    if (gameState.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        gameOver();
        return;
    }

    gameState.snake.unshift(head);

    // Comer comida normal
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        eatFood(FOOD_TYPES[gameState.food.type], head);
        placeFood();
        maybeSpawnBonusFood();
    }
    // Comer comida bonus
    else if (gameState.bonusFood && head.x === gameState.bonusFood.x && head.y === gameState.bonusFood.y) {
        eatFood(FOOD_TYPES[gameState.bonusFood.type], head);
        removeBonusFood();
    }
    else {
        gameState.snake.pop();
    }
}

function eatFood(foodType, head) {
    const now = Date.now();
    const timeSinceLast = now - gameState.lastEatTime;

    // Combo: si comes dentro de 2 segundos
    if (timeSinceLast < 2000 && gameState.lastEatTime > 0) {
        gameState.combo++;
        if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
    } else {
        gameState.combo = 1;
    }
    gameState.lastEatTime = now;

    // Calcular puntos con combo
    const comboMultiplier = Math.min(gameState.combo, 5);
    const points = foodType.points + (comboMultiplier > 1 ? Math.floor(foodType.points * (comboMultiplier - 1) * 0.2) : 0);

    gameState.score += points;
    gameState.foodEaten++;
    updateScore();
    updateCombo();

    // Efecto visual
    spawnParticles(head.x * gridSize + gridSize / 2, head.y * gridSize + gridSize / 2, foodType.color);
    showFloatingScore(head.x * gridSize, head.y * gridSize, `+${points}`, foodType.color);

    // Animacion del score
    scoreElement.classList.add('score-pop');
    setTimeout(() => scoreElement.classList.remove('score-pop'), 400);

    // Subir nivel cada 5 comidas
    const newLevel = Math.floor(gameState.foodEaten / 5) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        // Aumentar velocidad
        gameState.speed = Math.max(60, 140 - (gameState.level - 1) * 8);
        updateLevel();
    }
    updateProgress();

    // Reset combo timer
    if (gameState.comboTimeout) clearTimeout(gameState.comboTimeout);
    gameState.comboTimeout = setTimeout(() => {
        gameState.combo = 0;
        hideCombo();
    }, 2500);
}

function maybeSpawnBonusFood() {
    if (gameState.bonusFood) return;
    // 20% de chance de bonus, 5% de golden
    const rand = Math.random();
    if (rand < 0.05) spawnBonusFood('golden');
    else if (rand < 0.20) spawnBonusFood('bonus');
}

function spawnBonusFood(type) {
    const pos = getRandomFreePosition();
    gameState.bonusFood = { x: pos.x, y: pos.y, type, spawnTime: Date.now() };
    const duration = FOOD_TYPES[type].duration;
    gameState.bonusFoodTimer = setTimeout(() => removeBonusFood(), duration);
}

function removeBonusFood() {
    gameState.bonusFood = null;
    if (gameState.bonusFoodTimer) {
        clearTimeout(gameState.bonusFoodTimer);
        gameState.bonusFoodTimer = null;
    }
}

function placeFood() {
    const pos = getRandomFreePosition();
    gameState.food = { x: pos.x, y: pos.y, type: 'normal' };
}

function getRandomFreePosition() {
    let pos;
    do {
        pos = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
    } while (
        gameState.snake.some(seg => seg.x === pos.x && seg.y === pos.y) ||
        (gameState.bonusFood && gameState.bonusFood.x === pos.x && gameState.bonusFood.y === pos.y)
    );
    return pos;
}

// --- Particulas ---

function spawnParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 2;
        gameState.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.03 + Math.random() * 0.02,
            size: 2 + Math.random() * 2,
            color
        });
    }
}

function updateParticles() {
    gameState.particles = gameState.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vx *= 0.96;
        p.vy *= 0.96;
        return p.life > 0;
    });
}

function drawParticles() {
    gameState.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// --- Floating scores ---

function showFloatingScore(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'float-score';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = color;
    floatingScores.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// --- UI Updates ---

function updateScore() {
    scoreElement.textContent = gameState.score;
}

function updateLevel() {
    levelElement.textContent = gameState.level;
    progressLabel.textContent = `Nivel ${gameState.level}`;
}

function updateProgress() {
    const foodInLevel = gameState.foodEaten % 5;
    const pct = (foodInLevel / 5) * 100;
    progressFill.style.width = pct + '%';
}

function updateCombo() {
    if (gameState.combo > 1) {
        comboDisplay.style.display = 'flex';
        comboCount.textContent = gameState.combo;
    }
}

function hideCombo() {
    comboDisplay.style.display = 'none';
}

function updateHighScore() {
    const scores = getScores();
    const highScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
    highScoreElement.textContent = highScore;
}

// --- Game Over ---

function gameOver() {
    gameState.gameActive = false;
    if (gameState.animationId) clearTimeout(gameState.animationId);
    removeBonusFood();

    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    saveScore(gameState.score, gameState.level, gameState.foodEaten);
    updateHighScore();
    updateRankings();

    const scores = getScores();
    const isNewRecord = gameState.score > 0 && gameState.score >= Math.max(...scores.map(s => s.score));

    overlayTitle.textContent = isNewRecord ? 'Nuevo Record!' : 'Game Over';
    overlayMessage.textContent = '';

    // Mostrar stats
    gameStatsEl.style.display = 'grid';
    gameStatsEl.innerHTML = `
        <div class="stat-box ${isNewRecord ? 'highlight' : ''}">
            <span class="stat-label">Puntuacion</span>
            <span class="stat-val">${gameState.score}</span>
        </div>
        <div class="stat-box">
            <span class="stat-label">Nivel</span>
            <span class="stat-val">${gameState.level}</span>
        </div>
        <div class="stat-box">
            <span class="stat-label">Comidas</span>
            <span class="stat-val">${gameState.foodEaten}</span>
        </div>
        <div class="stat-box">
            <span class="stat-label">Tiempo</span>
            <span class="stat-val">${minutes}:${seconds.toString().padStart(2, '0')}</span>
        </div>
    `;

    if (isNewRecord) {
        document.querySelector('.overlay-content').classList.add('new-record');
    } else {
        document.querySelector('.overlay-content').classList.remove('new-record');
    }

    gameOverlay.style.display = 'flex';
    playButton.style.display = 'inline-flex';
    playButton.innerHTML = '<i class="fas fa-redo"></i> REINICIAR';
    pauseButton.style.display = 'none';
    hideCombo();
}

// --- Puntuaciones ---

function getScores() {
    return JSON.parse(localStorage.getItem('snakeScores')) || [];
}

function saveScore(score, level, foodEaten) {
    if (score === 0) return;
    const scores = getScores();
    scores.push({ score, level, foodEaten, date: new Date().toLocaleDateString() });
    // Guardar solo top 50
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('snakeScores', JSON.stringify(scores.slice(0, 50)));
}

function updateRankings() {
    const scores = getScores();
    scores.sort((a, b) => b.score - a.score);
    const top = scores.slice(0, 10);

    if (top.length === 0) {
        rankingsList.innerHTML = '<div class="no-scores">Juega para ver tus puntuaciones!</div>';
        return;
    }

    rankingsList.innerHTML = top.map((item, i) => `
        <div class="ranking-item">
            <span class="ranking-position">#${i + 1}</span>
            <span class="ranking-score">${item.score}</span>
            <span class="ranking-level">Nv.${item.level || 1}</span>
        </div>
    `).join('');
}

function clearAllScores() {
    if (confirm('Borrar todas las puntuaciones?')) {
        localStorage.removeItem('snakeScores');
        updateHighScore();
        updateRankings();
    }
}

// --- Utilidades de dibujo ---

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function interpolateColor(color1, color2, t, alpha) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgba(${r},${g},${b},${alpha})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
}
