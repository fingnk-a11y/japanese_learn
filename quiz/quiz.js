/**
 * Generates a single quiz question with one correct answer and three distractors
 * @param {Array} data - Array of question objects with at least 'jp' and 'en' properties
 * @returns {Object} Quiz question object with Japanese, meaning, options, and correct index
 * @throws {Error} If data array has fewer than 4 items
 */

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

/**
 * Generates a single quiz question with one correct answer and three distractors
 * @param {Array} data - Array of question objects with at least 'jp' and 'en' properties
 * @param {Object} [forcedCorrect] - Optional item that should be used as the correct answer
 * @returns {Object} Quiz question object with Japanese, meaning, options, and correct index
 * @throws {Error} If data array has fewer than 4 items or forcedCorrect isn't found
 */
function generateQuizQuestion(data, forcedCorrect = null) {
    // Validate input
    if (!Array.isArray(data) || data.length < 4) {
        throw new Error('Data must be an array with at least 4 items');
    }

    // Determine index of correct answer (either random or forced)
    let correctIdx;
    if (forcedCorrect) {
        correctIdx = data.findIndex(
            item => item.jp === forcedCorrect.jp && item.en === forcedCorrect.en
        );
        if (correctIdx === -1) {
            throw new Error('Forced correct item not found in data');
        }
    } else {
        correctIdx = Math.floor(Math.random() * data.length);
    }

    const correct = data[correctIdx];

    // Efficiently select 3 random distractors using Set for O(1) lookup
    const usedIndices = new Set([correctIdx]);
    const distractors = [];

    while (distractors.length < 3) {
        const randomIdx = Math.floor(Math.random() * data.length);
        if (!usedIndices.has(randomIdx)) {
            distractors.push(data[randomIdx]);
            usedIndices.add(randomIdx);
        }
    }

    // Combine all options and shuffle using Fisher-Yates algorithm
    const allOptions = [correct, ...distractors];
    for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    // Find the correct answer position in the shuffled array
    const correctIndex = allOptions.findIndex(item => item.jp === correct.jp && item.en === correct.en);

    return {
        japanese: correct.jp,
        meaning: correct.en,
        options: allOptions.map(item => item.en),
        correctIndex
    };
}

const MAX_QUESTIONS = 15; // cap of questions shown in any quiz run

let currentQuiz = {
    type: null,
    questions: [],
    currentIndex: 0,
    score: 0,
    incorrect: 0,
    skipped: 0,
    selectedAnswer: null
};

function getQuizDefaultAvatarPath() {
    if (typeof assetPathPrefix === 'string') {
        return `${assetPathPrefix}assets/animestyle/m7icon1.png`;
    }
    return '../assets/animestyle/m7icon1.png';
}

function updateResultsProfileUI(profile = {}) {
    const avatarEl = document.getElementById('result-profile-avatar');
    const fallbackEl = document.getElementById('result-profile-fallback');
    const nameEl = document.getElementById('result-profile-name');

    if (!avatarEl || !fallbackEl || !nameEl) {
        return;
    }

    const rawName = typeof profile.username === 'string' ? profile.username.trim() : '';
    const displayName = rawName || 'Learner';
    const avatarSrc = (typeof profile.image === 'string' && profile.image.trim())
        ? profile.image
        : getQuizDefaultAvatarPath();

    nameEl.textContent = displayName;
    fallbackEl.textContent = displayName.charAt(0).toUpperCase() || 'U';

    avatarEl.onerror = () => {
        avatarEl.style.display = 'none';
        fallbackEl.style.display = 'inline';
    };

    avatarEl.onload = () => {
        avatarEl.style.display = 'block';
        fallbackEl.style.display = 'none';
    };

    avatarEl.src = avatarSrc;
}

