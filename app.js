// --- GLOBAL APP CONTROLLER ---
// This file only handles the Search Bar UI and "routes" the search
// to whichever page is currently open.

// ==============================================
// GLOBAL STATE INITIALIZATION
// ==============================================
// THEME PERSISTENCE: Get saved theme from localStorage, fallback to 'default' only on first visit
let currentStyle = localStorage.getItem('selectedStyle');
if (!currentStyle) {
    // First time visitor - start with default
    currentStyle = 'default';
    localStorage.setItem('selectedStyle', currentStyle);
} else {
    // Returning visitor - use saved theme
    currentStyle = localStorage.getItem('selectedStyle');
}

let currentTheme = localStorage.getItem('selectedTheme') || 'light';
let currentLang = localStorage.getItem('selectedLanguage') || 'en';
let stylesData = null;

// Detect if we're in a subdirectory for proper asset paths
const pathParts = window.location.pathname.split('/');
const parentFolder = pathParts[pathParts.length - 2];
const isSubdirectory = ['kana', 'kanji', 'quiz', 'grammar', 'vocabulary'].includes(parentFolder);
const assetPathPrefix = isSubdirectory ? '../' : '';

// ==============================================
// THEME MEMORY & INTELLIGENT ROUTING
// ==============================================

// Apply theme guard before page renders (for flags)
function initializeFlagPath() {
    const flagImg = document.getElementById('flag-img');
    if (flagImg && !flagImg.src) {
        const flagToDisplay = (currentLang === 'tm') ? 'en' : 'tm';
        flagImg.src = `${assetPathPrefix}assets/flags/${flagToDisplay}.png`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFlagPath);
} else {
    initializeFlagPath();
}

// Ensure theme is applied reliably without race conditions
async function initializeTheme() {
    try {
        const response = await fetch("http://localhost:3000/api/styles");
        stylesData = await response.json();
        
        // Apply immediately if DOM is ready, otherwise wait
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => applyStyle(currentStyle));
        } else {
            applyStyle(currentStyle);
        }
    } catch (error) {
        console.error('Failed to load styles data:', error);
    }
}

// Start loading the theme immediately
initializeTheme();

// Load language data
let langData = null;
async function loadLangData() {
    try {
        const response = await fetch("http://localhost:3000/api/lang");
        langData = await response.json();
        applyTranslations();
    } catch (error) {
        console.error('Failed to load language data:', error);
    }
}

// Apply translations to all elements with data-lang-key attribute
function applyTranslations() {
    if (!langData) return;
    
    const currentLangData = langData[currentLang];
    if (!currentLangData) return;
    
    // Update all elements with data-lang-key attribute
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (currentLangData[key]) {
            element.textContent = currentLangData[key];
        }
    });
}

// Load lang data on script load
loadLangData();

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

// ==============================================
// THEME APPLICATION
// ==============================================

function resolveThemeAssets(assets) {
    // Resolves asset paths, providing fallbacks for missing assets
    if (!assets) return {};
    return {
        mascot_main: assets.mascot_main || null,
        mascot_success: assets.mascot_success || null,
        mascot_error: assets.mascot_error || null,
        section_icons: assets.section_icons || []
    };
}

function resolveSearchIcon(style) {
    if (!style) return '🔍';
    if (typeof style.search_icon === 'string' && style.search_icon.trim()) {
        return style.search_icon.trim();
    }
    if (style.assets && typeof style.assets.search_icon === 'string' && style.assets.search_icon.trim()) {
        return style.assets.search_icon.trim();
    }
    return '🔍';
}

function isImageAssetPath(value) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;

    // Allow DB-coded image data and direct URLs, not only local file paths.
    if (/^data:image\//i.test(trimmed)) return true;
    if (/^(https?:|blob:|\/)/i.test(trimmed)) return true;

    return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(trimmed);
}

function resolveImageReference(imageValue) {
    if (typeof imageValue !== 'string') return null;
    const trimmed = imageValue.trim();
    if (!trimmed) return null;

    // Keep direct references untouched (http(s), data URLs, blob URLs, root-relative paths).
    if (/^(https?:|data:|blob:|\/)/i.test(trimmed)) return trimmed;

    return `${assetPathPrefix}${trimmed}`;
}

