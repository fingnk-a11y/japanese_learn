let grammarData; // global storage for grammar lessons

async function initGrammar() {
    try {
        const response = await fetch('grammar.json');
        grammarData = await response.json();

        // CHECK REFRESH STATE: Did we leave a lesson open?
        const savedLessonId = localStorage.getItem('activeLesson');

        if (savedLessonId) {
            showLesson(savedLessonId);
        } else {
            renderGrid(grammarData);
        }
    } catch (error) {
        console.error("Could not load data:", error);
    }
}

// Update your "Back" button to clear the refresh state
function backToOverview() {
    localStorage.removeItem('activeLesson'); // Clear the "bookmark"

    const gridView = document.getElementById('grid-view-container');
    const hero = document.getElementById('grammar-hero');
    const globalNav = document.querySelector('.global-nav');
    const detailView = document.getElementById('lesson-detail-view');

    // 1. Hide the lesson
    if (detailView) detailView.style.display = 'none';

    // 2. Show the containers
    if (gridView) gridView.style.display = 'block';
    if (hero) hero.style.display = 'flex';
    if (globalNav) globalNav.style.display = 'flex';

    // 3. THE FIX: Re-build the cards from the data
    renderGrid(grammarData);

    window.scrollTo(0, 0);
}
function renderGrid(data) {
    const grid = document.getElementById('grammar-grid');
    const gridView = document.getElementById('grid-view-container');
    const detailView = document.getElementById('lesson-detail-view');
    const hero = document.getElementById('grammar-hero');

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

    const lesson = grammarData.find(l => l.id === lessonId);
    const container = document.getElementById('lesson-detail-view');
    const gridView = document.getElementById('grid-view-container');
    const hero = document.getElementById('grammar-hero');
    const globalNav = document.querySelector('.global-nav');

    if (!lesson || !container) return;

    // 2. Hide everything else
    if (gridView) gridView.style.display = 'none';
    if (hero) hero.style.display = 'none';
    if (globalNav) globalNav.style.display = 'none';

    // 3. Show and render the detail
    container.style.display = 'block';
    renderLessonDetail(lesson, container);

    window.scrollTo(0, 0);
}

function renderLessonDetail(lesson, container) {
    const currentIndex = grammarData.findIndex(g => g.id === lesson.id);
    const num = (currentIndex + 1).toString().padStart(2, '0');

    const title = (currentLang === 'tm') ? (lesson.title_tm || lesson.title) : lesson.title;
    const formula = (currentLang === 'tm') ? (lesson.formula_tm || lesson.formula) : lesson.formula;
    const description = (currentLang === 'tm') ? (lesson.description_tm || lesson.description) : lesson.description;

    const labels = {
        back: (currentLang === 'tm') ? "← UMUMY GÖRÜNÜŞ" : "← OVERVIEW",
        usage: (currentLang === 'tm') ? "Ulanylyşy" : "Usage",
        examples: (currentLang === 'tm') ? "Mysallar" : "Examples"
    };

   container.innerHTML = `
    <div class="lesson-full-content">
        <header class="lesson-header lesson-detail-blue">
            <div class="lesson-nav-placeholder">
                <button onclick="backToOverview()" class="back-link">${labels.back}</button>
            </div>

            <div class="header-info">
                <div class="lesson-header-content">
                    <span class="big-num">${num}</span>
                    <span class="big-label">LESSON</span>
                </div>
                <h2 class="detail-subtitle">${title}</h2>
                ${formula ? `<div class="formula-banner">${formula}</div>` : ''}
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
} // <-- This brace was missing
// REPLACE THE BOTTOM OF YOUR grammar.js WITH THIS:

// This ensures initGrammar runs every time the page loads/restarts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGrammar);
} else {
    // If the DOM is already ready (can happen on fast refreshes), run it immediately
    initGrammar();
}
