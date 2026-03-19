// Global state
let vocabData = [];
let cachedCategory = { id: null, data: null, info: null };
let _loadingCategory = null;
let currentView = 'categories'; // 'categories' or 'vocabulary'

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

function getCategoryImagePath(imagePath = '') {
    return `../${imagePath.replace(/^\/?/, '')}`;
}

function getVocabItemImagePath(catId, imagePath = '') {
    const normalized = imagePath.replace(/^\/?/, '');
    const relativePath = normalized.includes('/') ? normalized : `${catId}/${normalized}`;
    return `../images/${relativePath}`;
}

// Initialize the page based on URL parameters
async function initVocabHub() {
    // Apply saved theme on page load
    initializePageTheme();
    
    const urlParams = new URLSearchParams(window.location.search);
    const catId = urlParams.get('id');

    if (catId) {
        // Show vocabulary items for this category
        await loadCategoryContent(catId);
    } else {
        // Show categories
        await loadCategories();
    }
}

// Load and display all categories
async function loadCategories() {
    currentView = 'categories';
    const grid = document.getElementById('category-menu');
    const backBtn = document.getElementById('back-btn');
    const searchBox = document.getElementById('category-search-box');
    const wordSearchBox = document.getElementById('search-box');

    if (!grid) return;

    grid.innerHTML = '<div class="loading">Loading categories...</div>';
    backBtn.href = '../index.html';
    if (searchBox) searchBox.style.display = 'flex';
    if (wordSearchBox) wordSearchBox.style.display = 'none';

    try {
        const cached = sessionStorage.getItem('vocabData');
        if (cached) {
            vocabData = JSON.parse(cached);
            renderCategoryCards(vocabData);
            return;
        }

        const response = await fetch('http://localhost:3000/api/vocabulary');
        if (!response.ok) throw new Error(`Status: ${response.status}`);

        vocabData = await response.json();
        try { sessionStorage.setItem('vocabData', JSON.stringify(vocabData)); } catch(e) {}
        renderCategoryCards(vocabData);
    } catch (error) {
        console.error("Data Load Error:", error);
        grid.innerHTML = `<p style="color:white; text-align:center;">Failed to load categories. Please refresh.</p>`;
    }
}

// Render category cards
function renderCategoryCards(data) {
    const grid = document.getElementById('category-menu');
    if (!grid) return;

    grid.className = "vocab-grid";  // Use vocab-grid for consistent styling
    grid.innerHTML = data.map(item => {
        const title = (currentLang === 'tm')
            ? (item.title_tm || item.title_en)
            : item.title_en;
        const altText = (currentLang === 'tm')
            ? (item.title_tm || item.title_en)
            : item.title_en;

        return `
        <a href="vocabulary.html?id=${item.id}" class="vocab-card">
            <img loading="lazy" decoding="async" src="${getCategoryImagePath(item.icon)}" alt="${altText}" class="vocab-img" onerror="this.style.display='none'">
            <div class="card-text">
                <span class="jp">${item.title_jp}</span>
                <span class="en">${title}</span>
            </div>
        </a>
    `;
    }).join('');

    // Set up search input listener for category search
    const catSearch = document.getElementById('global-search');
    if (catSearch) {
        catSearch.addEventListener('input', (e) => {
            const clearBtn = document.getElementById('clear-search-cat');
            if (clearBtn) clearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
        });
    }
}

// Load and display vocabulary for a category
async function loadCategoryContent(catId) {
    currentView = 'vocabulary';
    const grid = document.getElementById('category-menu');
    const backBtn = document.getElementById('back-btn');
    const searchBox = document.getElementById('category-search-box');
    const wordSearchBox = document.getElementById('search-box');

    if (!grid) return;

    grid.innerHTML = '<div class="loading">Loading vocabulary...</div>';
    backBtn.href = 'vocabulary.html';
    if (searchBox) searchBox.style.display = 'none';
    if (wordSearchBox) wordSearchBox.style.display = 'flex';

    if (_loadingCategory === catId) return;
    _loadingCategory = catId;

    if (cachedCategory.id === catId && cachedCategory.data) {
        applyCategoryRender(catId, cachedCategory.data, cachedCategory.info);
        _loadingCategory = null;
        return;
    }

    const stored = sessionStorage.getItem(`category_${catId}`);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            Object.assign(cachedCategory, { id: catId, data: parsed.data, info: parsed.info });
            applyCategoryRender(catId, parsed.data, parsed.info);
            _loadingCategory = null;
            return;
        } catch (e) {}
    }

    try {
        let catInfo = null;
        const vocabResp = await fetch('http://localhost:3000/api/vocabulary');
        if (vocabResp.ok) {
            const list = await vocabResp.json();
            catInfo = list.find(c => c.id === catId);
        }

        const data = await (await fetch(`http://localhost:3000/api/vocabulary/${catId}`)).json();
        if (!Array.isArray(data)) throw new Error("Data is not an array");

        cachedCategory = { id: catId, data, info: catInfo };
        try {
            sessionStorage.setItem(`category_${catId}`, JSON.stringify({ data, info: catInfo }));
        } catch(e) {}

        applyCategoryRender(catId, data, catInfo);
    } catch (error) {
        console.error("Category load error:", error);
        if (grid) grid.innerHTML = `<div class="error-msg">Error loading "${catId}".</div>`;
    } finally {
        _loadingCategory = null;
    }
}

