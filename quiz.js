let currentQuiz = {
    type: null,
    questions: [],
    currentIndex: 0,
    score: 0,
    incorrect: 0,
    skipped: 0,
    selectedAnswer: null
};

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
        } else if (category === 'grammar') {
            await loadGrammarQuestions();
        } else if (category === 'kana') {
            await loadKanaQuestions();
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
        const resp = await fetch('vocabulary.json');
        const categories = await resp.json();
        
        for (const cat of categories.slice(0, 3)) {
            const vocabResp = await fetch(`vocabs/${cat.id}.json`);
            const items = await vocabResp.json();
            
            items.forEach(item => {
                const allAnswers = items.map(i => i.en).sort(() => Math.random() - 0.5);
                currentQuiz.questions.push({
                    question: item.jp,
                    questionType: 'jp',
                    correct: item.en,
                    answers: allAnswers.slice(0, 4),
                    context: item.romaji
                });
            });
        }
    } catch (error) {
        console.error('Error loading vocabulary:', error);
    }
}

async function loadKanjiQuestions() {
    try {
        const resp = await fetch('kanji.json');
        const data = await resp.json();
        const allKanji = [...(data.n5 || []), ...(data.n4 || [])];
        
        allKanji.slice(0, 15).forEach(kanji => {
            const allAnswers = allKanji.map(k => k.meaning).sort(() => Math.random() - 0.5);
            currentQuiz.questions.push({
                question: kanji.char,
                questionType: 'kanji',
                correct: kanji.meaning,
                answers: allAnswers.slice(0, 4),
                context: kanji.onyomi
            });
        });
    } catch (error) {
        console.error('Error loading kanji:', error);
    }
}

async function loadGrammarQuestions() {
    try {
        const resp = await fetch('grammar.json');
        const grammars = await resp.json();
        
        grammars.forEach(gram => {
            const example = gram.examples ? gram.examples[0] : {};
            currentQuiz.questions.push({
                question: gram.title,
                questionType: 'text',
                correct: gram.formula,
                answers: [gram.formula, gram.formula + ' (wrong)', 'Alternative form', 'Different particle'],
                context: gram.description
            });
        });
    } catch (error) {
        console.error('Error loading grammar:', error);
    }
}

async function loadKanaQuestions() {
    try {
        const resp = await fetch('kana.json');
        const data = await resp.json();
        const allKana = [...data.hiragana, ...data.katakana];
        
        allKana.slice(0, 20).forEach(kana => {
            const allAnswers = allKana.map(k => k.romaji).sort(() => Math.random() - 0.5);
            currentQuiz.questions.push({
                question: kana.jp,
                questionType: 'kana',
                correct: kana.romaji,
                answers: allAnswers.slice(0, 4),
                context: ''
            });
        });
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

    document.getElementById('question-counter').textContent = `${currentQuiz.currentIndex + 1}/${currentQuiz.questions.length}`;
    document.getElementById('progress-fill').style.width = `${(currentQuiz.currentIndex / currentQuiz.questions.length) * 100}%`;
    document.getElementById('quiz-question').textContent = q.question;
    document.getElementById('quiz-subtext').textContent = q.context || '';

    const answersContainer = document.getElementById('quiz-answers');
    answersContainer.innerHTML = '';

    const shuffled = [...q.answers].sort(() => Math.random() - 0.5);
    shuffled.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'quiz-answer';
        btn.textContent = answer;
        btn.onclick = () => selectAnswer(btn, answer);
        answersContainer.appendChild(btn);
    });

    document.getElementById('skip-btn').style.display = 'inline-block';
    document.getElementById('submit-btn').style.display = 'none';
}

function selectAnswer(btn, answer) {
    document.querySelectorAll('.quiz-answer').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentQuiz.selectedAnswer = answer;
    document.getElementById('submit-btn').style.display = 'inline-block';
}

function submitAnswer() {
    if (currentQuiz.selectedAnswer === null) return;

    const q = currentQuiz.questions[currentQuiz.currentIndex];
    const isCorrect = currentQuiz.selectedAnswer === q.correct;

    document.querySelectorAll('.quiz-answer').forEach(btn => {
        btn.classList.add('disabled');
        if (btn.textContent === q.correct) {
            btn.classList.add('correct');
        } else if (btn.textContent === currentQuiz.selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    if (isCorrect) {
        currentQuiz.score++;
    } else {
        currentQuiz.incorrect++;
    }

    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('submit-btn').textContent = 'Next';
    document.getElementById('submit-btn').onclick = nextQuestion;
}

function skipQuestion() {
    currentQuiz.skipped++;
    nextQuestion();
}

function nextQuestion() {
    currentQuiz.currentIndex++;
    document.getElementById('submit-btn').textContent = 'Submit';
    document.getElementById('submit-btn').onclick = submitAnswer;
    showQuestion();
}

function showResults() {
    const total = currentQuiz.questions.length;
    const percentage = Math.round((currentQuiz.score / total) * 100);

    document.getElementById('quiz-content').classList.remove('active');
    document.getElementById('quiz-results').classList.add('active');

    document.getElementById('final-score').textContent = percentage + '%';
    document.getElementById('correct-count').textContent = currentQuiz.score;
    document.getElementById('incorrect-count').textContent = currentQuiz.incorrect;
    document.getElementById('skipped-count').textContent = currentQuiz.skipped;

    updateUIText();
}

function retakeQuiz() {
    document.getElementById('quiz-results').classList.remove('active');
    startQuiz(currentQuiz.type);
}

function selectCategory() {
    document.getElementById('quiz-results').classList.remove('active');
    document.getElementById('quiz-menu').classList.add('active');
}

function exitQuiz() {
    currentQuiz.questions = [];
    document.getElementById('quiz-content').classList.remove('active');
    document.getElementById('quiz-menu').classList.add('active');
}

function updateUIText() {
    if (currentLang === 'tm') {
        document.getElementById('quiz-title').textContent = 'Lesch Synosy';
        document.getElementById('quiz-subtitle').textContent = 'Yjy biliniňizi synap, ylalaňyzy yzarlamak.';
        document.getElementById('select-category').textContent = 'Kategoriýa sayla';
        document.getElementById('correct-label').textContent = 'Dogry:';
        document.getElementById('incorrect-label').textContent = 'Ýalňyş:';
        document.getElementById('skipped-label').textContent = 'Atlanylan:';
        document.getElementById('results-title').textContent = 'Lesch Tamamlanydy!';
    } else {
        document.getElementById('quiz-title').textContent = 'Flash Quiz';
        document.getElementById('quiz-subtitle').textContent = 'Test your knowledge and track your progress.';
        document.getElementById('select-category').textContent = 'Select a Category';
        document.getElementById('correct-label').textContent = 'Correct:';
        document.getElementById('incorrect-label').textContent = 'Incorrect:';
        document.getElementById('skipped-label').textContent = 'Skipped:';
        document.getElementById('results-title').textContent = 'Quiz Complete!';
    }
}

// Initial UI update
document.addEventListener('DOMContentLoaded', updateUIText);
