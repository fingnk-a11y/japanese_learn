let grammarData; // global storage for grammar lessons
let currentViewingLessonId = null; // track current lesson being viewed
let cachedDOM = {}; // Cache frequently accessed DOM elements

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

// GRAMMAR-SPECIFIC: Apply translations to grammar page elements
function applyGrammarTranslations() {
    if (!langData) return;
    
    const currentLangData = langData[currentLang];
    if (!currentLangData) return;
    
    // Update all elements with data-lang-key attribute on this page
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (currentLangData[key]) {
            element.textContent = currentLangData[key];
        }
    });
}

// Cache DOM elements for faster access
function cacheDOM() {
    cachedDOM.grid = document.getElementById('grammar-grid');
    cachedDOM.gridView = document.getElementById('grid-view-container');
    cachedDOM.detailView = document.getElementById('lesson-detail-view');
    cachedDOM.hero = document.querySelector('.hero');
}

async function initGrammar() {
    // Apply saved theme on page load
    initializePageTheme();
    
    try {
        cacheDOM(); // Cache DOM elements on init
        const response = await fetch('http://localhost:3000/api/grammar');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        grammarData = await response.json();

        // CHECK REFRESH STATE: Did we leave a lesson open?
        const savedLessonId = localStorage.getItem('activeLesson');

        if (savedLessonId) {
            showLesson(savedLessonId);
        } else {
            renderGrid(grammarData);
            applyGrammarTranslations(); // Apply grammar-specific translations
        }
    } catch (error) {
        console.error("Could not load grammar data:", error);
        // Show error message to user
        const grid = cachedDOM.grid;
        if (grid) {
            grid.innerHTML = `<p style="color: red; padding: 20px;">Error loading grammar data: ${error.message}</p>`;
        }
    }
}

// Update your "Back" button to clear the refresh state
function backToOverview() {
    localStorage.removeItem('activeLesson'); // Clear the "bookmark"

    // Use cached DOM elements
    const gridView = cachedDOM.gridView || document.getElementById('grid-view-container');
    const hero = cachedDOM.hero || document.querySelector('.hero');
    const detailView = cachedDOM.detailView || document.getElementById('lesson-detail-view');

    // 1. Hide the lesson
    if (detailView) detailView.style.display = 'none';

    // 2. Show the containers
    if (gridView) gridView.style.display = 'block';
    if (hero) hero.style.display = 'flex';

    // 3. THE FIX: Re-build the cards from the data
    renderGrid(grammarData);

    window.scrollTo(0, 0);
}
function renderGrid(data) {
    const grid = cachedDOM.grid || document.getElementById('grammar-grid');
    const gridView = cachedDOM.gridView || document.getElementById('grid-view-container');
    const detailView = cachedDOM.detailView || document.getElementById('lesson-detail-view');
    const hero = cachedDOM.hero || document.querySelector('.hero');

    if(!grid || !gridView) return;

    // Show Grid and Hero, Hide Detail
    gridView.style.display = 'block';
    if(hero) hero.style.display = 'flex';
    if(detailView) detailView.style.display = 'none';

    grid.innerHTML = data.map((item, index) => {
        const num = (index + 1).toString().padStart(2, '0');

        // Use the selected language for the card title
        const title = (currentLang === 'tm') ? (item.title_tm || item.title) : item.title;
        const topic = (currentLang === 'tm') ? "GRAMMATIKA" : "GRAMMAR";

        const lessonLabel = (currentLang === 'tm') ? 'SAPAK' : 'LESSON';
        return `
            <div class="grammar-card" onclick="showLesson('${item.id}')">
                <div class="card-blue-header">
                    <div class="lesson-header-content">
                        <span class="big-num">${num}</span>
                        <span class="big-label">${lessonLabel}</span>
                    </div>
                </div>
                <div class="card-body">
                    <span class="topic-tag">${topic}</span>
                    <h3 class="grammar-title">${title}</h3>
                    <div class="card-footer-accent"></div>
                </div>
            </div>`;
    }).join('');
}
function showLesson(lessonId) {
    // 1. Save state for refresh persistence
    localStorage.setItem('activeLesson', lessonId);
    currentViewingLessonId = lessonId;

    const lesson = grammarData.find(l => l.id === lessonId);
    const container = cachedDOM.detailView || document.getElementById('lesson-detail-view');
    const gridView = cachedDOM.gridView || document.getElementById('grid-view-container');
    const hero = cachedDOM.hero || document.querySelector('.hero');

    if (!lesson) {
        console.error(`Lesson not found: ${lessonId}`, grammarData);
        return;
    }
    
    if (!container) {
        console.error('lesson-detail-view container not found');
        return;
    }

    // 2. Hide everything else
    if (gridView) gridView.style.display = 'none';
    if (hero) hero.style.display = 'none';

    // 3. Show and render the detail
    container.style.display = 'block';
    renderLessonDetail(lesson, container);

    window.scrollTo(0, 0);
}