function resolveThemeHeaderImage(style) {
    if (!style || !style.assets || typeof style.assets !== 'object') return null;

    // DB convention for theme header artwork.
    const heroHeader = style.assets.hero_header;
    if (typeof heroHeader === 'string' && isImageAssetPath(heroHeader)) {
        return heroHeader;
    }

    return null;
}

function applySearchIconForTheme(style) {
    const iconValue = resolveSearchIcon(style);
    const searchIcons = document.querySelectorAll('.search-icon');
    if (!searchIcons.length) return;

    searchIcons.forEach(iconEl => {
        iconEl.textContent = '';
        iconEl.classList.remove('search-icon-has-image');

        // If icon is a path/URL, render image; otherwise render emoji/text.
        const isPathLike = iconValue.includes('/') || iconValue.includes('.');
        if (isPathLike) {
            const iconImg = document.createElement('img');
            iconImg.className = 'theme-search-icon';
            iconImg.alt = 'Search';

            const isAbsolute = /^(https?:|data:|\/)/i.test(iconValue);
            iconImg.src = isAbsolute ? iconValue : `${assetPathPrefix}${iconValue}`;

            iconEl.appendChild(iconImg);
            iconEl.classList.add('search-icon-has-image');
        } else {
            iconEl.textContent = iconValue;
        }
    });
}