function loadResultsProfile() {
    updateResultsProfileUI();

    if (!('indexedDB' in window)) {
        return;
    }

    try {
        const request = indexedDB.open('ProfileDB', 1);

        request.onsuccess = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('userProfile')) {
                db.close();
                return;
            }

            const tx = db.transaction(['userProfile'], 'readonly');
            const store = tx.objectStore('userProfile');
            const getReq = store.get(1);

            getReq.onsuccess = function(e) {
                const profile = e.target.result || {};
                updateResultsProfileUI(profile);
            };

            getReq.onerror = function() {
                updateResultsProfileUI();
            };

            tx.oncomplete = function() {
                db.close();
            };
        };

        request.onerror = function() {
            updateResultsProfileUI();
        };
    } catch (error) {
        console.error('Failed to load profile data for quiz results:', error);
    }
}

async function startQuiz(category) {
    currentQuiz.type = category;
    currentQuiz.questions = [];
    currentQuiz.currentIndex = 0;
    currentQuiz.score = 0;
    currentQuiz.incorrect = 0;
    currentQuiz.skipped = 0;

    try {
        if (category === 'vocabulary') {
            await loadVocabularyQuestions();
        } else if (category === 'kanji') {
            await loadKanjiQuestions();
        } else if (category === 'kana') {
            await loadKanaQuestions();
        } else {
            console.warn(`Unsupported quiz category: ${category}`);
            return;
        }

        // once all questions have been built, shuffle them so the order is unpredictable
        if (currentQuiz.questions.length > 1) {
            currentQuiz.questions.sort(() => Math.random() - 0.5);
        }

        // trim to maximum number of questions
        if (currentQuiz.questions.length > MAX_QUESTIONS) {
            currentQuiz.questions = currentQuiz.questions.slice(0, MAX_QUESTIONS);
        }

        document.getElementById('quiz-menu').classList.remove('active');
        document.getElementById('quiz-content').classList.add('active');
        showQuestion();
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert('Error loading quiz data');
    }
}

async function loadVocabularyQuestions() {
    try {
        const resp = await fetch('http://localhost:3000/api/vocabulary');
        const categories = await resp.json();
        
        // gather all vocab items across every category
        let allItems = [];
        for (const cat of categories) {
            const items = await (await fetch(`http://localhost:3000/api/vocabulary/${cat.id}`)).json();
            if (Array.isArray(items)) {
                allItems = allItems.concat(items);
            }
        }

        // cannot build meaningful questions if fewer than 4 words total
        if (allItems.length < 4) {
            console.warn('Not enough vocabulary items to generate quiz');
            return;
        }

        // create one question per vocabulary entry, forcing that entry as the correct answer
        // Use English for generating the question structure, then store original items for language switching
        const transformed = allItems.map(i => ({ jp: i.jp, en: i.en }));
        transformed.forEach((item, idx) => {
            const question = generateQuizQuestion(transformed, item);
            // original item needed for romaji context and language switching
            const orig = allItems[idx];
            // Map the answer options back to original items to get both en and tm
            const answerItems = question.options.map(enAnswer => 
                allItems.find(origItem => origItem.en === enAnswer) || { en: enAnswer, tm: enAnswer }
            );
            
            currentQuiz.questions.push({
                question: question.japanese,
                questionType: 'jp',
                correctIndex: question.correctIndex,
                answerItems: answerItems,
                context: orig.romaji,
                originalItem: orig
            });
        });

        // randomize order of questions for extra variability
        currentQuiz.questions.sort(() => Math.random() - 0.5);
    } catch (error) {
        console.error('Error loading vocabulary:', error);
    }
}

