// --- KANA CONTROLLER ---

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

let kanaData = {};

async function loadKanaData() {
    try {
        const response = await fetch("http://localhost:3000/api/kana");
        kanaData = await response.json();
    } catch (error) {
        console.error("Failed to load kana data:", error);
    }
}

// DOM Cache
const elements = {
    grid: document.getElementById('kana-grid'),
    modal: document.getElementById('card-modal'),
    strokeImg: document.getElementById('stroke-animation'),
    soundBtn: document.getElementById('sound-btn'),
    modalRomaji: document.getElementById('modal-romaji'),
    modalEn: document.getElementById('modal-en'),
    slider: document.querySelector('.tab-slider'),
    tabs: document.querySelector('.kana-tabs')
};

function renderGrid(type) {
    if (!elements.grid) return;

    elements.grid.innerHTML = kanaData[type].map(char => {
        if (char.ghost) return `<div class="kana-card ghost" style="visibility: hidden;"></div>`;
        
        return `
            <div class="kana-card" onclick="openKanaModal('${char.jp}', '${char.romaji}', '${char.example}')">
                <div class="kana-char">${char.jp}</div>
                <div class="kana-romaji">${char.romaji}</div>
            </div>
        `;
    }).join('');
}

function switchKana(type, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateSlider(btn);
    renderGrid(type);
}

function updateSlider(btn) {
    if (!elements.slider || !btn || !elements.tabs) return;
    const btnRect = btn.getBoundingClientRect();
    const tabsRect = elements.tabs.getBoundingClientRect();
    elements.slider.style.width = `${btn.offsetWidth}px`;
    elements.slider.style.transform = `translateX(${btnRect.left - tabsRect.left}px)`;
}

function openKanaModal(jp, romaji, example) {
    if (!elements.modal) return;

    elements.modalRomaji.innerText = `Pronunciation: ${romaji}`;
    elements.modalEn.innerText = `Example: ${example}`;

    if (elements.strokeImg) {
        // Some katakana entries intentionally reuse hiragana stroke GIF assets.
        const gifChar = (jp === 'ヘ') ? 'へ' : jp;

        // Try kanagifs first (specific for kana)
        elements.strokeImg.src = `../assets/kanagifs/${gifChar}.gif`;
        elements.strokeImg.style.display = 'block';
        
        elements.strokeImg.onerror = function() {
            // If not found in kanagifs, try kanjigifs as fallback
            console.warn(`Could not load gif from kanagifs for ${gifChar}, trying kanjigifs`);
            elements.strokeImg.src = `../assets/kanjigifs/${gifChar}.gif`;
            
            elements.strokeImg.onerror = function() {
                console.warn(`Could not load gif for ${gifChar} from either folder`);
            };
        };
    }

    elements.modal.style.display = 'flex';

    elements.soundBtn.onclick = () => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(jp);
        utterance.lang = 'ja-JP';
        window.speechSynthesis.speak(utterance);
    };
}

// Ripple Effect Creator
function createRipple(e) {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    circle.className = 'ripple';
    
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size/2;
    const y = e.clientY - rect.top - size/2;
    
    circle.style.cssText = `width: ${size}px; height: ${size}px; left: ${x}px; top: ${y}px;`;
    
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadKanaData();
    // Apply saved theme on page load
    initializePageTheme();
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'hiragana';

    renderGrid(type);

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            createRipple(e);
            switchKana(btn.getAttribute('data-type'), btn);
        });

        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
            setTimeout(() => updateSlider(btn), 100); // Initial slider position
        }
    });

    // Close Modal Logic
    window.addEventListener('click', (e) => {
        if (e.target === elements.modal || e.target.classList.contains('close-modal')) {
            elements.modal.style.display = 'none';
        }
    });

    if (typeof updateUI === 'function') updateUI();
});