function applyStyle(styleId = currentStyle) {
    if (!stylesData) return;
    
    const style = stylesData.styles.find(s => s.id === styleId);
    if (!style) return;

    currentStyle = styleId;
    localStorage.setItem('selectedStyle', styleId);

    const root = document.documentElement;
    root.removeAttribute("style");
    
    // 1. Apply color mappings from theme data - comprehensive theme setup
    if (style.colors) {
        root.style.setProperty('--bg-light', style.colors.bg_main);
        root.style.setProperty('--bg-main', style.colors.bg_main);
        root.style.setProperty('--bg-card', style.colors.bg_card);
        root.style.setProperty('--accent-primary', style.colors.accent_primary);
        root.style.setProperty('--accent-secondary', style.colors.accent_secondary);
        root.style.setProperty('--primary-red', style.colors.accent_primary);
        root.style.setProperty('--text-dark', style.colors.text_main);
        root.style.setProperty('--text-main', style.colors.text_main);
        root.style.setProperty('--text-muted', style.colors.text_muted);
        root.style.setProperty('--text-gray', style.colors.text_muted);
        root.style.setProperty('--border-glow', style.colors.border_glow);
        
        // Calculate shadow color from accent primary (15% opacity)
        const accentColor = style.colors.accent_primary;
        if (accentColor.startsWith('#')) {
            const r = parseInt(accentColor.slice(1, 3), 16);
            const g = parseInt(accentColor.slice(3, 5), 16);
            const b = parseInt(accentColor.slice(5, 7), 16);
            if(style.premium) { root.style.setProperty('--shadow-premium', `0 10px 40px rgba(${r}, ${g}, ${b}, 0.2)`); }
        }
    }

    // 2. Apply custom CSS variables from style definition
    if (style.css) {
        Object.entries(style.css).forEach(([prop, val]) => {
            if (typeof val === 'string' && val.includes("url('assets/")) {
                val = val.replace("url('assets/", "url('" + assetPathPrefix + "assets/");
            }
            root.style.setProperty(prop, val);
        });
    }

    // 3. Apply the data-theme attribute for CSS selectors
    root.setAttribute('data-theme', styleId);

    // 3.1 Optional theme hero image override (from DB assets.hero_header)
    const themeHeaderImage = resolveThemeHeaderImage(style);
    if (themeHeaderImage) {
        const resolvedHeaderImage = resolveImageReference(themeHeaderImage);
        document.body.classList.add('theme-header-image');
        root.style.setProperty('--theme-hero-image', `url('${resolvedHeaderImage}')`);
    } else {
        document.body.classList.remove('theme-header-image');
        root.style.removeProperty('--theme-hero-image');
    }

    // 4. Handle premium theme class and assets
    if (style.premium) {
        document.body.classList.add('premium-theme');
        
        // Handle premium background
        const premiumBg = document.getElementById('premium-bg');
        if (premiumBg && style.assets) {
            const bgImage = style.assets.background || style.assets.bg_overlay;
            const fallbackBgColor = (style.colors && (style.colors.bg_main || style.colors.bg_card))
                ? (style.colors.bg_main || style.colors.bg_card)
                : 'transparent';

            // Always paint a color layer; if an image exists it renders above this fallback color.
            premiumBg.style.backgroundColor = fallbackBgColor;
            if (bgImage) {
                const resolvedBackgroundImage = resolveImageReference(bgImage);
                premiumBg.style.backgroundImage = `url('${resolvedBackgroundImage}')`;
            } else {
                premiumBg.style.backgroundImage = 'none';
            }
        }

        // Handle icons
        if (style.assets) {
            let iconIndex = 0;
            document.querySelectorAll('.item-icon-circle').forEach(iconContainer => {
                const key = iconContainer.getAttribute('data-icon-key');
                let val = null;
                
                if (key && style.assets[key]) {
                    val = style.assets[key];
                } else if (style.assets.section_icons && style.assets.section_icons.length > 0) {
                    val = style.assets.section_icons[iconIndex % style.assets.section_icons.length];
                }
                
                const imgEl = iconContainer.querySelector('.premium-icon');
                const basic = iconContainer.querySelector('.basic-icon');

                if (val) {
                    if (val.includes('.') && !val.includes(' ')) {
                        if (imgEl) {
                            imgEl.src = `${assetPathPrefix}${val}`;
                            imgEl.style.display = 'block';
                        }
                        if (basic) basic.style.display = 'none';
                    } else {
                        if (basic) {
                            basic.textContent = val;
                            basic.style.display = 'block';
                        }
                        if (imgEl) {
                            imgEl.style.display = 'none';
                            imgEl.src = '';
                        }
                    }
                } else {
                    if (imgEl) {
                        imgEl.style.display = 'none';
                        imgEl.src = '';
                    }
                    if (basic) {
                        // Reset to default text if we have it on data-default or similar?
                        // Let's just make basic visible
                        basic.style.display = 'block';
                    }
                }
                iconIndex++;
            });
            
            // Header Profile Icon update for premium themes
            const headerProfileImg = document.getElementById('header-profile-img');
            const headerProfileBasic = document.getElementById('header-profile-basic');
            if (style.assets.profile_icon) {
                if (headerProfileImg) {
                    headerProfileImg.src = `${assetPathPrefix}${style.assets.profile_icon}`;
                    headerProfileImg.style.display = 'block';
                }
                if (headerProfileBasic) headerProfileBasic.style.display = 'none';
            } else {
                if (headerProfileImg) {
                    headerProfileImg.src = '';
                    headerProfileImg.style.display = 'none';
                }
                if (headerProfileBasic) headerProfileBasic.style.display = 'block';
            }
        }
    } else {
        document.body.classList.remove('premium-theme');
        const premiumBg = document.getElementById('premium-bg');
        if (premiumBg) {
            premiumBg.style.backgroundImage = 'none';
            premiumBg.style.backgroundColor = 'transparent';
        }
        // Reset card icons
        document.querySelectorAll('.item-icon-circle').forEach(iconContainer => {
            const imgEl = iconContainer.querySelector('.premium-icon');
            const basic = iconContainer.querySelector('.basic-icon');
            if (imgEl) {
                imgEl.style.display = 'none';
                imgEl.src = '';
            }
            if (basic) basic.style.display = 'block';
        });
        // Reset header profile icon
        const headerProfileImg = document.getElementById('header-profile-img');
        const headerProfileBasic = document.getElementById('header-profile-basic');
        if (headerProfileImg) {
            headerProfileImg.src = '';
            headerProfileImg.style.display = 'none';
        }
        if (headerProfileBasic) headerProfileBasic.style.display = 'block';
    }

    // 5. Update Mascot (if the element exists)
    const mascotImg = document.getElementById('mascot-display');
    if (mascotImg && style.assets) {
        const assets = resolveThemeAssets(style.assets);
        if (assets.mascot_main) {
            mascotImg.src = assets.mascot_main;
            mascotImg.style.display = 'block';
        } else {
            mascotImg.style.display = 'none';
        }
    }

    applySearchIconForTheme(style);
}

