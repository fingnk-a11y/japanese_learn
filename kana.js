const kanaData = {
    "hiragana": [
        {"jp": "あ", "romaji": "a", "example": "Ame (Rain)"},
         {"jp": "い", "romaji": "i", "example": "Inu (Dog)"},
        {"jp": "う", "romaji": "u", "example": "Umi (Sea)"},
        {"jp": "え", "romaji": "e", "example": "Eki (Station)"},
        {"jp": "お", "romaji": "o", "example": "Okane (Money)"},
        {"jp": "か", "romaji": "ka", "example": "Kasa (Umbrella)"},
        {"jp": "き", "romaji": "ki", "example": "Kitsune (Fox)"},
         {"jp": "く", "romaji": "ku", "example": "Kuruma (Car)"},
        {"jp": "け", "romaji": "ke", "example": "Keki (Cake)"},
        {"jp": "こ", "romaji": "ko", "example": "Kodomo (Child)"},
        {"jp": "さ", "romaji": "sa", "example": "Sakana (Fish)"},
        {"jp": "し", "romaji": "shi", "example": "Shio (Salt)"},
        {"jp": "す", "romaji": "su", "example": "Sushi"},
        {"jp": "せ", "romaji": "se", "example": "Sekai (World)"},
        {"jp": "そ", "romaji": "so", "example": "Sora (Sky)"},
        {"jp": "た", "romaji": "ta", "example": "Tamago (Egg)"},
        {"jp": "ち", "romaji": "chi", "example": "Chizu (Map)"},
        {"jp": "つ", "romaji": "tsu", "example": "Tsuki (Moon)"},
        {"jp": "て", "romaji": "te", "example": "Tegami (Letter)"},
        {"jp": "と", "romaji": "to", "example": "Tokei (Watch)"},
        {"jp": "な", "romaji": "na", "example": "Natsu (Summer)"},
        {"jp": "に", "romaji": "ni", "example": "Niku (Meat)"},
        {"jp": "ぬ", "romaji": "nu", "example": "Nuigurumi"},
        {"jp": "ね", "romaji": "ne", "example": "Neko (Cat)"},
        {"jp": "の", "romaji": "no", "example": "Nomimono"},
        {"jp": "は", "romaji": "ha", "example": "Hana (Flower)"},
        {"jp": "ひ", "romaji": "hi", "example": "Hikari (Light)"},
        {"jp": "ふ", "romaji": "fu", "example": "Fune (Ship)"},
        {"jp": "へ", "romaji": "he", "example": "Hebi (Snake)"},
        {"jp": "ほ", "romaji": "ho", "example": "Hoshi (Star)"},
        {"jp": "ま", "romaji": "ma", "example": "Mado (Window)"},
        {"jp": "み", "romaji": "mi", "example": "Mizu (Water)"},
        {"jp": "む", "romaji": "mu", "example": "Mushi (Bug)"},
        {"jp": "め", "romaji": "me", "example": "Megane (Glasses)"},
        {"jp": "も", "romaji": "mo", "example": "Mochi"},
        {"jp": "や", "romaji": "ya", "example": "Yama (Mountain)"},
        {"jp": "", "romaji": "", "example": "", "ghost": true},
        {"jp": "ゆ", "romaji": "yu", "example": "Yume (Dream)"},
        {"jp": "", "romaji": "", "example": "", "ghost": true},
        {"jp": "よ", "romaji": "yo", "example": "Yoru (Night)"},
        {"jp": "ら", "romaji": "ra", "example": "Ramen"},
        {"jp": "り", "romaji": "ri", "example": "Ringo (Apple)"},
        {"jp": "る", "romaji": "ru", "example": "Rusu (Away)"},
        {"jp": "れ", "romaji": "re", "example": "Rekishi (History)"},
        {"jp": "ろ", "romaji": "ro", "example": "Rosoku (Candle)"},
        {"jp": "わ", "romaji": "wa", "example": "Wani (Crocodile)"},
        {"jp": "", "romaji": "", "example": "", "ghost": true},
        {"jp": "を", "romaji": "wo", "example": "Particle (o)"},
        {"jp": "", "romaji": "", "example": "", "ghost": true},
        {"jp": "ん", "romaji": "n", "example": "Nihon (Japan)"}
    ],
    "katakana": [
        {"jp": "ア", "romaji": "a", "example": "Aisu (Ice)"},
        {"jp": "イ", "romaji": "i", "example": "Inku (Ink)"},
        {"jp": "ウ", "romaji": "u", "example": "Uetoresu"},
         {"jp": "エ", "romaji": "e", "example": "Erebeta"},
        {"jp": "オ", "romaji": "o", "example": "Orenji"},
        {"jp": "カ", "romaji": "ka", "example": "Kamera"},
        {"jp": "キ", "romaji": "ki", "example": "Kissu (Kiss)"},
        {"jp": "ク", "romaji": "ku", "example": "Kurasu (Class)"},
        {"jp": "ケ", "romaji": "ke", "example": "Kesu (Case)"},
        {"jp": "コ", "romaji": "ko", "example": "Kohi (Coffee)"},
        {"jp": "サ", "romaji": "sa", "example": "Sarada (Salad)"},
         {"jp": "シ", "romaji": "shi", "example": "Shatsu (Shirt)"},
        {"jp": "ス", "romaji": "su", "example": "Suki (Ski)"},
        {"jp": "セ", "romaji": "se", "example": "Senta (Center)"},
        {"jp": "ソ", "romaji": "so", "example": "Sofa"},
        {"jp": "タ", "romaji": "ta", "example": "Takushi (Taxi)"},
        {"jp": "チ", "romaji": "chi", "example": "Chizu (Cheese)"},
        {"jp": "ツ", "romaji": "tsu", "example": "Tua (Tour)"},
        {"jp": "テ", "romaji": "te", "example": "Tenisu (Tennis)"},
        {"jp": "ト", "romaji": "to", "example": "Tosuto (Toast)"},
        {"jp": "ナ", "romaji": "na", "example": "Naifu (Knife)"},
        {"jp": "ニ", "romaji": "ni", "example": "Nyusu (News)"},
        {"jp": "ヌ", "romaji": "nu", "example": "Nudoru"},
        {"jp": "ネ", "romaji": "ne", "example": "Nekutai"},
        {"jp": "ノ", "romaji": "no", "example": "Notto (Note)"},
         {"jp": "ハ", "romaji": "ha", "example": "Hamu (Ham)"},
        {"jp": "ヒ", "romaji": "hi", "example": "Hinto (Hint)"},
        {"jp": "フ", "romaji": "fu", "example": "Foku (Fork)"},
        {"jp": "へ", "romaji": "he", "example": "Herumetto"},
        {"jp": "ホ", "romaji": "ho", "example": "Hoteru (Hotel)"},
        {"jp": "マ", "romaji": "ma", "example": "Masuku (Mask)"},
        {"jp": "ミ", "romaji": "mi", "example": "Miruku (Milk)"},
        {"jp": "ム", "romaji": "mu", "example": "Mubi (Movie)"},
        {"jp": "メ", "romaji": "me", "example": "Menyu (Menu)"},
        {"jp": "モ", "romaji": "mo", "example": "Monita"},
        {"jp": "ヤ", "romaji": "ya", "example": "Yado (Yard)"},
        {"jp": "", "romaji": "", "example": "", "ghost": true},
        {"jp": "ユ", "romaji":"yu", "example": "Yuza (User)"},
        {"jp": "", "romaji": "", "example": "", "ghost": true},
        {"jp": "ヨ", "romaji": "yo", "example": "Yoguruto"},
        {"jp": "ラ", "romaji": "ra", "example": "Rajio (Radio)"},
        {"jp": "リ", "romaji": "ri", "example": "Ribon (Ribbon)"},
        {"jp": "ル", "romaji": "ru", "example": "Ruru (Rule)"},
        {"jp": "レ", "romaji": "re", "example": "Remon (Lemon)"},
        {"jp": "ロ", "romaji": "ro", "example": "Roketto"},
        {"jp": "ワ", "romaji": "wa", "example": "Wain (Wine)"},
        {"ghost": true},
        {"jp": "ヲ", "romaji": "wo", "example": "Particle"},
        {"ghost": true},
        {"jp": "ン", "romaji": "n", "example": "Meron (Melon)"}
    ]
};