async function loadKanjiQuestions() {
    try {
        const resp = await fetch('http://localhost:3000/api/kanji');
        const data = await resp.json();
        const allKanji = [...(data.n5 || []), ...(data.n4 || [])];
        
        // Transform kanji data to use 'jp' and 'en' properties for generateQuizQuestion
        const transformedKanji = allKanji.map(k => ({
            jp: k.char,
            en: k.meaning,
            onyomi: k.onyomi
        }));
        
        if (transformedKanji.length >= 4) {
            // limit number of kanji questions to 15, but ensure each is based on the loop item
            transformedKanji.slice(0, 15).forEach((kanji) => {
                const question = generateQuizQuestion(transformedKanji, kanji);
                currentQuiz.questions.push({
                    question: question.japanese,
                    questionType: 'kanji',
                    correct: question.meaning,
                    answers: question.options,
                    correctIndex: question.correctIndex,
                    context: kanji.onyomi
                });
            });
        }
    } catch (error) {
        console.error('Error loading kanji:', error);
    }
}

async function loadGrammarQuestions() {
    try {
        const resp = await fetch('http://localhost:3000/api/grammar');
        const grammars = await resp.json();
        
        // Need at least 4 grammar items to create meaningful questions
        if (grammars.length < 4) {
            console.warn('Not enough grammar items to generate quiz');
            return;
        }

        // Transform grammar items to use 'jp' (title) and 'en' (formula) for generateQuizQuestion
        const transformedGrammar = grammars.map(g => ({
            jp: g.title,
            en: g.formula
        }));

        // Create one question per grammar item, using that item as the correct answer
        transformedGrammar.slice(0, 15).forEach((gramItem) => {
            const question = generateQuizQuestion(transformedGrammar, gramItem);
            // Find original grammar item for context
            const origGram = grammars.find(g => g.title === gramItem.jp);
            
            currentQuiz.questions.push({
                question: question.japanese,
                questionType: 'text',
                correct: question.meaning,
                answers: question.options,
                correctIndex: question.correctIndex,
                context: origGram?.description || ''
            });
        });
    } catch (error) {
        console.error('Error loading grammar:', error);
    }
}

async function loadKanaQuestions() {
    try {
        const resp = await fetch('http://localhost:3000/api/kana');
        const data = await resp.json();
        const allKana = [...data.hiragana, ...data.katakana];
        
        // Transform kana data to use 'jp' and 'en' properties for generateQuizQuestion
        const transformedKana = allKana.map(k => ({
            jp: k.jp,
            en: k.romaji
        }));
        
        if (transformedKana.length >= 4) {
            transformedKana.slice(0, 20).forEach(kana => {
                const question = generateQuizQuestion(transformedKana, kana);
                currentQuiz.questions.push({
                    question: question.japanese,
                    questionType: 'kana',
                    correct: question.meaning,
                    answers: question.options,
                    correctIndex: question.correctIndex,
                    context: ''
                });
            });
        }
    } catch (error) {
        console.error('Error loading kana:', error);
    }
}

function showQuestion() {
    if (currentQuiz.currentIndex >= currentQuiz.questions.length) {
        showResults();
        return;
    }

    const q = currentQuiz.questions[currentQuiz.currentIndex];
    currentQuiz.selectedAnswer = null;

    const counterEl = document.getElementById('question-counter');
    const progressEl = document.getElementById('progress-fill');
    const questionEl = document.getElementById('quiz-question');
    const subtextEl = document.getElementById('quiz-subtext');
    const answersContainer = document.getElementById('quiz-answers');
    const skipBtn = document.getElementById('skip-btn');
    const submitBtn = document.getElementById('submit-btn');

    if (!counterEl || !progressEl || !questionEl || !subtextEl || !answersContainer) {
        console.error('Quiz elements not found');
        return;
    }

    counterEl.textContent = `${currentQuiz.currentIndex + 1}/${currentQuiz.questions.length}`;
    progressEl.style.width = `${(currentQuiz.currentIndex / currentQuiz.questions.length) * 100}%`;
    questionEl.textContent = q.question;
    subtextEl.textContent = q.context || '';

    answersContainer.innerHTML = '';

    // Get language-appropriate answers
    let displayAnswers;
    if (q.answerItems && q.questionType === 'jp') {
        // For vocabulary questions, use answerItems to get language-specific text
        displayAnswers = q.answerItems.map(item => 
            currentLang === 'tm' ? (item.tm || item.en) : (item.en || item.tm)
        );
    } else if (q.answers) {
        // For other question types, use stored answers
        displayAnswers = q.answers;
    } else {
        // Fallback
        displayAnswers = [];
    }

    displayAnswers.forEach((answer, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-answer';
        btn.textContent = answer;
        btn.dataset.index = idx;
        
        btn.addEventListener('click', function() {
            selectAnswer(this, idx);
        });
        
        answersContainer.appendChild(btn);
    });

    if (skipBtn) skipBtn.style.display = 'inline-block';
    if (submitBtn) submitBtn.classList.add('is-hidden');
}