function cycleTheme() {
    if (!stylesData || !stylesData.styles.length) return;
    
    const currentIndex = stylesData.styles.findIndex(s => s.id === currentStyle);
    const nextIndex = (currentIndex + 1) % stylesData.styles.length;
    const nextStyle = stylesData.styles[nextIndex];
    
    applyStyle(nextStyle.id);
    updateUI();
}

function toggleTheme() {
    // This now cycles through available styles instead of just dark/light
    cycleTheme();
}

function applyTheme() {
    // Legacy function for dark mode class toggling alongside style system
    document.body.classList.toggle('dark-mode', currentTheme === 'dark');
}

// ==============================================
// MODULAR NAVIGATION FUNCTIONS
// These are called by premium.js for decoupled navigation
// ==============================================

/**
 * Modular theme selection with intelligent navigation
 * @param {string} themeId - Theme ID from API-backed theme data
 */
function selectThemeAndNavigate(themeId) {
    if (!stylesData) return;
    const selectedTheme = stylesData.styles.find(s => s.id === themeId);
    if (!selectedTheme) return;
    localStorage.setItem('selectedStyle', themeId);
    currentStyle = themeId;
    
    // Apply style immediately on current page instead of navigating away
    applyStyle(themeId);
}

/**
 * Open user profile (stub for extensibility)
 */
