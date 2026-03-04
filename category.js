// cache object for the currently displayed category
let cachedCategory = {
    id: null,
    data: null,
    info: null
};

// Prevent concurrent category loads which caused recursive re-entry
let _loadingCategory = null;

const loadCategoryContent = async () => {
    const grid = document.getElementById('vocab-grid');
    const titleElement = document.getElementById('category-title');
    const descElement = document.getElementById('category-desc');
    const urlParams = new URLSearchParams(window.location.search);
    const catId = urlParams.get('id');

    if (!catId) {
        window.location.href = 'vocabulary.html';
        return;
    }

    // prevent concurrent runs for the same page
    if (_loadingCategory) return;
    _loadingCategory = catId;

    // show loader immediately so the user isn't left staring at blank space
    if (grid) grid.innerHTML = '<div class="loading">Loading vocabulary...</div>';

    // if we've already fetched this category previously, just re-render
    // using the cached data (this is handy when toggling languages or
    // navigating back/forward within the session)
    if (cachedCategory.id === catId && cachedCategory.data) {
        applyCategoryRender(catId, cachedCategory.data, cachedCategory.info);
        return;
    }

    // attempt to read cached copy from sessionStorage as well
    const stored = sessionStorage.getItem(`category_${catId}`);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            cachedCategory.id = catId;
            cachedCategory.data = parsed.data;
            cachedCategory.info = parsed.info;
            applyCategoryRender(catId, parsed.data, parsed.info);
            return;
        } catch (e) {
            // ignore corrupt data and fall through to fetch
        }
    }

    // fetch meta information once
    let catInfo;
    try {
        const vocabResp = await fetch('vocabulary.json');
        if (vocabResp.ok) {
            const list = await vocabResp.json();
            catInfo = list.find(c => c.id === catId);
        }
    } catch (_) {
        // failure is non‑fatal; we'll fall back below
    }

    // Attempt to fetch the category file with fallbacks (case variations, stray .json)
    try {
        const timerLabel = `fetch_${catId}`;
        console.time(timerLabel);
        const data = await fetchVocabWithFallback(catId);
        console.timeEnd(timerLabel);

        // validate shape
        if (!Array.isArray(data)) {
            console.error(`vocabs/${catId}.json did not return an array`, data);
            if (grid) grid.innerHTML = `<div class="error-msg">Invalid data for "${catId}".</div>`;
            return;
        }

        // cache for later
        cachedCategory.id = catId;
        cachedCategory.data = data;
        cachedCategory.info = catInfo;

        // persist into sessionStorage
        try {
            sessionStorage.setItem(`category_${catId}`, JSON.stringify({ data, info: catInfo }));
        } catch(e) { /* ignore quota errors */ }

        applyCategoryRender(catId, data, catInfo);
    } catch (error) {
        console.error("Error loading category:", error);
        if (grid) grid.innerHTML = `<div class="error-msg">Error loading "${catId}". See console for details.</div>`;
    } finally {
        _loadingCategory = null;
    }
};

// Try several plausible file paths for a given category id to avoid
// case-sensitivity or accidental ".json" in the id causing fetch failures.
async function fetchVocabWithFallback(catId) {
    const tried = [];
    const candidates = [];

    // raw id
    candidates.push(`vocabs/${catId}.json`);
    // common variations
    candidates.push(`vocabs/${catId.toLowerCase()}.json`);
    candidates.push(`vocabs/${catId.toUpperCase()}.json`);

    // if the id already contains .json, try stripping it and using as-is
    if (catId.endsWith('.json')) {
        const base = catId.replace(/\.json$/i, '');
        candidates.push(`vocabs/${base}.json`);
        candidates.push(`vocabs/${base.toLowerCase()}.json`);
    }

    for (const path of candidates) {
        if (tried.includes(path)) continue;
        tried.push(path);
        try {
            const resp = await fetch(path);
            if (!resp.ok) {
                console.debug(`fetch ${path} returned ${resp.status}`);
                continue;
            }
            const json = await resp.json();
            return json;
        } catch (err) {
            console.debug(`fetch ${path} failed:`, err);
        }
    }
    throw new Error(`All fetch attempts failed for category id "${catId}" (tried: ${tried.join(', ')})`);
}

