let vocabData = [];

async function initVocabHub() {
    const grid = document.getElementById('category-menu');
    if (!grid) return;

    // show a quick loading message so the user isn't staring at a blank page
    grid.innerHTML = '<div class="loading">Loading categories...</div>';

    try {
        // if the user has already visited the vocabulary hub during this session,
        // we can skip the network request entirely by using sessionStorage.
        const cached = sessionStorage.getItem('vocabData');
        if (cached) {
            vocabData = JSON.parse(cached);
            renderCards(vocabData);
            return;
        }

        // since vocabulary.json is local and fairly small, the fetch should be fast,
        // but we still await it to make sure the page doesn't break on error.
        const response = await fetch('vocabulary.json');
        
        if (!response.ok) throw new Error(`Status: ${response.status}`);

        vocabData = await response.json();
        // cache the results for the remainder of the session
        try { sessionStorage.setItem('vocabData', JSON.stringify(vocabData)); } catch(e) { /* ignore quota issues */ }
        renderCards(vocabData);
    } catch (error) {
        console.error("Data Load Error:", error);
        grid.innerHTML = `<p style="color:white; text-align:center;">Failed to load categories. Please refresh.</p>`;
    }
}

function renderCards(data) {
    const grid = document.getElementById('category-menu');
    if (!grid) return;

    // Apply the grid class from your gallery.css
    grid.className = "vocab-grid";

    grid.innerHTML = data.map(item => {
        const title = (currentLang === 'tm')
            ? (item.title_tm || item.title_en)
            : item.title_en;
        const altText = (currentLang === 'tm')
            ? (item.title_tm || item.title_en)
            : item.title_en;

        return `
        <a href="${item.link}" class="vocab-card">
            <img loading="lazy" decoding="async" src="${item.icon}" alt="${altText}" class="vocab-img" onerror="this.src='images/placeholder.png'">
            <div class="card-text">
                <span class="jp">${item.title_jp}</span>
                <span class="en">${title}</span>
            </div>
        </a>
    `;
    }).join('');
}

// Global Search Routing (called by app.js)
function handleVocabSearch(searchTerm) {
    const filtered = vocabData.filter(item => {
        const enMatch = item.title_en.toLowerCase().includes(searchTerm);
        const jpMatch = item.title_jp.includes(searchTerm);
        const tmMatch = item.title_tm ? item.title_tm.toLowerCase().includes(searchTerm) : false;
        return enMatch || jpMatch || tmMatch;
    });
    renderCards(filtered);
}

// Start the Hub
document.addEventListener('DOMContentLoaded', initVocabHub);