function renderGrid(type) {
    const grid = document.getElementById('kana-grid');
    if (!grid) return;

    grid.innerHTML = kanaData[type].map(char => {
        if (char.ghost) {
            return `<div class="kana-card ghost" style="visibility: hidden;"></div>`;
        }
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
    renderGrid(type);
    // move the slider under the current button
    updateSlider(btn);
}

// helper: position the sliding indicator beneath a button
function updateSlider(btn) {
    const slider = document.querySelector('.tab-slider');
    if (!slider || !btn) return;
    const width = btn.offsetWidth;
    const offset = btn.offsetLeft;
    slider.style.width = width + 'px';
    slider.style.transform = `translateX(${offset}px)`;
}

function openKanaModal(jp, romaji, example) {
    const modal = document.getElementById('card-modal');
    document.getElementById('modal-jp').innerText = jp;
    document.getElementById('modal-romaji').innerText = `Pronunciation: ${romaji}`;
    document.getElementById('modal-en').innerText = `Example: ${example}`;

    const strokeImg = document.getElementById('stroke-animation');
    if (strokeImg) {
        strokeImg.src = `assets/kanagifs/${jp}.gif`;
    }

    modal.style.display = 'flex';

    document.getElementById('sound-btn').onclick = () => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(jp);
        utterance.lang = 'ja-JP';
        window.speechSynthesis.speak(utterance);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'hiragana';

    renderGrid(type);

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        // ripple listener for additional flair
        btn.addEventListener('click', createRipple);

        if (btn.innerText.toLowerCase() === type) {
            btn.classList.add('active');
            // position slider at start
            updateSlider(btn);
        } else {
            btn.classList.remove('active');
        }
    });

    // handle window resize so slider stays under the right element
    window.addEventListener('resize', () => {
        const active = document.querySelector('.tab-btn.active');
        if (active) updateSlider(active);
    });

    // simple ripple creator
    function createRipple(e) {
        const btn = e.currentTarget;
        const circle = document.createElement('span');
        circle.className = 'ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        circle.style.width = circle.style.height = size + 'px';
        const x = e.clientX - rect.left - size/2;
        const y = e.clientY - rect.top - size/2;
        circle.style.left = x + 'px';
        circle.style.top = y + 'px';
        btn.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
    }

    // Window click logic moved INSIDE the DOMContentLoaded listener for safety
    window.onclick = (e) => {
        const modal = document.getElementById('card-modal');
        if (e.target === modal || e.target.classList.contains('close-modal')) {
            modal.style.display = 'none';
        }
    };

    // ensure global UI updates (language & theme icons) also run
    if (typeof updateUI === 'function') updateUI();
});