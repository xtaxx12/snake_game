// Elementos del DOM
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const gameOverlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const rankingsList = document.getElementById("rankingsList");
const clearScoresButton = document.getElementById("clearScores");

// Configuración del juego
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Estado del juego
let gameState = {
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 5, y: 5 },
    score: 0,
    speed: 150,
    gameActive: false,
    gamePaused: false,
    animationId: null
};

// Colores y estilos
const colors = {
    snake: {
        head: '#10b981',
        body: '#059669',
        border: '#047857'
    },
    food: {
        main: '#ef4444',
        glow: '#fca5a5'
    },
    grid: 'rgba(148, 163, 184, 0.1)'
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
    updateHighScore();
    updateRankings();
    
    // Detectar si es móvil
    if (isMobile()) {
        document.getElementById('mobileControls').style.display = 'block';
    }
});

// Detectar dispositivos móviles
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
}

// Configurar event listeners
function setupEventListeners() {
    // Botones principales
    playButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    clearScoresButton.addEventListener('click', clearAllScores);
    
    // Controles de teclado
    document.addEventListener('keydown', handleKeyPress);
    
    // Controles táctiles
    setupMobileControls();
    
    // Redimensionar canvas en móviles
    window.addEventListener('resize', handleResize);
}

// Configurar controles móviles
function setupMobileControls() {
    const dpadButtons = document.querySelectorAll('.d-pad-btn');
    
    dpadButtons.forEach(button => {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const direction = button.dataset.direction;
            handleDirectionInput(direction);
            button.style.transform = 'scale(0.9)';
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const direction = button.dataset.direction;
            handleDirectionInput(direction);
        });
    });
}

// Manejar redimensionamiento
function handleResize() {
    if (isMobile()) {
        const container = document.querySelector('.game-area');
        const maxWidth = Math.min(window.innerWidth - 40, 400);
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = maxWidth + 'px';
    }
}

// Manejar entrada de dirección
function handleDirectionInput(direction) {
    if (!gameState.gameActive || gameState.gamePaused) return;
    
    const currentDir = gameState.direction;
    
    switch (direction) {
        case 'up':
            if (currentDir.y === 0) gameState.nextDirection = { x: 0, y: -1 };
            break;
        case 'down':
            if (currentDir.y === 0) gameState.nextDirection = { x: 0, y: 1 };
            break;
        case 'left':
            if (currentDir.x === 0) gameState.nextDirection = { x: -1, y: 0 };
            break;
        case 'right':
            if (currentDir.x === 0) gameState.nextDirection = { x: 1, y: 0 };
            break;
    }
}

// Manejar teclas
function handleKeyPress(event) {
    if (!gameState.gameActive) {
        if (event.code === 'Space' || event.code === 'Enter') {
            startGame();
            return;
        }
    }
    
    if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
        return;
    }
    
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            event.preventDefault();
            handleDirectionInput('up');
            break;
        case 'ArrowDown':
        case 'KeyS':
            event.preventDefault();
            handleDirectionInput('down');
            break;
        case 'ArrowLeft':
        case 'KeyA':
            event.preventDefault();
            handleDirectionInput('left');
            break;
        case 'ArrowRight':
        case 'KeyD':
            event.preventDefault();
            handleDirectionInput('right');
            break;
    }
}

// Inicializar juego
function initializeGame() {
    resetGameState();
    drawGrid();
    drawSnake();
    drawFood();
    showOverlay('¡Bienvenido!', 'Presiona JUGAR para comenzar o usa ESPACIO');
}

// Resetear estado del juego
function resetGameState() {
    gameState.snake = [{ x: 10, y: 10 }];
    gameState.direction = { x: 1, y: 0 };
    gameState.nextDirection = { x: 1, y: 0 };
    gameState.score = 0;
    gameState.speed = 150;
    gameState.gameActive = false;
    gameState.gamePaused = false;
    
    if (gameState.animationId) {
        clearTimeout(gameState.animationId);
    }
    
    updateScore();
    placeFood();
}

// Iniciar juego
function startGame() {
    resetGameState();
    gameState.gameActive = true;
    hideOverlay();
    playButton.style.display = 'none';
    pauseButton.style.display = 'inline-flex';
    gameLoop();
}

// Alternar pausa
function togglePause() {
    if (!gameState.gameActive) return;
    
    gameState.gamePaused = !gameState.gamePaused;
    
    if (gameState.gamePaused) {
        showOverlay('Juego Pausado', 'Presiona ESPACIO o el botón para continuar');
        pauseButton.innerHTML = '<i class="fas fa-play"></i> CONTINUAR';
    } else {
        hideOverlay();
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> PAUSA';
        gameLoop();
    }
}

// Mostrar overlay
function showOverlay(title, message) {
    overlayTitle.textContent = title;
    overlayMessage.textContent = message;
    gameOverlay.style.display = 'flex';
}

// Ocultar overlay
function hideOverlay() {
    gameOverlay.style.display = 'none';
}

// Bucle principal del juego
function gameLoop() {
    if (!gameState.gameActive || gameState.gamePaused) return;
    
    // Actualizar dirección
    gameState.direction = { ...gameState.nextDirection };
    
    // Mover serpiente
    moveSnake();
    
    // Dibujar todo
    clearCanvas();
    drawGrid();
    drawFood();
    drawSnake();
    
    // Programar siguiente frame
    gameState.animationId = setTimeout(gameLoop, gameState.speed);
}