function openUserProfile() {
    console.log('Opening user profile...');
    // Implement profile modal or page here
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    applyTheme();
    applyStyle(currentStyle);
    
    // Add menu close functionality - close menu when clicking outside
    document.addEventListener('click', (e) => {
        const menuToggle = document.getElementById('menu-toggle');
        const menuDropdown = document.getElementById('menu-dropdown');
        
        // If menu is open and click is outside menu and not on menu toggle button
        if (menuDropdown && menuDropdown.classList.contains('active')) {
            if (!menuDropdown.contains(e.target) && !menuToggle?.contains(e.target)) {
                menuDropdown.classList.remove('active');
            }
        }
    });
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
    // Apply translations to all elements with data-lang-key
    applyTranslations();
    
    const flagImg = document.getElementById('flag-img');
    const subtitle = document.getElementById('hero-subtitle');
    const themeIcon = document.getElementById('theme-icon');

    // Update Flag Image: Show the flag of the language the user can switch TO
    if (flagImg) {
        const flagToDisplay = (currentLang === 'tm') ? 'en' : 'tm';
        // Use the global assetPathPrefix to handle both root and subdirectory pages
        const candidate = `${assetPathPrefix}assets/flags/${flagToDisplay}.png`;
        const fallback = `${assetPathPrefix}assets/flags/us.png`;
        fetch(candidate, { method: 'HEAD' }).then(resp => {
            if (resp.ok) flagImg.src = candidate;
            else flagImg.src = fallback;
        }).catch(() => { flagImg.src = fallback; });
    }

    // Update theme icon
    if (themeIcon) {
        // Show which theme is active (cycling theme indicator)
        if (stylesData && stylesData.styles) {
            const currentThemeObj = stylesData.styles.find(s => s.id === currentStyle);
            if (currentThemeObj) {
                themeIcon.innerText = '🎨'; // Art palette indicates theme cycling
                themeIcon.title = `Current theme: ${currentThemeObj.name}`;
            }
        } else {
            themeIcon.innerText = '🎨';
        }
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

    // --- VOCABULARY PAGE UI UPDATES (CATEGORIES VIEW) ---
    // re-render vocabulary category cards when language changes
    if (typeof renderCategoryCards === 'function' && typeof vocabData !== 'undefined' && vocabData.length && currentView === 'categories') {
        renderCategoryCards(vocabData);
    }

    // --- GRAMMAR PAGE UI UPDATES ---
    // if a grammar lesson is open, use the grammar-specific update function
    const detailView = document.getElementById('lesson-detail-view');
    if (detailView && detailView.style.display === 'block') {
        if (typeof updateGrammarLessonDetailView === 'function') {
            updateGrammarLessonDetailView();
        }
    }

    // --- CATEGORY PAGE UI UPDATES (VOCABULARY ITEMS VIEW) ---
    // when viewing a specific vocabulary category we need to reload the
    // content so every card and header uses the current language. The
    // existing applyCategoryRender function already applies the correct
    // translations, so just reinvoke if we have cached category data.
    if (typeof applyCategoryRender === 'function' && cachedCategory && cachedCategory.id && cachedCategory.data) {
        applyCategoryRender(cachedCategory.id, cachedCategory.data, cachedCategory.info);
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

    if (stylesData && stylesData.styles) {
        const activeStyle = stylesData.styles.find(s => s.id === currentStyle);
        if (activeStyle) {
            applySearchIconForTheme(activeStyle);
        }
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

// ==============================================
// MENU FUNCTIONS
// ==============================================

function toggleMenu(event) {
    // Prevent event from bubbling to document click handler
    if (event) {
        event.stopPropagation();
    }
    const menuDropdown = document.getElementById('menu-dropdown');
    if (!menuDropdown) return;
    
    menuDropdown.classList.toggle('active');
}

function goHome() {
    // Navigate home respecting current path depth
    window.location.href = (typeof assetPathPrefix !== 'undefined' ? assetPathPrefix : '') + 'index.html';

    // Close the menu after navigation
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
        menuDropdown.classList.remove('active');
    }
}

function changeStyle() {
    // Close the menu when user clicks on Change Style
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
        menuDropdown.classList.remove('active');
    }
    
    if (!stylesData || !stylesData.styles) {
        alert('Styles not loaded. Please refresh the page.');
        return;
    }

    // Create or get the style selector modal
    let modal = document.getElementById('style-selector-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'style-selector-modal';
        modal.className = 'style-selector-modal';
        modal.innerHTML = `
            <div class="style-selector-content">
                <div class="style-selector-header">
                    <h2>Select a Theme</h2>
                    <button class="close-modal-btn" onclick="document.getElementById('style-selector-modal').style.display='none';">✕</button>
                </div>
                <div class="style-selector-grid" id="style-grid"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Populate the style grid
    const styleGrid = document.getElementById('style-grid');
    styleGrid.innerHTML = '';
    
    stylesData.styles.forEach(style => {
        const styleCard = document.createElement('div');
        styleCard.className = 'style-card';
        if (style.id === currentStyle) {
            styleCard.classList.add('active');
        }
        
        const previewColors = style.preview || style.colors;
        styleCard.innerHTML = `
            <div class="style-preview" style="background: ${previewColors.background || '#f0f0f0'}; border: 3px solid ${previewColors.primary || '#e63946'};">
                <div class="preview-dot" style="background: ${previewColors.primary || '#e63946'};"></div>
                <div class="preview-dot" style="background: ${previewColors.secondary || '#0984e3'};"></div>
            </div>
            <div class="style-info">
                <h3>${currentLang === 'tm' && style.name_tm ? style.name_tm : style.name}</h3>
                <p>${currentLang === 'tm' ? style.name : style.description}</p>
                ${style.premium ? '<span class="premium-badge">Premium</span>' : ''}
            </div>
        `;
        
        styleCard.onclick = () => {
            // Use modular theme selection function
            selectThemeAndNavigate(style.id);
            // Close modal after selection
            modal.style.display = 'none';
        };
        
        styleGrid.appendChild(styleCard);
    });

    // Show the modal
    modal.style.display = 'flex';
    
    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function showAbout() {
    // Close the menu when user clicks on About
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
        menuDropdown.classList.remove('active');
    }

    let aboutModal = document.getElementById('about-modal-card');
    if (!aboutModal) {
        aboutModal = document.createElement('div');
        aboutModal.id = 'about-modal-card';
        aboutModal.className = 'about-modal';
        aboutModal.style.display = 'none';

        const isTm = currentLang === 'tm';
        const title = isTm ? 'Nihongo Master hakda' : 'About Nihongo Master';
        const line1 = isTm
            ? 'Nihongo Master tertipli we düşnükli ýapon dili okuw tejribesini hödürleýär.'
            : 'Nihongo Master provides a structured and practical path for learning Japanese.';
        const line2 = isTm
            ? 'Bu ýerden taslama hakyndaky resmi ýazgyňyzy, topar maglumatlaryny we bellikleri goşup bilersiňiz.'
            : 'You can replace this area with your official project summary, team details, and release notes.';
        const line3 = isTm
            ? 'Modullar: Kana, Kanji, Vocabulary, Grammar, we Flash Quiz.'
            : 'Current modules: Kana, Kanji, Vocabulary, Grammar, and Flash Quiz.';

        aboutModal.innerHTML = `
            <section class="about-modal-card" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
                <header class="about-modal-header">
                    <h2 id="about-modal-title" class="about-modal-title">${title}</h2>
                    <button id="about-modal-close" class="about-modal-close" type="button" aria-label="Close">×</button>
                </header>
                <div class="about-modal-body">
                    <p><strong>Nihongo Master</strong> ${line1}</p>
                    <p>${line2}</p>
                    <p class="about-modal-muted">${line3}</p>
                </div>
            </section>
        `;

        document.body.appendChild(aboutModal);

        const closeAboutModal = () => {
            aboutModal.style.display = 'none';
            document.removeEventListener('keydown', aboutModal._escapeHandler);
        };

        const closeBtn = aboutModal.querySelector('#about-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeAboutModal);
        }

        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                closeAboutModal();
            }
        });

        aboutModal._escapeHandler = (e) => {
            if (e.key === 'Escape' && aboutModal.style.display === 'flex') {
                closeAboutModal();
            }
        };
    }

    document.addEventListener('keydown', aboutModal._escapeHandler);
    aboutModal.style.display = 'flex';
}
// ==============================================
// GLOBAL PROFILE MODAL SYSTEM
// ==============================================
(function() {
    document.addEventListener("DOMContentLoaded", function() {
        const profileBtns = document.querySelectorAll('.profile-btn, .starrail-profile-btn, .profile-btn-global');
        if (profileBtns.length === 0) return;
        
        let db;

        const defaultProfileImage = assetPathPrefix + 'assets/animestyle/m7icon1.png';

        if (!document.getElementById('global-profile-modal')) {
            const modalHTML = `
            <div id="global-profile-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:99999; align-items:center; justify-content:center; backdrop-filter: blur(8px); opacity: 0; transition: opacity 0.3s ease;">
                <div style="background:var(--bg-card, #ffffff); padding: 40px 30px; border-radius: 24px; text-align:center; width: 360px; color: var(--text-main, #2d3436); position:relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2); border: 1px solid rgba(0,0,0,0.05); transform: translateY(-20px) scale(0.95); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <div id="close-profile-modal" style="position:absolute; top:15px; right:15px; cursor:pointer; width:36px; height:36px; border-radius:50%; background:rgba(0,0,0,0.05); display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold; color:var(--text-muted, #636e72); transition: all 0.2s ease;">&times;</div>
                    
                    <h3 style="margin: 0 0 25px 0; font-size: 1.4rem; font-weight: 800; color: var(--text-dark, #1a1a2e);">Learner Profile</h3>

                    <div style="width:120px; height:120px; border-radius:50%; overflow:hidden; margin:0 auto 20px; border:4px solid var(--bg-card, white); box-shadow: 0 10px 25px rgba(0,0,0,0.15); position: relative; background: #f0f0f0;">
                        <img id="modal-profile-img" src="${defaultProfileImage}" style="width:100%; height:100%; object-fit:cover; transition: transform 0.3s ease;">
                    </div>
                    
                    <input type="file" id="profile-upload" accept="image/*" style="display:none;">
                    <button id="trigger-profile-upload" style="margin-bottom:25px; padding: 8px 20px; cursor: pointer; border-radius: 50px; border: 1px solid rgba(0,0,0,0.1); background: var(--bg-light, #f8f9fa); color: var(--text-main, #2d3436); font-weight:600; font-size:0.9rem; transition:all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02);" onmouseover="this.style.background='var(--bg-card, #fff)'" onmouseout="this.style.background='var(--bg-light, #f8f9fa)'">&uarr; Upload Avatar</button>
                    
                    <div style="text-align: left; margin-bottom: 30px;">
                        <label style="display:block; margin-bottom:8px; font-weight:600; font-size:0.9rem; color:var(--text-muted, #636e72);">Display Name</label>
                        <input type="text" id="profile-username" placeholder="What should we call you?" style="width:100%; padding:14px 16px; border: 2px solid rgba(0,0,0,0.08); border-radius: 12px; font-weight: 500; font-size: 1rem; background: var(--bg-light, #f8f9fa); color: var(--text-main, #2d3436); outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; box-sizing: border-box;" onfocus="this.style.borderColor='var(--accent-primary, #e63946)'; this.style.boxShadow='0 0 0 3px rgba(230,57,70,0.1)'" onblur="this.style.borderColor='rgba(0,0,0,0.08)'; this.style.boxShadow='none'">
                    </div>
                    
                    <button id="save-profile-btn" style="padding:14px 20px; cursor: pointer; background: var(--accent-primary, #e63946); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 1.05rem; width: 100%; box-shadow: 0 4px 15px rgba(230,57,70,0.3); transition:all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(230,57,70,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(230,57,70,0.3)'">Save Changes</button>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const closeBtn = document.getElementById('close-profile-modal');
            if(closeBtn) {
                closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'rgba(230,57,70,0.1)'; closeBtn.style.color = 'var(--accent-primary, #e63946)'; });
                closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'rgba(0,0,0,0.05)'; closeBtn.style.color = 'var(--text-muted, #636e72)'; });
            }
        }

        const modal = document.getElementById('global-profile-modal');
        const fileInput = document.getElementById('profile-upload');
        const imgPreview = document.getElementById('modal-profile-img');
        const usernameInput = document.getElementById('profile-username');

        const request = indexedDB.open("ProfileDB", 1);
        request.onupgradeneeded = function(e) {
            db = e.target.result;
            if(!db.objectStoreNames.contains('userProfile')) {
                db.createObjectStore("userProfile", { keyPath: "id" });
            }
        };
        request.onsuccess = function(e) {
            db = e.target.result;
            loadProfileData();
        };

        function updateAllProfileUI(imgData) {
            profileBtns.forEach(btn => {
                btn.style.borderRadius = "50%";
                btn.style.padding = "0";
                btn.style.overflow = "hidden";
                btn.style.display = "flex";
                btn.style.alignItems = "center";
                btn.style.justifyContent = "center";
                btn.innerHTML = `<img src="${imgData}" style="width:100%; height:100%; object-fit:cover;" alt="Profile">`;
                
                if(!btn.classList.contains('starrail-profile-btn') && !btn.classList.contains('profile-btn-global')){
                   // Relying on CSS sizing so we can have larger interactive avatar buttons
                }
            });
            imgPreview.src = imgData;
        }

        function loadProfileData() {
            const transaction = db.transaction(["userProfile"], "readonly");
            const store = transaction.objectStore("userProfile");
            const getReq = store.get(1);
            getReq.onsuccess = function(e) {
                if (e.target.result && e.target.result.image) {
                    updateAllProfileUI(e.target.result.image);
                    if(e.target.result.username) usernameInput.value = e.target.result.username;
                } else {
                    updateAllProfileUI(defaultProfileImage);
                }
            };
        }

        profileBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'flex';
                // Trigger reflow to apply CSS transitions
                void modal.offsetWidth;
                modal.style.opacity = '1';
                modal.querySelector('div').style.transform = 'translateY(0) scale(1)';
            });
        });

        function closeModal() {
            modal.style.opacity = '0';
            modal.querySelector('div').style.transform = 'translateY(-20px) scale(0.95)';
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        }

        document.getElementById('close-profile-modal').addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if(e.target === modal) closeModal();
        });

        document.getElementById('trigger-profile-upload').addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    imgPreview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('save-profile-btn').addEventListener('click', () => {
            const username = usernameInput.value;
            const imgData = imgPreview.src;
            
            const transaction = db.transaction(["userProfile"], "readwrite");
            const store = transaction.objectStore("userProfile");
            store.put({ id: 1, username: username, image: imgData });
            
            updateAllProfileUI(imgData);
            
            const saveBtn = document.getElementById('save-profile-btn');
            const ogText = saveBtn.innerText;
            saveBtn.innerText = 'Saved! ✓';
            saveBtn.style.background = '#2ecc71';
            
            setTimeout(() => {
                saveBtn.innerText = ogText;
                saveBtn.style.background = 'var(--accent-primary, #e63946)';
                closeModal();
            }, 600);
        });
    });
})();


