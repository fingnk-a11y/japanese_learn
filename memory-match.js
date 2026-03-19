// Memory Match Game Logic

let gameState = {
    vocabulary: [],
    cards: [],
    flipped: [],
    matched: [],
    moves: 0,
    matches: 0,
    isLocked: false,
    timer: 0,
    timerInterval: null,
    difficulty: 'medium',
};

// Difficulty settings
const difficultySettings = {
    easy: 6,
    medium: 8,
    hard: 12,
};

// Initialize the game
async function initGame() {
    await loadAllVocabulary();
    createCardPairs();
    shuffleCards();
    renderGame();
    startTimer();
}

// Load vocabulary from API/database
async function loadAllVocabulary() {
    gameState.vocabulary = [];
    
    try {
        const categoriesResp = await fetch('http://localhost:3000/api/vocabulary');
        if (!categoriesResp.ok) throw new Error(`Failed to load categories: ${categoriesResp.status}`);

        const categories = await categoriesResp.json();
        const fetchPromises = categories
            .filter(cat => cat && cat.id)
            .map(cat => fetch(`http://localhost:3000/api/vocabulary/${cat.id}`).then(res => {
                if (!res.ok) throw new Error(`Failed category ${cat.id}: ${res.status}`);
                return res.json();
            }));

        const results = await Promise.all(fetchPromises);
        
        results.forEach(vocabArray => {
            if (Array.isArray(vocabArray)) {
                gameState.vocabulary = gameState.vocabulary.concat(vocabArray);
            }
        });
        
        // Shuffle the global vocabulary pool so each game gets random words from random categories
        for (let i = gameState.vocabulary.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.vocabulary[i], gameState.vocabulary[j]] = [gameState.vocabulary[j], gameState.vocabulary[i]];
        }
        
    } catch (error) {
        console.error('Error loading vocabulary:', error);
    }
}

// Create card pairs
function createCardPairs() {
    const pairCount = difficultySettings[gameState.difficulty];
    gameState.cards = [];
    gameState.matched = [];
    gameState.flipped = [];
    gameState.moves = 0;
    gameState.matches = 0;

    // Get random vocab items
    const selectedItems = gameState.vocabulary.slice(0, pairCount);

    // Create pairs: one English, one Japanese
    selectedItems.forEach((item, index) => {
        gameState.cards.push({
            id: `${index}-en`,
            front: item.en,
            back: 'English',
            type: index,
            pair: `${index}-jp`,
            isImage: false,
            content: item.en,
        });

        gameState.cards.push({
            id: `${index}-jp`,
            front: item.jp,
            back: item.romaji,
            type: index,
            pair: `${index}-en`,
            isImage: false,
            content: item.jp,
        });
    });
}

// Shuffle cards
function shuffleCards() {
    for (let i = gameState.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.cards[i], gameState.cards[j]] = [gameState.cards[j], gameState.cards[i]];
    }
}

// Render game board
function renderGame() {
    const gameBoard = document.getElementById('memory-game');
    gameBoard.innerHTML = '';
    gameBoard.className = `memory-game cards-${gameState.cards.length}`;

    gameState.cards.forEach((card) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;

        const isFlipped = gameState.flipped.includes(card.id) || gameState.matched.includes(card.id);
        const isMatched = gameState.matched.includes(card.id);

        cardElement.classList.add(isFlipped ? 'flipped' : 'unflipped');
        if (isMatched) cardElement.classList.add('matched');

        cardElement.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">
                    <div class="card-content">${card.front}</div>
                    <div class="card-subtitle">${card.back}</div>
                </div>
            </div>
        `;

        cardElement.addEventListener('click', () => flipCard(card));
        gameBoard.appendChild(cardElement);
    });

    updateStats();
}

// Flip card
function flipCard(card) {
    if (gameState.isLocked) return;
    if (gameState.flipped.includes(card.id)) return;
    if (gameState.matched.includes(card.id)) return;

    gameState.flipped.push(card.id);
    renderGame();

    if (gameState.flipped.length === 2) {
        gameState.isLocked = true;
        gameState.moves++;
        checkMatch();
    }
}

// Check if cards match
function checkMatch() {
    const [firstId, secondId] = gameState.flipped;
    const firstCard = gameState.cards.find((c) => c.id === firstId);
    const secondCard = gameState.cards.find((c) => c.id === secondId);

    if (firstCard.type === secondCard.type) {
        // Match found
        gameState.matched.push(firstId, secondId);
        gameState.matches++;
        gameState.flipped = [];
        gameState.isLocked = false;
        renderGame();

        if (gameState.matches === difficultySettings[gameState.difficulty]) {
            endGame();
        }
    } else {
        // No match
        setTimeout(() => {
            gameState.flipped = [];
            gameState.isLocked = false;
            renderGame();
        }, 1000);
    }
}

// Update stats display
function updateStats() {
    document.getElementById('moves').textContent = gameState.moves;
    document.getElementById('matches').textContent = gameState.matches;
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Start timer
function startTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timer = 0;

    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateStats();
    }, 1000);
}

// Stop timer
function stopTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
}

// End game
function endGame() {
    stopTimer();
    gameState.isLocked = true;

    const statusDiv = document.getElementById('game-status');
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    statusDiv.innerHTML = `
        <div class="game-complete">
            <h2>🎉 You Won!</h2>
            <p>Moves: ${gameState.moves}</p>
            <p>Time: ${timeString}</p>
            <p>Pairs: ${gameState.matches}/${difficultySettings[gameState.difficulty]}</p>
            <button onclick="resetGame()" class="play-again-btn">Play Again</button>
        </div>
    `;
}



// Change difficulty
function changeDifficulty() {
    const select = document.getElementById('difficulty-select');
    gameState.difficulty = select.value;
    document.getElementById('game-status').innerHTML = '';
    resetGame();
}

// Reset game
function resetGame() {
    stopTimer();
    gameState.flipped = [];
    gameState.matched = [];
    gameState.isLocked = false;
    gameState.moves = 0;
    gameState.matches = 0;
    gameState.timer = 0;
    document.getElementById('game-status').innerHTML = '';
    initGame();
}

// Initialize on page load
window.addEventListener('load', () => {
    initGame();
});