// Limpiar canvas
function clearCanvas() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Dibujar grid
function drawGrid() {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= tileCount; i++) {
        const pos = i * gridSize;
        
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
    }
}

// Dibujar serpiente
function drawSnake() {
    gameState.snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        
        // Cuerpo de la serpiente
        if (index === 0) {
            // Cabeza
            ctx.fillStyle = colors.snake.head;
            ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
            
            // Ojos
            ctx.fillStyle = '#ffffff';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            if (gameState.direction.x === 1) { // Derecha
                ctx.fillRect(x + gridSize - eyeOffset, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + gridSize - eyeOffset, y + gridSize - 7, eyeSize, eyeSize);
            } else if (gameState.direction.x === -1) { // Izquierda
                ctx.fillRect(x + 2, y + 4, eyeSize, eyeSize);
                ctx.fillRect(x + 2, y + gridSize - 7, eyeSize, eyeSize);
            } else if (gameState.direction.y === -1) { // Arriba
                ctx.fillRect(x + 4, y + 2, eyeSize, eyeSize);
                ctx.fillRect(x + gridSize - 7, y + 2, eyeSize, eyeSize);
            } else { // Abajo
                ctx.fillRect(x + 4, y + gridSize - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + gridSize - 7, y + gridSize - eyeOffset, eyeSize, eyeSize);
            }
        } else {
            // Cuerpo
            ctx.fillStyle = colors.snake.body;
            ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
        }
        
        // Borde
        ctx.strokeStyle = colors.snake.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
    });
}

// Dibujar comida
function drawFood() {
    const x = gameState.food.x * gridSize;
    const y = gameState.food.y * gridSize;
    
    // Efecto de brillo
    const gradient = ctx.createRadialGradient(
        x + gridSize/2, y + gridSize/2, 0,
        x + gridSize/2, y + gridSize/2, gridSize/2
    );
    gradient.addColorStop(0, colors.food.main);
    gradient.addColorStop(0.7, colors.food.main);
    gradient.addColorStop(1, colors.food.glow);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
    
    // Borde
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
}

// Mover serpiente
function moveSnake() {
    const head = {
        x: gameState.snake[0].x + gameState.direction.x,
        y: gameState.snake[0].y + gameState.direction.y
    };
    
    // Verificar colisiones con paredes
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    // Verificar colisión con el cuerpo
    if (gameState.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    gameState.snake.unshift(head);
    
    // Verificar si come comida
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        gameState.score += 10;
        updateScore();
        placeFood();
        
        // Aumentar velocidad gradualmente
        if (gameState.score % 50 === 0 && gameState.speed > 80) {
            gameState.speed -= 8;
        }
        
        // Efecto visual de comer (opcional: agregar partículas)
        createEatEffect(head.x * gridSize, head.y * gridSize);
    } else {
        gameState.snake.pop();
    }
}

// Efecto visual al comer
function createEatEffect(x, y) {
    // Aquí podrías agregar partículas o animaciones
    console.log('¡Comida consumida!');
}

// Colocar comida
function placeFood() {
    do {
        gameState.food.x = Math.floor(Math.random() * tileCount);
        gameState.food.y = Math.floor(Math.random() * tileCount);
    } while (gameState.snake.some(segment => 
        segment.x === gameState.food.x && segment.y === gameState.food.y
    ));
}

// Actualizar puntuación
function updateScore() {
    scoreElement.textContent = gameState.score;
}

// Actualizar mejor puntuación
function updateHighScore() {
    const scores = getScores();
    const highScore = scores.length > 0 ? Math.max(...scores) : 0;
    highScoreElement.textContent = highScore;
}

// Game Over
function gameOver() {
    gameState.gameActive = false;
    
    if (gameState.animationId) {
        clearTimeout(gameState.animationId);
    }
    
    saveScore(gameState.score);
    updateHighScore();
    updateRankings();
    
    const isNewRecord = gameState.score === Math.max(...getScores());
    const title = isNewRecord ? '¡Nuevo Récord!' : 'Game Over';
    const message = `Puntuación: ${gameState.score}${isNewRecord ? ' 🏆' : ''}`;
    
    showOverlay(title, message);
    playButton.style.display = 'inline-flex';
    pauseButton.style.display = 'none';
}

// Gestión de puntuaciones
function getScores() {
    return JSON.parse(localStorage.getItem('snakeScores')) || [];
}

function saveScore(score) {
    const scores = getScores();
    scores.push({
        score: score,
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('snakeScores', JSON.stringify(scores));
}

function updateRankings() {
    const scores = getScores();
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 10);
    
    if (topScores.length === 0) {
        rankingsList.innerHTML = '<div class="no-scores">¡Juega para ver tus puntuaciones!</div>';
        return;
    }
    
    rankingsList.innerHTML = topScores.map((item, index) => `
        <div class="ranking-item">
            <span class="ranking-position">#${index + 1}</span>
            <span class="ranking-score">${item.score}</span>
        </div>
    `).join('');
}

function clearAllScores() {
    if (confirm('¿Estás seguro de que quieres borrar todas las puntuaciones?')) {
        localStorage.removeItem('snakeScores');
        updateHighScore();
        updateRankings();
    }
}