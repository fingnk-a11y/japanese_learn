// Variable to store our data once loaded
let kanjiLibrary = {};
let currentLevel = null; // Track the active level

// ========================================
// THEME INITIALIZATION
// ========================================
/**
 * Ensure saved theme is properly applied on page load
 * This guarantees theme persistence across all pages
 */
function initializePageTheme() {
    const savedStyle = localStorage.getItem('selectedStyle');
    if (savedStyle && typeof applyStyle === 'function') {
        applyStyle(savedStyle);
    }
}

/* --- 1. FETCH DATA --- */
async function loadKanjiData() {
    // Apply saved theme on page load
    initializePageTheme();
    
    try {
        const response = await fetch('http://localhost:3000/api/kanji');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        kanjiLibrary = await response.json();

        // Read level from URL or default to null (show all)
        const urlParams = new URLSearchParams(window.location.search);
        const initialLevel = urlParams.get('level');

        if (initialLevel) {
            currentLevel = initialLevel.toLowerCase();
            updateActiveButton(currentLevel);
        }

        // Initial render using the new search function
        handleKanjiSearch("");
    } catch (error) {
        console.error("FAILED TO LOAD JSON:", error);
        const grid = document.getElementById('kanji-grid');
        if (grid) grid.innerHTML = `<p style="color:red;">Error loading data.</p>`;
    }
}

/* --- 2. SEARCH & RENDER LOGIC (Used by app.js) --- */
function handleKanjiSearch(searchTerm) {
    const grid = document.getElementById('kanji-grid');
    if (!grid || !kanjiLibrary) return;

    grid.innerHTML = "";
    let foundCount = 0;
    const term = searchTerm.toLowerCase();

    Object.keys(kanjiLibrary).forEach(level => {
        if (level === '_id') return;
        // Filter by level if one is active (N5, N4, etc.)
        if (currentLevel && level !== currentLevel) return;

        kanjiLibrary[level].forEach(kanji => {
            const matchesSearch =
                kanji.char.includes(term) ||
                kanji.meaning.toLowerCase().includes(term) ||
                (kanji.onyomi && kanji.onyomi.toLowerCase().includes(term)) ||
                (kanji.kunyomi && kanji.kunyomi.toLowerCase().includes(term));

            if (matchesSearch) {
                foundCount++;
                const card = document.createElement('div');
                card.className = 'kana-card kanji-card';
                card.onclick = () => openKanjiModal(level, kanji.char);

                card.innerHTML = `
                    <span class="level-tag">${level.toUpperCase()}</span>
                    <div class="kana-char">${kanji.char}</div>
                    <div class="kana-romaji">${(currentLang === 'tm') ? (kanji.meaning_tm || kanji.meaning) : kanji.meaning}</div>
                `;
                grid.appendChild(card);
            }
        });
    });

    if (foundCount === 0) {
        grid.innerHTML = `
            <div class="no-results" style="grid-column: 1/-1; text-align:center; padding: 40px;">
                <p>No Kanji found for "${searchTerm}"</p>
            </div>`;
    }
}

/* --- 3. SWITCH LEVEL --- */
function switchKanji(level, btn) {
    const isAlreadyActive = btn.classList.contains('active');

    // UI Update
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    if (isAlreadyActive) {
        currentLevel = null; // Toggle off: show all
    } else {
        btn.classList.add('active');
        currentLevel = level.toLowerCase();
    }

    // Refresh using the current search term
    const searchInput = document.getElementById('global-search');
    handleKanjiSearch(searchInput ? searchInput.value : "");
}

/* --- 4. MODAL LOGIC --- */
function openKanjiModal(level, character) {
    // find the kanji object from our library so we can display its details
    const list = kanjiLibrary[level];
    if (!list) {
        console.warn(`No kanji list found for level ${level}`);
        return;
    }
    const kanji = list.find(k => k.char === character);
    if (!kanji) {
        console.warn(`Kanji ${character} not found in level ${level}`);
        return;
    }

    const modal = document.getElementById('kanji-modal');
    // fill main character display if present
    //const mainElem = document.getElementById('modal-kanji-main');
    //if (mainElem) mainElem.innerText = kanji.char;

    const meaningText = (currentLang === 'tm') ? (kanji.meaning_tm || kanji.meaning) : kanji.meaning;
    document.getElementById('modal-meaning').innerText = meaningText;
    document.getElementById('modal-onyomi').innerText = kanji.onyomi || '-';
    document.getElementById('modal-kunyomi').innerText = kanji.kunyomi || '-';

    const exampleList = document.getElementById('modal-examples');
    exampleList.innerHTML = (kanji.examples || []).map(ex => {
        const exMeaning = (currentLang === 'tm') ? (ex.meaning_tm || ex.meaning) : ex.meaning;
        return `
        <li>
            <span class="ex-word">${ex.word}</span>
            <span class="ex-reading">(${ex.reading})</span>
            <span class="ex-meaning">${exMeaning}</span>
        </li>
    `;
    }).join('');

    const strokeImg = document.getElementById('kanji-stroke');
    // Try kanjigifs first, then kanagifs as fallback
    strokeImg.src = `../assets/kanjigifs/${kanji.char}.gif`;
    
    strokeImg.onerror = function() {
        console.warn(`Could not load gif from kanjigifs for ${kanji.char}, trying kanagifs`);
        strokeImg.src = `../assets/kanagifs/${kanji.char}.gif`;
        
        strokeImg.onerror = function() {
            console.warn(`Could not load gif for ${kanji.char} from either folder`);
        };
    };
    
    modal.style.display = 'flex';
}

/* --- 6. RE-RENDER ON LANGUAGE SWITCH --- */
function refreshKanjiDisplay() {
    if (typeof handleKanjiSearch === 'function') {
        const searchInput = document.getElementById('global-search');
        handleKanjiSearch(searchInput ? searchInput.value : "");
    }
}

/* --- 5. INITIALIZE --- */
document.addEventListener('DOMContentLoaded', () => {
    loadKanjiData();
    if (typeof updateUI === 'function') updateUI();
});

function updateActiveButton(level) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.innerText.toLowerCase() === level.toLowerCase()) btn.classList.add('active');
    });
}

window.onclick = (e) => {
    const modal = document.getElementById('kanji-modal');
    if (e.target === modal || e.target.classList.contains('close-modal')) {
        modal.style.display = 'none';
    }
};
// Replace your existing listener with this "Check & Run" logic
function startApp() {
    const grid = document.getElementById('kanji-grid');
    if (grid) {
        loadKanjiData();
    } else {
        setTimeout(startApp, 10); // Try again until the HTML is ready
    }
}

// Start the check
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}