function selectAnswer(btn, index) {
    document.querySelectorAll('.quiz-answer').forEach(b => {
        b.classList.remove('selected');
        // Remove checkmark from previously selected answer
        const checkmark = b.querySelector('.answer-checkmark');
        if (checkmark) checkmark.remove();
    });
    
    btn.classList.add('selected');
    
    // Add visible checkmark to selected answer
    const checkmarkSpan = document.createElement('span');
    checkmarkSpan.className = 'answer-checkmark';
    checkmarkSpan.textContent = ' ✓';
    btn.appendChild(checkmarkSpan);
    
    currentQuiz.selectedAnswer = index;
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.classList.remove('is-hidden');
}

function submitAnswer() {
    if (currentQuiz.selectedAnswer === null) return;

    const q = currentQuiz.questions[currentQuiz.currentIndex];
    if (!q) return;

    const isCorrect = currentQuiz.selectedAnswer === q.correctIndex;

    document.querySelectorAll('.quiz-answer').forEach((btn, idx) => {
        btn.classList.add('disabled');
        if (idx === q.correctIndex) {
            btn.classList.add('correct');
        } else if (idx === currentQuiz.selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    if (isCorrect) {
        currentQuiz.score++;
    } else {
        currentQuiz.incorrect++;
    }

    const skipBtn = document.getElementById('skip-btn');
    const submitBtn = document.getElementById('submit-btn');
    if (skipBtn) skipBtn.style.display = 'none';
    if (submitBtn) {
        submitBtn.textContent = 'Next';
        submitBtn.onclick = nextQuestion;
    }
}

function skipQuestion() {
    currentQuiz.skipped++;
    nextQuestion();
}

function nextQuestion() {
    currentQuiz.currentIndex++;
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.textContent = 'Submit';
        submitBtn.onclick = submitAnswer;
    }
    showQuestion();
}

function showResults() {
    const total = currentQuiz.questions.length;
    if (total === 0) {
        console.error('No questions in quiz');
        return;
    }

    const percentage = Math.round((currentQuiz.score / total) * 100);

    const contentEl = document.getElementById('quiz-content');
    const resultsEl = document.getElementById('quiz-results');
    if (contentEl) contentEl.classList.remove('active');
    if (resultsEl) resultsEl.classList.add('active');

    const scoreEl = document.getElementById('final-score');
    const scoreSummaryEl = document.getElementById('score-summary');
    const correctEl = document.getElementById('correct-count');
    const incorrectEl = document.getElementById('incorrect-count');
    const skippedEl = document.getElementById('skipped-count');

    if (scoreEl) scoreEl.textContent = `${percentage}%`;
    if (scoreSummaryEl) scoreSummaryEl.textContent = `${currentQuiz.score}/${total}`;
    if (correctEl) correctEl.textContent = currentQuiz.score;
    if (incorrectEl) incorrectEl.textContent = currentQuiz.incorrect;
    if (skippedEl) skippedEl.textContent = currentQuiz.skipped;

    loadResultsProfile();
    updateUIText();
}

function retakeQuiz() {
    const resultsEl = document.getElementById('quiz-results');
    if (resultsEl) resultsEl.classList.remove('active');
    startQuiz(currentQuiz.type);
}

function selectCategory() {
    const resultsEl = document.getElementById('quiz-results');
    const menuEl = document.getElementById('quiz-menu');
    if (resultsEl) resultsEl.classList.remove('active');
    if (menuEl) menuEl.classList.add('active');
}

function exitQuiz() {
    currentQuiz.questions = [];
    const contentEl = document.getElementById('quiz-content');
    const menuEl = document.getElementById('quiz-menu');
    if (contentEl) contentEl.classList.remove('active');
    if (menuEl) menuEl.classList.add('active');
}

function updateUIText() {
    if (currentLang === 'tm') {
        document.getElementById('quiz-title').textContent = 'Sözlük Synagy'; 
        document.getElementById('quiz-subtitle').textContent = 'Bilimiňizi barlaň we ösüşiňize gözegçilik ediň.';
        document.getElementById('select-category').textContent = 'Kategoriýany saýlaň';
        document.getElementById('correct-label').textContent = 'Dogry:';
        document.getElementById('incorrect-label').textContent = 'Ýalňyş:';
        document.getElementById('skipped-label').textContent = 'Geçilen:';
        document.getElementById('score-label').textContent = 'Bal:';
        document.getElementById('results-title').textContent = 'Synag Tamamlandy!';
    } else {
        // Updated to match your "Flash Quiz" branding
        document.getElementById('quiz-title').textContent = 'Flash Quiz';
        document.getElementById('quiz-subtitle').textContent = 'Challenge your knowledge and track your results.';
        document.getElementById('select-category').textContent = 'Select a Category';
        document.getElementById('correct-label').textContent = 'Correct:';
        document.getElementById('incorrect-label').textContent = 'Incorrect:';
        document.getElementById('skipped-label').textContent = 'Skipped:';
        document.getElementById('score-label').textContent = 'Score:';
        document.getElementById('results-title').textContent = 'Quiz Complete!';
    }
    
    // Refresh current question answers if quiz is active
    if (document.getElementById('quiz-content')?.classList.contains('active')) {
        refreshQuestionDisplay();
    }
}

// Refresh the current question display (useful for language switching)
function refreshQuestionDisplay() {
    if (currentQuiz.currentIndex >= currentQuiz.questions.length) {
        return;
    }

    const q = currentQuiz.questions[currentQuiz.currentIndex];
    const answersContainer = document.getElementById('quiz-answers');
    
    if (!answersContainer) return;
    
    answersContainer.innerHTML = '';

    // Get language-appropriate answers
    let displayAnswers;
    if (q.answerItems && q.questionType === 'jp') {
        // For vocabulary questions, use answerItems to get language-specific text
        displayAnswers = q.answerItems.map(item => 
            currentLang === 'tm' ? (item.tm || item.en) : (item.en || item.tm)
        );
    } else if (q.answers) {
        // For other question types, use stored answers
        displayAnswers = q.answers;
    } else {
        // Fallback
        displayAnswers = [];
    }

    displayAnswers.forEach((answer, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-answer';
        btn.textContent = answer;
        btn.dataset.index = idx;
        
        // Re-apply selected state if this was the selected answer
        if (currentQuiz.selectedAnswer === idx) {
            btn.classList.add('selected');
        }
        
        // Re-apply disabled/correct/incorrect states if quiz was already submitted
        const skipBtn = document.getElementById('skip-btn');
        if (skipBtn && skipBtn.style.display === 'none') {
            btn.classList.add('disabled');
            if (idx === q.correctIndex) {
                btn.classList.add('correct');
            } else if (idx === currentQuiz.selectedAnswer && currentQuiz.selectedAnswer !== q.correctIndex) {
                btn.classList.add('incorrect');
            }
        }
        
        btn.addEventListener('click', function() {
            selectAnswer(this, idx);
        });
        
        answersContainer.appendChild(btn);
    });
}
    


// Initial UI update
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme on page load
    initializePageTheme();
    updateUIText();
});
