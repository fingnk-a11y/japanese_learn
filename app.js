// --- GLOBAL APP CONTROLLER ---
// This file only handles the Search Bar UI and "routes" the search
// to whichever page is currently open.

function executeSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase();
    const clearBtn = document.getElementById('clear-search');

    // 1. UI Logic: Show/Hide the 'X' button
    if (clearBtn) {
        clearBtn.style.display = searchTerm.length > 0 ? "block" : "none";
    }

    // 2. Routing: Check which page-specific function to run
    // If we are on the Kanji page, it runs handleKanjiSearch
    if (typeof handleKanjiSearch === 'function') {
        handleKanjiSearch(searchTerm);
    }
    // If we are on the Vocabulary page, it runs handleVocabSearch
    else if (typeof handleVocabSearch === 'function') {
        handleVocabSearch(searchTerm);
    }
}

function clearSearch() {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.value = "";
        executeSearch(); // Refresh the grid
    }
}
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.querySelector('.menu-overlay');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
}

function toggleTheme() {
    currentTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    localStorage.setItem('selectedTheme', currentTheme);
    applyTheme();
    updateUI();  // in case icon needs changing
}

function applyTheme() {
    document.body.classList.toggle('dark-mode', currentTheme === 'dark');
}
// app.js

// app.js

// 1. Initialize: Check localStorage first, otherwise default to 'tm'
let currentLang = localStorage.getItem('selectedLanguage') || 'tm';
// 2. Theme setup: light or dark
let currentTheme = localStorage.getItem('selectedTheme') || 'light';

// Run this immediately to set the correct flag/text and theme when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    applyTheme();
});

function toggleLanguage() {
    // 2. Switch the state
    currentLang = (currentLang === 'tm') ? 'en' : 'tm';

    // 3. Save the new choice to localStorage
    localStorage.setItem('selectedLanguage', currentLang);

    // 4. Update everything on the screen
    updateUI();
}

function updateUI() {
    const flagImg = document.getElementById('flag-img');
    const subtitle = document.getElementById('hero-subtitle');
    const themeIcon = document.getElementById('theme-icon');

    // Update Flag Image: Show the flag of the language the user can switch TO
    if (flagImg) {
        const flagToDisplay = (currentLang === 'tm') ? 'en' : 'tm';
        // Ensure a fallback exists if the exact flag file is missing
        const candidate = `assets/flags/${flagToDisplay}.png`;
        fetch(candidate, { method: 'HEAD' }).then(resp => {
            if (resp.ok) flagImg.src = candidate;
            else flagImg.src = 'assets/flags/us.png';
        }).catch(() => { flagImg.src = 'assets/flags/us.png'; });
    }

    // Update theme icon
    if (themeIcon) {
        themeIcon.innerText = (currentTheme === 'dark') ? '☀️' : '🌙';
    }

    // Update Home Subtitle
    if (subtitle) {
        subtitle.innerText = (currentLang === 'tm')
            ? "Ýapon dilini öwrenmek ýoluňyz şu ýerden başlaýar."
            : "Your path to Japanese fluency starts here.";
    }

    // Update Grammar Cards (only if data already exists)
    if (typeof renderGrid === 'function' && document.getElementById('grammar-grid')) {
        if (typeof grammarData !== 'undefined' && grammarData) {
            renderGrid(grammarData);
        }
    }

    // --- VOCABULARY PAGE UI UPDATES ---
    // re-render vocabulary cards if we're on that page
    if (typeof renderCards === 'function' && typeof vocabData !== 'undefined' && vocabData.length) {
        renderCards(vocabData);
    }

    // --- GRAMMAR DETAIL RE-FEED ---
    // if a lesson is currently open we need to rebuild it so that titles,
    // examples, etc. honour the new language.  showLesson reads from
    // grammarData and will also toggle the view correctly.
    const detailView = document.getElementById('lesson-detail-view');
    if (detailView && detailView.style.display === 'block') {
        const activeLesson = localStorage.getItem('activeLesson');
        if (activeLesson && typeof showLesson === 'function') {
            showLesson(activeLesson);
        }
    }

    // --- CATEGORY PAGE UI UPDATES ---
    // when viewing a specific vocabulary category we need to reload the
    // content so every card and header uses the current language.  the
    // existing loadCategoryContent function already applies the correct
    // translations, so just invoke it if the grid exists on the page.
    if (typeof loadCategoryContent === 'function' && document.getElementById('vocab-grid')) {
        // don't await; the function handles its own errors
        loadCategoryContent();
        // if the user had a word filter active, re-run it so cards update
        if (typeof filterWords === 'function') filterWords();
    }

    // re-apply any vocabulary hub search that might be active (global or local)
    const globalSearch = document.getElementById('global-search');
    if (globalSearch && globalSearch.value.trim().length && typeof handleVocabSearch === 'function') {
        handleVocabSearch(globalSearch.value.toLowerCase());
    }

    // hero text and description on vocabulary hub
    const vocabHeroTitle = document.querySelector('.hero-main h1');
    const vocabHeroDesc = document.querySelector('.hero-main p');
    if (vocabHeroTitle && vocabHeroTitle.innerText.toLowerCase().includes('vocab')) {
        vocabHeroTitle.innerText = (currentLang === 'tm') ? 'Sözlük Merkezi' : 'Vocabulary Hub';
    }
    if (vocabHeroDesc) {
        vocabHeroDesc.innerText = (currentLang === 'tm')
            ? 'Kategori saýlap başlaň.'
            : 'Select a category to start master Japanese words.';
    }

    // update placeholders on search inputs
    if (globalSearch) {
        globalSearch.placeholder = (currentLang === 'tm')
            ? 'Kategori gözlegi...'
            : 'Search categories...';
    }

    const wordSearch = document.getElementById('wordSearch');
    if (wordSearch) {
        wordSearch.placeholder = (currentLang === 'tm')
            ? 'Iňlis ýa-da Japonça gözläň...'
            : 'Search English or Japanese...';
    }

    // Adjust grammar page home link
    const homeLink = document.getElementById('home-link');
    if (homeLink) {
        homeLink.innerText = (currentLang === 'tm') ? '← ÖÝE' : '← HOME';
    }

    // Translate any back buttons with the special class
    document.querySelectorAll('.back-btn-styled').forEach(btn => {
        btn.innerText = (currentLang === 'tm') ? 'Yza' : 'Back';
    });

    // If we're on a category page and the header elements store both
    // languages in data attributes, toggle accordingly.
    const categoryTitle = document.getElementById('category-title');
    if (categoryTitle && categoryTitle.dataset.en && categoryTitle.dataset.tm) {
        categoryTitle.innerText = (currentLang === 'tm')
            ? categoryTitle.dataset.tm
            : categoryTitle.dataset.en;
    }
    const categoryDescEl = document.getElementById('category-desc');
    if (categoryDescEl && categoryDescEl.dataset.en && categoryDescEl.dataset.tm) {
        categoryDescEl.innerText = (currentLang === 'tm')
            ? categoryDescEl.dataset.tm
            : categoryDescEl.dataset.en;
    }

    // Refresh kanji display if we're on the kanji page
    if (typeof refreshKanjiDisplay === 'function') {
        refreshKanjiDisplay();
    }
}