function applyCategoryRender(catId, data, catInfo) {
    const grid = document.getElementById('vocab-grid');
    const titleElement = document.getElementById('category-title');
    const descElement = document.getElementById('category-desc');

    if (titleElement) {
        const en = catInfo ? catInfo.title_en : catId.toUpperCase();
        const tm = catInfo ? (catInfo.title_tm || en) : en;
        titleElement.dataset.en = en;
        titleElement.dataset.tm = tm;
        titleElement.innerText = (currentLang === 'tm') ? tm : en;
    }

    if (descElement) {
        descElement.dataset.en = "Improve your japanese vocabulary.";
        descElement.dataset.tm = "Ýapon sözlügüni ösdür.";
        descElement.innerText = (currentLang === 'tm') ? descElement.dataset.tm : descElement.dataset.en;
    }

    // progressively render cards in batches so the UI remains responsive
    grid.innerHTML = ''; // clear any placeholder/previous content
    const batchSize = 20;
    let idx = 0;

    function renderBatch() {
        const slice = data.slice(idx, idx + batchSize);
        const html = slice.map(item => {
            const itemData = JSON.stringify(item).replace(/'/g, "&apos;");
            let dynamicStyle = item.hex ? `style=\"border-bottom: 8px solid ${item.hex};\"` : "";

            const translation = (currentLang === 'tm')
                ? (item.tm || item.en)
                : item.en;

            let mediaHtml = (catId === 'colors' && item.hex)
                ? `<div class=\"color-swatch\" style=\"background-color: ${item.hex};\"></div>`
                : `<img loading=\"lazy\" decoding=\"async\" src=\"images/${item.img}\" class=\"vocab-img\" onerror=\"this.src='images/placeholder.png'\">`;

            return `
                <div class=\"vocab-card\" ${dynamicStyle} onclick='openModal(${itemData}, "${catId}")'>
                    ${mediaHtml}
                    <div class=\"jp\">${item.jp}</div>
                    <div class=\"romaji\">${item.romaji}</div>
                    <div class=\"en\">${translation}</div>
                </div>
            `;
        }).join('');

        grid.insertAdjacentHTML('beforeend', html);
        idx += batchSize;
        if (idx < data.length) {
            requestAnimationFrame(renderBatch);
        } else {
            // final UI update after all cards inserted
            // Avoid calling `updateUI()` here — that function can re-invoke
            // `loadCategoryContent()` when a `vocab-grid` exists which leads
            // to recursive reloads and stack overflows. If a global UI
            // refresh is required, call `updateUI()` from the page-level
            // controller instead.
        }
    }

    renderBatch();
}


// --- SEARCH LOGIC (Matches HTML onkeyup="filterWords()") ---
function filterWords() {
    const input = document.getElementById('wordSearch');
    if (!input) return;

    const filter = input.value.toLowerCase();
    const cards = document.querySelectorAll('.vocab-card');

    cards.forEach(card => {
        // This grabs all text inside the card (JP, Romaji, and EN)
        const content = card.textContent.toLowerCase();

        if (content.includes(filter)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

// --- MODAL LOGIC (Stable) ---
function openModal(item, catId) {
    const modal = document.getElementById('card-modal');
    let modalImg = document.getElementById('modal-img');
    const oldSwatch = document.getElementById('modal-swatch');
    if(oldSwatch) oldSwatch.remove();

    if (catId === 'colors' && item.hex) {
        modalImg.style.display = 'none';
        const swatch = document.createElement('div');
        swatch.id = 'modal-swatch';
        swatch.className = 'color-swatch';
        swatch.style.cssText = `background-color: ${item.hex}; width: 120px; height: 120px; margin: 0 auto 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.1);`;
        modalImg.parentNode.insertBefore(swatch, modalImg.nextSibling);
    } else {
        modalImg.style.display = 'block';
        modalImg.src = `images/${item.img}`;
    }
// --- TURKMEN MODAL LOGIC ---
    const modalTranslation = (currentLang === 'tm')
        ? (item.tm || item.en)
        : item.en;

    document.getElementById('modal-jp').innerText = item.jp;
    document.getElementById('modal-romaji').innerText = item.romaji;
    document.getElementById('modal-en').innerText = modalTranslation;

    modal.style.display = 'flex';
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
        soundBtn.querySelector('span').innerText = (currentLang === 'tm') ? '🔊 Ses Oka' : '🔊 Play Sound';
        soundBtn.onclick = () => speakJapanese(item.jp);
    }
}

// Global Close for Modal
window.addEventListener('click', (event) => {
    const modal = document.getElementById('card-modal');
    if (event.target == modal || event.target.closest('.close-modal')) {
        modal.style.display = 'none';
    }
});

function speakJapanese(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
}

// `loadCategoryContent` is invoked from `updateUI()` in `app.js`.
// Removing the DOMContentLoaded listener here prevents duplicate
// invocations which previously caused recursive reloads / stack
// overflows when both scripts registered listeners.
// document.addEventListener('DOMContentLoaded', loadCategoryContent);