function renderLessonDetail(lesson, container) {
    const currentIndex = grammarData.findIndex(g => g.id === lesson.id);
    const num = (currentIndex + 1).toString().padStart(2, '0');
    const hasNext = currentIndex < grammarData.length - 1;
    const hasPrev = currentIndex > 0;

    const title = (currentLang === 'tm') ? (lesson.title_tm || lesson.title) : lesson.title;
    const formula = (currentLang === 'tm') ? (lesson.formula_tm || lesson.formula) : lesson.formula;
    const description = (currentLang === 'tm') ? (lesson.description_tm || lesson.description) : lesson.description;

    const labels = {
        back: (currentLang === 'tm') ? "← OVERVIEW" : "← OVERVIEW",
        usage: (currentLang === 'tm') ? "Ulanylyşy" : "Usage",
        examples: (currentLang === 'tm') ? "Mysallar" : "Examples",
        next: (currentLang === 'tm') ? "Gönükdäki →" : "Next →",
        prev: (currentLang === 'tm') ? "← Öňki" : "← Previous"
    };

   container.innerHTML = `
    <div class="lesson-full-content">
        <header class="lesson-header lesson-detail-blue">
            <div class="lesson-nav-top">
                <div class="nav-left">
                    <button onclick="backToOverview()" class="back-link">${labels.back}</button>
                </div>
            </div>

            <div class="header-info">
                <div class="lesson-header-content">
                    <span class="big-num">${num}</span>
                    <span class="big-label">LESSON</span>
                </div>
                <h2 class="detail-subtitle">${title}</h2>
                ${formula ? `<div class="formula-banner">Formula: ${formula}</div>` : ''}
            </div>

            <div class="lesson-nav-bottom">
                ${hasPrev ? `<button onclick="showLesson('${grammarData[currentIndex - 1].id}')" class="lesson-nav-btn prev-btn">${labels.prev}</button>` : '<div class="lesson-nav-placeholder"></div>'}
                ${hasNext ? `<button onclick="showLesson('${grammarData[currentIndex + 1].id}')" class="lesson-nav-btn next-btn">${labels.next}</button>` : '<div class="lesson-nav-placeholder"></div>'}
            </div>
        </header>

        <div class="content-body">
            <div class="explanation-card main-desc">
                <div class="exp-header">
                    <span class="exp-icon">📖</span>
                    <h3>${labels.usage}</h3>
                </div>
                <p class="description-text">${description}</p>
            </div>

            <h3 class="section-divider">${labels.examples}</h3>
            ${(currentLang === 'tm' ? (lesson.examples_tm || lesson.examples) : lesson.examples).map(ex => {
                const translation = currentLang === 'tm' ? (ex.tm || ex.en || "Terjime ýok") : ex.en;
                return `
                    <div class="explanation-card example-card">
                        <div class="example-box">
                            <p class="jp-text">${ex.jp}</p>
                            <p class="en-text">${translation}</p>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    </div>
    `;
    
    // Add smooth fade-in animation
    container.style.animation = 'fadeIn 0.3s ease-in-out';
    
    // Apply grammar-specific translations
    applyGrammarTranslations();
}
// REPLACE THE BOTTOM OF YOUR grammar.js WITH THIS:

// This ensures initGrammar runs every time the page loads/restarts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGrammar);
} else {
    // If the DOM is already ready (can happen on fast refreshes), run it immediately
    initGrammar();
}

// Function to update lesson detail view when language/style changes
function updateGrammarLessonDetailView() {
    // Apply translations first
    applyGrammarTranslations();
    
    // Then re-render lesson if one is open
    if (currentViewingLessonId && grammarData) {
        const lesson = grammarData.find(l => l.id === currentViewingLessonId);
        const container = cachedDOM.detailView || document.getElementById('lesson-detail-view');
        if (lesson && container) {
            renderLessonDetail(lesson, container);
        }
    }
}
