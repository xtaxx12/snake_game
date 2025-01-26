const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playButton = document.getElementById("playButton");

const gridSize = 20; // Tamaño de cada celda del grid
const tileCount = canvas.width / gridSize; // Número de celdas en el canvas

let snake = [{ x: 10, y: 10 }]; // Cuerpo de la serpiente
let direction = { x: 1, y: 0 }; // Dirección inicial: derecha
let food = { x: 5, y: 5 }; // Posición de la comida
let score = 0; // Puntuación
let speed = 100; // Velocidad inicial (ms)
let gameActive = false; // Estado del juego

// Dibujar la serpiente
function drawSnake() {
    ctx.fillStyle = "green";
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
}

// Dibujar la comida
function drawFood() {
    ctx.fillStyle = "red";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

// Mover la serpiente
function moveSnake() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Verificar colisiones con las paredes
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Verificar colisión con el cuerpo (solo si la serpiente tiene más de un segmento)
    if (snake.length > 1 && snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    // Agregar nueva cabeza
    snake.unshift(head);

    // Verificar si come la comida
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById("score").textContent = score;
        placeFood();

        // Aumentar velocidad cada 50 puntos
        if (score % 50 === 0) {
            speed = Math.max(50, speed - 10); // No bajar de 50ms
        }
    } else {
        // Eliminar la cola si no come
        snake.pop();
    }
}

// Generar comida aleatoria
function placeFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // Asegurarse de que la comida no aparezca en la serpiente
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        placeFood();
    }
}

// Guardar puntuación en localStorage
function saveScore(score) {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];
    scores.push(score);
    localStorage.setItem("scores", JSON.stringify(scores));
}

// Mostrar rankings
function showRankings() {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];
    scores.sort((a, b) => b - a); // Ordenar de mayor a menor
    console.log("Rankings:", scores.slice(0, 10)); // Mostrar top 10
}

// Función de Game Over
function gameOver() {
    saveScore(score);
    showRankings();
    gameActive = false; // Detener el juego
    playButton.style.display = "block"; // Mostrar el botón de "Play"
}

// Bucle del juego
function gameLoop() {
    if (!gameActive) return; // Detener el bucle si el juego no está activo

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSnake();
    drawFood();
    moveSnake();
    setTimeout(gameLoop, speed);
}

// Controlar la dirección con el teclado
document.addEventListener("keydown", (event) => {
    if (!gameActive) return; // Ignorar entradas si el juego no está activo

    switch (event.key) {
        case "ArrowUp":
            if (direction.y === 0) direction = { x: 0, y: -1 }; // No permitir movimiento opuesto
            break;
        case "ArrowDown":
            if (direction.y === 0) direction = { x: 0, y: 1 };
            break;
        case "ArrowLeft":
            if (direction.x === 0) direction = { x: -1, y: 0 };
            break;
        case "ArrowRight":
            if (direction.x === 0) direction = { x: 1, y: 0 };
            break;
    }
});

// Función para reiniciar el juego
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    score = 0;
    document.getElementById("score").textContent = score;
    placeFood();
    speed = 100;
    gameActive = true; // Activar el juego
    playButton.style.display = "none"; // Ocultar el botón de "Play"
    gameLoop(); // Iniciar el bucle del juego
}

// Iniciar el juego al hacer clic en "Play"
function startGame() {
    resetGame();
}

// Inicializar el juego (no iniciar automáticamente)
placeFood();
playButton.style.display = "block"; // Mostrar el botón de "Play" al inicio