// Render vocabulary items
function applyCategoryRender(catId, data, catInfo) {
    const grid = document.getElementById('category-menu');
    const titleEl = document.getElementById('page-title');
    const descEl = document.getElementById('page-desc');

    if (titleEl) {
        const en = catInfo?.title_en || catId.toUpperCase();
        const tm = catInfo?.title_tm || en;
        titleEl.innerText = (currentLang === 'tm') ? tm : en;
    }

    if (descEl) {
        const en = "Improve your Japanese vocabulary.";
        const tm = "Ýapon sözlügüni ösdür.";
        descEl.innerText = (currentLang === 'tm') ? tm : en;
    }

    if (!grid) return;
    grid.className = "vocab-grid";
    grid.innerHTML = '';

    const batchSize = 20;
    let idx = 0;

    function renderBatch() {
        const slice = data.slice(idx, idx + batchSize);
        const html = slice.map((item, index) => {
            const translation = (currentLang === 'tm') ? (item.tm || item.en) : item.en;
            const borderStyle = item.hex ? `style="border-bottom: 8px solid ${item.hex};"` : "";
            const itemIndex = idx + index;
            const uniqueId = `modal-item-${catId}-${itemIndex}`;

            const media = (catId === 'colors' && item.hex)
                ? `<div class="color-swatch" style="background-color: ${item.hex};"></div>`
                : `<img loading="lazy" src="${getVocabItemImagePath(catId, item.img)}" class="vocab-img" onerror="this.style.display='none'">`;

            // Store item data in window for safe access
            window[uniqueId] = item;

            return `
                <div class="vocab-card" ${borderStyle} data-item-id="${uniqueId}" data-category="${catId}">
                    ${media}
                    <div class="jp">${item.jp}</div>
                    <div class="romaji">${item.romaji}</div>
                    <div class="en">${translation}</div>
                </div>`;
        }).join('');

        grid.insertAdjacentHTML('beforeend', html);
        idx += batchSize;
        if (idx < data.length) requestAnimationFrame(renderBatch);
    }
    renderBatch();
}

// Filter words in vocabulary view
function filterWords() {
    const filter = document.getElementById('wordSearch')?.value.toLowerCase();
    if (filter === undefined) return;

    document.querySelectorAll('.vocab-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(filter) ? "flex" : "none";
    });

    // Show/hide clear button
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) {
        clearBtn.style.display = filter.length > 0 ? 'block' : 'none';
    }
}

// Clear search
function clearSearch() {
    if (currentView === 'categories') {
        const catSearch = document.getElementById('global-search');
        if (catSearch) {
            catSearch.value = '';
            const clearBtn = document.getElementById('clear-search-cat');
            if (clearBtn) clearBtn.style.display = 'none';
            renderCategoryCards(vocabData);
        }
    } else {
        const wordSearch = document.getElementById('wordSearch');
        if (wordSearch) {
            wordSearch.value = '';
            const clearBtn = document.getElementById('clear-search');
            if (clearBtn) clearBtn.style.display = 'none';
            filterWords();
        }
    }
}

// Modal functions
function openModal(item, catId) {
    const modal = document.getElementById('card-modal');
    const modalImg = document.getElementById('modal-img');
    if (!modal || !modalImg) return;

    document.getElementById('modal-swatch')?.remove();

    if (catId === 'colors' && item.hex) {
        modalImg.style.display = 'none';
        const swatch = document.createElement('div');
        swatch.id = 'modal-swatch';
        swatch.style.cssText = `background-color: ${item.hex}; width: 120px; height: 120px; margin: 0 auto 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.2);`;
        modalImg.parentNode.insertBefore(swatch, modalImg.nextSibling);
    } else {
        modalImg.style.display = 'block';
        modalImg.src = `../images/${item.img}`;
    }

    const translation = (currentLang === 'tm') ? (item.tm || item.en) : item.en;
    document.getElementById('modal-jp').innerText = item.jp;
    document.getElementById('modal-romaji').innerText = item.romaji;
    document.getElementById('modal-en').innerText = translation;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
        soundBtn.textContent = (currentLang === 'tm') ? '🔊 Ses Oka' : '🔊 Play Sound';
        soundBtn.onclick = () => speakJapanese(item.jp);
    }
}

function closeModal() {
    const modal = document.getElementById('card-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function speakJapanese(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
}

// Global search for categories
function handleVocabSearch(searchTerm) {
    if (currentView !== 'categories') return;
    const filtered = vocabData.filter(item => {
        const enMatch = item.title_en.toLowerCase().includes(searchTerm);
        const jpMatch = item.title_jp.includes(searchTerm);
        const tmMatch = item.title_tm ? item.title_tm.toLowerCase().includes(searchTerm) : false;
        return enMatch || jpMatch || tmMatch;
    });
    renderCategoryCards(filtered);
}

// Consolidated click handler - handles both card clicks and modal closing
document.addEventListener('click', (e) => {
    // Handle vocab card clicks
    const card = e.target.closest('.vocab-card[data-item-id]');
    if (card) {
        const itemId = card.dataset.itemId;
        const category = card.dataset.category;
        const item = window[itemId];
        if (item) {
            openModal(item, category);
        }
    }

    // Handle modal closing (click outside or on X button)
    const modal = document.getElementById('card-modal');
    if (modal) {
        if (e.target === modal || e.target.closest('.close-modal')) {
            closeModal();
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Start the Hub
document.addEventListener('DOMContentLoaded', initVocabHub);