// DOM要素の参照
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    startScreen: document.getElementById('start-screen'),
    modeSelectionScreen: document.getElementById('mode-selection-screen'),
    gameScreen: document.getElementById('game-screen'),
    testScreen: document.getElementById('test-screen'),
    resultScreen: document.getElementById('result-screen'),
    historyScreen: document.getElementById('history-screen'),

    // Start Screen
    contentSelect: document.getElementById('content-select'),
    labelSelectionContainer: document.getElementById('label-selection-container'),
    selectAllLabelsBtn: document.getElementById('select-all-labels'),
    deselectAllLabelsBtn: document.getElementById('deselect-all-labels'),
    filterAll: document.getElementById('filter-all'),
    filterUnseen: document.getElementById('filter-unseen'),
    filterMistakes: document.getElementById('filter-mistakes'),
    filterCustom: document.getElementById('filter-custom'),
    customFilterPanel: document.getElementById('custom-filter-panel'),
    incorrectCountFilter: document.getElementById('incorrect-count-filter'),
    accuracyRangeFilterMin: document.getElementById('accuracy-range-filter-min'),
    accuracyRangeFilterMax: document.getElementById('accuracy-range-filter-max'),
    showModeSelectionBtn: document.getElementById('show-mode-selection-btn'),
    startMeaningChoiceTestBtn: document.getElementById('start-meaning-choice-test-btn'),
    startSpellingTestBtn: document.getElementById('start-spelling-test-btn'),
    historyButton: document.getElementById('history-button'),
    exportDataButton: document.getElementById('export-data-button'),
    importDataButton: document.getElementById('import-data-button'),
    importFileInput: document.getElementById('import-file-input'),
    clearDataButton: document.getElementById('clear-data-button'),

    // Mode Selection Screen
    startWordTypingAudioBtn: document.getElementById('start-word-typing-audio-btn'),
    startWordTypingNoAudioBtn: document.getElementById('start-word-typing-no-audio-btn'),
    startMeaningTypingAudioBtn: document.getElementById('start-meaning-typing-audio-btn'),
    startMeaningTypingNoAudioBtn: document.getElementById('start-meaning-typing-no-audio-btn'),
    startWordToMeaningAudioBtn: document.getElementById('start-word-to-meaning-audio-btn'),
    startWordToMeaningNoAudioBtn: document.getElementById('start-word-to-meaning-no-audio-btn'),
    modeBackButton: document.getElementById('mode-back-button'),

    // Game Screen
    scoreDisplay: document.getElementById('score'),
    comboDisplay: document.getElementById('combo-display'),
    missCountDisplay: document.getElementById('miss-count'),
    timerDisplay: document.getElementById('timer'),
    wordDisplay: document.getElementById('word-display'),
    inputDisplayContainer: document.getElementById('input-display-container'),
    inputDisplay: document.getElementById('input-display'),
    typingInput: document.getElementById('typing-input'),
    meaningDisplay: document.getElementById('meaning-display'),

    // Test Screen
    testWordDisplay: document.getElementById('test-word-display'),
    multipleChoiceContainer: document.getElementById('multiple-choice-container'),
    testChoiceButtons: document.querySelectorAll('.test-choice-button'),
    typingTestContainer: document.getElementById('typing-test-container'),
    testInputDisplayContainer: document.getElementById('test-input-display-container'),
    testInputDisplay: document.getElementById('test-input-display'),
    testTypingInput: document.getElementById('test-typing-input'),
    testSubmitButton: document.getElementById('test-submit-button'),
    testMeaningDisplay: document.getElementById('test-meaning-display'),
    testFinishButton: document.getElementById('test-finish-button'),
    testBackButton: document.getElementById('test-back-button'),

    // Accordion elements
    labelAccordionHeader: document.querySelector('.label-accordion-header'),
    labelAccordionContent: document.querySelector('.label-accordion-content'),
    accordionIcon: document.querySelector('.accordion-icon'),

    // Result Screen
    resultScore: document.getElementById('result-score'),
    resultKPM: document.getElementById('result-kpm'),
    resultWPM: document.getElementById('result-wpm'),
    resultAccuracy: document.getElementById('result-accuracy'),
    resultMaxCombo: document.getElementById('result-max-combo'),
    resultMiss: document.getElementById('result-miss'),
    resultDifficultyBreakdown: document.getElementById('result-difficulty-breakdown'),
    restartButton: document.getElementById('restart-button'),
    backToTopButton: document.getElementById('back-to-top-button'),

    // History Screen
    showRecentBtn: document.getElementById('show-recent-btn'),
    showDailyBtn: document.getElementById('show-daily-btn'),
    showBestsBtn: document.getElementById('show-bests-btn'),
    showLabelStatsBtn: document.getElementById('show-label-stats-btn'),
    modeFilterContainer: document.querySelector('#history-screen .mode-filter-container'),
    filterAllModes: document.getElementById('filter-all-modes'),
    filterTypingMode: document.getElementById('filter-typing-mode'),
    filterSpellingMode: document.getElementById('filter-spelling-mode'),
    filterMeaningMode: document.getElementById('filter-meaning-mode'),
    modeFilterContainer: document.querySelector('.mode-filter-container'),
    historyChartCanvas: document.getElementById('history-chart'),
    historyTableContainer: document.getElementById('history-table-container'),
    personalBestsContainer: document.getElementById('personal-bests-container'),
    historyBackButton: document.getElementById('history-back-button'),

    bgmPlayer: document.getElementById('bgm-player')
};

// ゲームの状態
const state = {
    gameMode: null, // 'practice_word_typing_audio', 'practice_word_typing_no_audio', 'practice_meaning_recall_audio', 'practice_meaning_recall_no_audio', 'test_meaning_choice', 'test_spelling'
    currentCourse: null,
    currentWords: [], // 現在のゲームで使用する単語リスト
    currentWordIndex: 0,
    currentWord: null,
    currentInput: '',
    score: 0,
    combo: 0,
    maxCombo: 0,
    missCount: 0,
    timer: 0,
    intervalId: null,
    startTime: null,
    totalTypedChars: 0,
    correctTypedChars: 0,
    incorrectTypedChars: 0,
    phase: 'typing', // 'typing' or 'meaning_quiz' for word-to-meaning-typing mode
    meaningQuizActive: false, // 新しいモー��で意味クイズがアクティブかどうか
    testWords: [], // テストモード用の単語リスト
    testCurrentIndex: 0,
    testCorrectCount: 0,
    testIncorrectCount: 0,
    testStartTime: null,
    testEndTime: null,
    testMode: null, // 'meaning_choice' or 'spelling'
    history: [], // 直近のプレイ履歴
    dailyStats: {}, // 日ごとの統計
    wordStats: {}, // 単語ごとの正誤記録
    labelStats: {}, // ラベルごとの正誤記録
    personalBests: {}, // 自己ベスト
    selectedLabels: new Set(), // 選択されたラベル
    filterType: 'all', // 'all', 'unseen', 'mistakes', 'custom'
    customFilter: { incorrectCount: 0, accuracyMin: 0, accuracyMax: 100 },
    isBgmPlaying: false // BGMが再生中かどうかを追跡する新しい状態変数
};

let allWordsData = {}; // 全ての単語データ
let courseLabels = {}; // コースごとのラベル
let historyChart;

// =================================================================
// 関数定義
// =================================================================

// --- ユーティリティ ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 文字列が日本語のひらがなまたはカタカナを含むかを判定する関数
function containsJapaneseCharacters(text) {
    if (!text) return false;
    // ひらがな、カタカナのUnicode範囲をチェック
    return /[぀-ゟ゠-ヿ]/.test(text);
}

// 電子音を生成する関数
function createBeep(frequency, duration, volume) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

// アニメーションをトリガーするヘルパー関数
function triggerAnimation(element, className) {
    element.classList.remove(className); // アニメーションを再トリガーするために一度削除
    void element.offsetWidth; // リフローを強制
    element.classList.add(className);
    element.addEventListener('animationend', () => {
        element.classList.remove(className);
    }, { once: true });
}

function playSound(type) {
    switch (type) {
        case 'correct':
            createBeep(880, 0.1, 0.5); // 高い音で短いビープ
            break;
        case 'incorrect':
            createBeep(220, 0.2, 0.5); // 低い音で少し長いビープ
            break;
        case 'finish':
            // 終了音は特に指定がなければ再生しない、または別の音を割り当てる
            return; 
        case 'combo':
            // コンボ音も同様
            return;
        case 'key':
            createBeep(440, 0.05, 0.1); // 控えめなタイプ音
            break;
        default:
            return;
    }
}

function playWordAudio(word) {
    if (!word || !word.audio) {
        console.warn("Word audio not available for:", word);
        createBeep(660, 0.1, 0.3); // 単語音声がない場合の代替電子音
        return;
    }
    const audio = new Audio(word.audio);
    audio.play().catch(e => {
        console.error("Word audio play failed:", e);
        createBeep(660, 0.1, 0.3); // 音声ファイルの再生に失敗した場合の代替電子音
    });
}

function startRandomBGM() {
    if (state.isBgmPlaying) return;
    const bgmFiles = ['bgm/h.mp3', 'bgm/ゲームの旅路.mp3'];
    const selectedBGM = bgmFiles[Math.floor(Math.random() * bgmFiles.length)];
    if (elements.bgmPlayer) {
        elements.bgmPlayer.src = selectedBGM;
        elements.bgmPlayer.loop = true;
        elements.bgmPlayer.play().then(() => {
            state.isBgmPlaying = true;
        }).catch(e => console.error("BGM play failed:", e));
    }
}

function stopBGM() {
    if (elements.bgmPlayer && state.isBgmPlaying) {
        elements.bgmPlayer.pause();
        elements.bgmPlayer.currentTime = 0;
        state.isBgmPlaying = false;
    }
}

function showScreen(screenElement) {
    const screens = [
        elements.loadingScreen, elements.startScreen, elements.modeSelectionScreen,
        elements.gameScreen, elements.testScreen, elements.resultScreen, elements.historyScreen
    ];
    screens.forEach(screen => {
        screen.classList.toggle('active', screen === screenElement);
    });
}

// --- データ管理 ---
async function loadWordsData() {
    showScreen(elements.loadingScreen);
    try {
        const response = await fetch('words.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allWordsData = await response.json();

        for (const courseName in allWordsData) {
            let courseContainsJapanese = false;
            for (const word of allWordsData[courseName]) {
                // Normalize word.label to word.labels array
                if (word.label) {
                    if (Array.isArray(word.label)) {
                        word.labels = word.label; // Already an array, just assign
                    } else {
                        word.labels = [word.label]; // Convert string to array
                    }
                    delete word.label; // Remove the old singular 'label' property
                } else if (!word.labels) {
                    word.labels = []; // Ensure labels property always exists as an array
                }

                if (containsJapaneseCharacters(word.word)) {
                    courseContainsJapanese = true;
                    break;
                }
            }
            // Add a property to the course object indicating if it allows non-Japanese typing
            // By default, allow non-Japanese typing. If Japanese characters are found, disable it.
            allWordsData[courseName].allowNonJapaneseTyping = !courseContainsJapanese;
        }

        populateCourseSelect();
        loadUserData();
        loadSettings(); // Load settings after user data and course population
        showScreen(elements.startScreen);
    } catch (error) {
        console.error('Failed to load words.json:', error);
        elements.loadingScreen.innerHTML = '<p style="color: red;">データの読み込みに失敗しました。ページをリロードしてください。</p>';
    }
}

function populateCourseSelect() {
    elements.contentSelect.innerHTML = '';
    courseLabels = {};
    for (const courseName in allWordsData) {
        const option = document.createElement('option');
        option.value = courseName;
        option.textContent = courseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        elements.contentSelect.appendChild(option);
        const labels = new Set();
        allWordsData[courseName].forEach(word => {
            // Prioritize word.labels (array) if it exists and is an array
            if (word.labels && Array.isArray(word.labels)) {
                word.labels.forEach(label => labels.add(label));
            } else if (word.label) { // Fallback to word.label (singular) if labels array not found
                if (Array.isArray(word.label)) {
                    word.label.forEach(label => labels.add(label));
                } else {
                    labels.add(word.label);
                }
            }
        });
        courseLabels[courseName] = Array.from(labels).sort();
    }
    console.log("Populated courseLabels:", courseLabels); // Debug log
    if (elements.contentSelect.options.length > 0) {
        // Removed default selection and label population from here.
        // This will now be handled by loadSettings.
    }
}

function populateLabelSelection(courseName) {
    elements.labelSelectionContainer.innerHTML = '';
    // state.selectedLabels.clear(); // REMOVED: Do not clear here, it should be managed by loadSettings or user interaction
    const labels = courseLabels[courseName] || [];
    labels.forEach(label => {
        const div = document.createElement('div');
        div.className = 'label-checkbox-item';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `label-${label}`;
        input.value = label;
        input.checked = state.selectedLabels.has(label); // Set checked based on loaded state
        input.addEventListener('change', updateSelectedLabels);
        const labelElement = document.createElement('label');
        labelElement.htmlFor = `label-${label}`;
        labelElement.textContent = label;
        div.appendChild(input);
        div.appendChild(labelElement);
        elements.labelSelectionContainer.appendChild(div);
        // state.selectedLabels.add(label); // REMOVED: Do not add all labels here
    });
}

function updateSelectedLabels() {
    state.selectedLabels.clear();
    elements.labelSelectionContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        state.selectedLabels.add(checkbox.value);
    });
    saveSettings();
}

function loadUserData() {
    try {
        const savedHistory = localStorage.getItem('typingComboHistory');
        if (savedHistory) state.history = JSON.parse(savedHistory);
        
        const savedDailyStats = localStorage.getItem('typingComboDailyStats');
        if (savedDailyStats) state.dailyStats = JSON.parse(savedDailyStats);

        const savedWordStats = localStorage.getItem('typingComboWordStats');
        if (savedWordStats) state.wordStats = JSON.parse(savedWordStats);

        const savedLabelStats = localStorage.getItem('typingComboLabelStats');
        if (savedLabelStats) state.labelStats = JSON.parse(savedLabelStats);

        const savedBests = localStorage.getItem('typingComboPersonalBests');
        if (savedBests) state.personalBests = JSON.parse(savedBests);

    } catch (e) {
        console.error("Failed to load user data from localStorage", e);
        state.history = [];
        state.dailyStats = {};
        state.wordStats = {};
        state.labelStats = {};
        state.personalBests = {};
    }
}

function saveUserData() {
    try {
        localStorage.setItem('typingComboHistory', JSON.stringify(state.history));
        localStorage.setItem('typingComboDailyStats', JSON.stringify(state.dailyStats));
        localStorage.setItem('typingComboWordStats', JSON.stringify(state.wordStats));
        localStorage.setItem('typingComboLabelStats', JSON.stringify(state.labelStats));
        localStorage.setItem('typingComboPersonalBests', JSON.stringify(state.personalBests));
        saveSettings(); // Add this line to save settings as well
    } catch (e) {
        console.error("Failed to save user data to localStorage", e);
    }
}

function saveSettings() {
    try {
        const settings = {
            currentCourse: state.currentCourse,
            selectedLabels: Array.from(state.selectedLabels),
            filterType: state.filterType,
            customFilter: state.customFilter
        };
        localStorage.setItem('typingComboSettings', JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save settings to localStorage", e);
    }
}

function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('typingComboSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            state.currentCourse = settings.currentCourse || elements.contentSelect.options[0].value;
            state.selectedLabels = new Set(settings.selectedLabels || []);
            state.filterType = settings.filterType || 'all';
            state.customFilter = settings.customFilter || { incorrectCount: 0, accuracyMin: 0, accuracyMax: 100 };

            // If no labels were saved, or the saved list is empty, select all labels for the current course
            if (!settings.selectedLabels || settings.selectedLabels.length === 0) {
                const currentCourseLabels = courseLabels[state.currentCourse] || [];
                currentCourseLabels.forEach(label => state.selectedLabels.add(label));
            }

            // Apply loaded settings to UI
            elements.contentSelect.value = state.currentCourse;
            populateLabelSelection(state.currentCourse); // Re-populate labels based on loaded course

            // Update filter radio buttons
            document.querySelectorAll('input[name="filter-type"]').forEach(radio => {
                radio.checked = (radio.value === state.filterType);
            });
            elements.customFilterPanel.style.display = (state.filterType === 'custom') ? 'flex' : 'none';

            // Ensure the correct radio button is checked if filterType is 'correct'
            if (state.filterType === 'correct') {
                document.getElementById('filter-correct').checked = true;
            }

            // Update custom filter inputs
            elements.incorrectCountFilter.value = state.customFilter.incorrectCount;
            elements.accuracyRangeFilterMin.value = state.customFilter.accuracyMin;
            elements.accuracyRangeFilterMax.value = state.customFilter.accuracyMax;
        } else {
            // If no settings are saved at all, set initial defaults and select all labels
            state.currentCourse = elements.contentSelect.options[0].value;
            state.filterType = 'all';
            state.customFilter = { incorrectCount: 0, accuracyMin: 0, accuracyMax: 100 };
            
            // Select all labels for the default course
            const defaultCourseLabels = courseLabels[state.currentCourse] || [];
            state.selectedLabels = new Set(); // Initialize as empty set before adding all
            defaultCourseLabels.forEach(label => state.selectedLabels.add(label));

            // Apply initial defaults to UI
            elements.contentSelect.value = state.currentCourse;
            populateLabelSelection(state.currentCourse);
            document.getElementById('filter-all').checked = true; // Ensure 'all' filter is checked
            elements.customFilterPanel.style.display = 'none';
            elements.incorrectCountFilter.value = state.customFilter.incorrectCount;
            elements.accuracyRangeFilterMin.value = state.customFilter.accuracyMin;
            elements.accuracyRangeFilterMax.value = state.customFilter.accuracyMax;
        }
    } catch (e) {
        console.error("Failed to load settings from localStorage", e);
    }
}

// --- ゲームロジック ---
function startGame(mode) {
    startRandomBGM(); // ゲーム開始時にBGMを再生
    state.gameMode = mode;
    state.currentCourse = elements.contentSelect.value;

    const selectedCourseData = allWordsData[state.currentCourse];

    // Check if the selected course allows non-Japanese typing for practice modes
    if (!selectedCourseData.allowNonJapaneseTyping && mode.startsWith('practice_')) {
        alert('このコースには日本語が含まれているため、タイピング練習モードは無効です。単語テストモードをご利用ください。');
        showScreen(elements.startScreen);
        return;
    }

    let filteredWords = selectedCourseData || [];
    if (state.selectedLabels.size > 0) {
        filteredWords = filteredWords.filter(word => word.labels && word.labels.some(label => state.selectedLabels.has(label)));
    }
    switch (state.filterType) {
        case 'unseen':
            filteredWords = filteredWords.filter(word => {
                const stats = state.wordStats[word.word];
                if (state.gameMode.startsWith('practice_')) { // Typing modes
                    return !stats || (stats.spellingTestCorrect === 0 && stats.spellingTestIncorrect === 0);
                } else { // Test modes
                    return !stats || (stats.correct === 0 && stats.incorrect === 0);
                }
            });
            break;
        case 'mistakes':
            filteredWords = filteredWords.filter(word => {
                const stats = state.wordStats[word.word];
                if (!stats) return false;
                if (state.gameMode.startsWith('practice_')) { // Typing modes
                    return stats.spellingTestIncorrect > 0; // Once incorrect in spelling test
                } else { // Test modes
                    return stats.incorrect > 0; // Once incorrect in any test/practice
                }
            });
            break;
        case 'custom':
            filteredWords = filteredWords.filter(word => {
                const stats = state.wordStats[word.word];
                if (!stats) return false;
                let correctCount, incorrectCount;
                if (state.gameMode.startsWith('practice_')) { // Typing modes
                    correctCount = stats.spellingTestCorrect;
                    incorrectCount = stats.spellingTestIncorrect;
                } else { // Test modes
                    correctCount = stats.correct;
                    incorrectCount = stats.incorrect;
                }
                const totalAttempts = correctCount + incorrectCount;
                const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 100;
                const incorrectCountMatch = incorrectCount >= state.customFilter.incorrectCount;
                const accuracyMatch = accuracy >= state.customFilter.accuracyMin && accuracy <= state.customFilter.accuracyMax;
                return incorrectCountMatch && accuracyMatch;
            });
            break;
        case 'correct':
            filteredWords = filteredWords.filter(word => {
                const stats = state.wordStats[word.word];
                if (!stats) return false;
                if (state.gameMode.startsWith('practice_')) { // Typing modes
                    return stats.spellingTestCorrect > 0;
                } else { // Test modes
                    return stats.correct > 0;
                }
            });
            break;
    }
    state.currentWords = shuffleArray(filteredWords);
    if (state.currentWords.length === 0) {
        alert('選択された条件に合う単語がありません。フィルター設定を確認してください。');
        showScreen(elements.startScreen);
        return;
    }
    Object.assign(state, {
        currentWordIndex: 0, score: 0, combo: 0, maxCombo: 0, missCount: 0,
        totalTypedChars: 0, correctTypedChars: 0, incorrectTypedChars: 0,
        startTime: Date.now(), difficultyStats: {}
    });
    showScreen(elements.gameScreen);
    elements.typingInput.value = '';
    elements.typingInput.focus();
    nextWord();
    startTimer();
    updateDisplay();
}

function nextWord() {
    state.currentWordIndex++;
    if (state.currentWordIndex >= state.currentWords.length) {
        endGame();
        return;
    }
    state.currentWord = state.currentWords[state.currentWordIndex];
    state.currentInput = '';
    elements.typingInput.value = '';
    // 意味から語句タイピングモードの場合、単語のスペルを最初は表示しない
    if (state.gameMode === 'practice_meaning_recall_audio' || state.gameMode === 'practice_meaning_recall_no_audio') {
        elements.wordDisplay.textContent = ''; // 単語表示をクリア
        
    } else {
        elements.wordDisplay.textContent = state.currentWord.word;
        elements.inputDisplay.innerHTML = `<span class="untyped">${state.currentWord.word}</span>`;
    }
    elements.meaningDisplay.textContent = state.gameMode.includes('meaning') ? state.currentWord.meaning : '';
    if (state.gameMode.includes('audio')) playWordAudio(state.currentWord);
}

function endGame() {
    clearInterval(state.intervalId);
    playSound('finish');
    stopBGM(); // Stop BGM when game ends
    const duration = (Date.now() - state.startTime) / 1000 / 60;
    const kpm = duration > 0 ? Math.round(state.correctTypedChars / duration) : 0;
    const wpm = kpm / 5;
    const accuracy = state.totalTypedChars > 0 ? (state.correctTypedChars / state.totalTypedChars) * 100 : 0;
    elements.resultScore.textContent = state.score;
    elements.resultKPM.textContent = kpm;
    elements.resultWPM.textContent = wpm.toFixed(2);
    elements.resultAccuracy.textContent = `${accuracy.toFixed(2)}%`;
    elements.resultMaxCombo.textContent = state.maxCombo;
    elements.resultMiss.textContent = state.missCount;
    
    // ラベル別成績の表示ロジックは履歴画面に移行するため、ここでは簡易表示または削除
    elements.resultDifficultyBreakdown.innerHTML = ''; // 結果画面ではシンプルに

    showScreen(elements.resultScreen);

    const resultData = {
        date: new Date().toISOString(), 
        mode: 'practice_typing', // タイピングモードを統一
        course: state.currentCourse,
        score: state.score, 
        kpm, 
        wpm, 
        accuracy, 
        maxCombo: state.maxCombo, 
        missCount: state.missCount
    };
    state.history.push(resultData);
    updatePersonalBests(resultData);
    saveUserData();
}

function handleTypingInput(event) {
    if (!state.currentWord) return;
    const currentWordText = state.currentWord.word; // The target English word

    const newInputValue = elements.typingInput.value;
    const oldInputLength = state.currentInput.length;

    // Handle backspace/deletion
    if (newInputValue.length < oldInputLength) {
        state.currentInput = newInputValue;
    } else if (newInputValue.length > oldInputLength) {
        // Handle new character input
        const newChar = newInputValue[newInputValue.length - 1]; // Get the last typed character
        const expectedChar = currentWordText[oldInputLength]; // Expected character at current position

        playSound('key'); // Play key sound for any new input
        state.totalTypedChars++; // 総入力文字数（キープレスごと）

        if (newChar === expectedChar) {
            state.currentInput = newInputValue; // Accept the character
            state.correctTypedChars++; // 正しく入力された文字数をカウント
            state.combo++; // コンボをインクリメント
            if (state.combo > state.maxCombo) state.maxCombo = state.combo;

            // コンボアニメーション
            triggerAnimation(elements.comboDisplay, 'combo-animate');

            // タイムボーナスロジック
            if (state.combo > 0 && state.combo % 20 === 0) {
                let bonusSeconds = 0;
                if (state.combo === 20) {
                    bonusSeconds = 1;
                } else if (state.combo === 40) {
                    bonusSeconds = 2;
                } else if (state.combo >= 60 && state.combo % 20 === 0) {
                    bonusSeconds = 3;
                }
                if (bonusSeconds > 0) {
                    state.timer = Math.max(0, state.timer + bonusSeconds); // ボーナス秒数を加算
                    triggerAnimation(elements.timerDisplay, 'timer-bonus-animate'); // タイマーアニメーションをトリガー
                }
            }

            if (state.combo > 0 && state.combo % 10 === 0) playSound('combo'); // 既存のコンボ音
        } else {
            // Incorrect character typed
            playSound('incorrect');
            state.missCount++; // ミス数をインクリメント
            state.combo = 0; // コンボをリセット

            // Revert input field to the last correct state
            elements.typingInput.value = state.currentInput; // 間違った文字を反映させない
        }
    }

    // Update display based on current state.currentInput
    let wordDisplayHtml = ''; // For wordDisplay
    let isDisplayIncorrect = false; // For visual highlighting

    for (let i = 0; i < currentWordText.length; i++) {
        const char = currentWordText[i];
        
        // For meaning-to-word typing, reveal characters in wordDisplay
        if (state.gameMode === 'practice_meaning_recall_audio' || state.gameMode === 'practice_meaning_recall_no_audio') {
            if (i < state.currentInput.length && state.currentInput[i] === char) {
                wordDisplayHtml += `<span class="revealed-char">${char}</span>`;
            } else {
                wordDisplayHtml += `<span class="hidden-char">_</span>`; // Use underscore for hidden chars
            }
        }
    }

    // Update wordDisplay for meaning-to-word typing modes
    if (state.gameMode === 'practice_meaning_recall_audio' || state.gameMode === 'practice_meaning_recall_no_audio') {
        elements.wordDisplay.innerHTML = wordDisplayHtml;
        // 意味から語句タイピングモードではinputDisplayを更新しない
        elements.inputDisplay.innerHTML = ''; // Clear input display for this mode
    } else {
        // Other modes still show the full word and input feedback
        let displayHtml = '';
        let isDisplayIncorrectForOtherModes = false;
        for (let i = 0; i < currentWordText.length; i++) {
            const char = currentWordText[i];
            let segmentClass = 'untyped';
            if (i < state.currentInput.length) {
                if (state.currentInput[i] === char && !isDisplayIncorrectForOtherModes) {
                    segmentClass = 'correct';
                } else {
                    segmentClass = 'incorrect';
                    isDisplayIncorrectForOtherModes = true;
                }
            }
            displayHtml += `<span class="${segmentClass}">${char}</span>`;
        }
        elements.inputDisplay.innerHTML = displayHtml;
    }

    // Check if word is completed correctly
    if (state.currentInput === currentWordText) {
        playSound('correct'); // Play correct sound for word completion
        state.score += 100 + state.combo * 10; // Score based on combo
        updateDisplay(); // Update score, combo, miss
        updateStats(state.currentWord, true); // Update stats for correct word

        // 単語正解アニメーション
        triggerAnimation(elements.wordDisplay, 'word-correct-animate');

        nextWord(); // Move to next word
    }
    updateDisplay(); // Update score, combo, miss after each key press
}

// --- テストロジック ---
function startTest(mode) {
    startRandomBGM(); // Start BGM for test modes
    state.testMode = mode;
    state.currentCourse = elements.contentSelect.value;
    let filteredWords = allWordsData[state.currentCourse] || [];

    if (state.selectedLabels.size > 0) {
        filteredWords = filteredWords.filter(word => word.labels && word.labels.some(label => state.selectedLabels.has(label)));
    }

    switch (state.filterType) {
        case 'unseen':
            filteredWords = filteredWords.filter(word => {
                const stats = state.wordStats[word.word];
                if (state.testMode === 'spelling') {
                    return !stats || (stats.spellingTestCorrect === 0 && stats.spellingTestIncorrect === 0);
                } else if (state.testMode === 'test_meaning_choice') {
                    return !stats || (stats.meaningChoiceTestCorrect === 0 && stats.meaningChoiceTestIncorrect === 0);
                } else {
                    return !stats || (stats.correct === 0 && stats.incorrect === 0);
                }
            });
            break;
        case 'mistakes':
            filteredWords = filteredWords.filter(word => {
                const stats = state.wordStats[word.word];
                if (!stats) return false;
                if (state.testMode === 'spelling') {
                    return stats.spellingTestIncorrect > 0;
                } else if (state.testMode === 'test_meaning_choice') {
                    return stats.meaningChoiceTestIncorrect > 0;
                } else {
                    return stats.incorrect > 0;
                }
            });
            break;
        case 'correct':
            filteredWords = filteredWords.filter(word => {
                const stats = state.wordStats[word.word];
                if (!stats) return false;
                if (state.testMode === 'spelling') {
                    return stats.spellingTestCorrect > 0;
                } else if (state.testMode === 'test_meaning_choice') {
                    return stats.meaningChoiceTestCorrect > 0;
                } else {
                    return stats.correct > 0;
                }
            });
            break;
        case 'custom':
            filteredWords = filteredWords.filter(word => {
                const stats = state.wordStats[word.word] || { correct: 0, incorrect: 0 };
                let correctCount, incorrectCount;
                if (state.testMode === 'spelling') {
                    correctCount = stats.spellingTestCorrect;
                    incorrectCount = stats.spellingTestIncorrect;
                } else if (state.testMode === 'test_meaning_choice') {
                    correctCount = stats.meaningChoiceTestCorrect;
                    incorrectCount = stats.meaningChoiceTestIncorrect;
                } else {
                    correctCount = stats.correct;
                    incorrectCount = stats.incorrect;
                }
                const totalAttempts = correctCount + incorrectCount;
                const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 100;
                const incorrectCountMatch = incorrectCount >= state.customFilter.incorrectCount;
                const accuracyMatch = accuracy >= state.customFilter.accuracyMin && accuracy <= state.customFilter.accuracyMax;
                return incorrectCountMatch && accuracyMatch;
            });
            break;
        case 'all':
        default:
            break;
    }

    state.testWords = shuffleArray(filteredWords);
    Object.assign(state, { 
        testCurrentIndex: 0, 
        testCorrectCount: 0, 
        testIncorrectCount: 0, 
        testStartTime: Date.now(),
        currentInput: '' 
    });
    if (state.testWords.length === 0) {
        alert('選択されたコースに単語がありません。');
        return showScreen(elements.startScreen);
    }
    showScreen(elements.testScreen);
    if (state.testMode === 'test_meaning_choice') {
        elements.multipleChoiceContainer.style.display = 'grid';
        elements.typingTestContainer.style.display = 'none';
        elements.testMeaningDisplay.style.display = 'block'; // Show meaning display
        elements.testWordDisplay.style.display = 'none'; // Hide word display initially
        state.currentWord = state.testWords[state.testCurrentIndex];
        elements.testMeaningDisplay.textContent = state.currentWord.meaning; // Display the meaning
        setupMeaningQuiz();
    } else if (state.testMode === 'spelling') {
        elements.multipleChoiceContainer.style.display = 'none';
        elements.typingTestContainer.style.display = 'flex';
        elements.testMeaningDisplay.style.display = 'block';
        elements.testTypingInput.value = '';
        elements.testTypingInput.focus();
        state.currentWord = state.testWords[state.testCurrentIndex];
        elements.testMeaningDisplay.textContent = state.currentWord.meaning;
        elements.testWordDisplay.textContent = ''; // Clear previous word display
        elements.testInputDisplay.innerHTML = '_ '.repeat(state.currentWord.word.length).trim(); // Display underscores for typing
        elements.testSubmitButton.disabled = true; // Initially disable submit button
    }
}

function setupMeaningQuiz() {
    const currentWord = state.currentWord;
    // elements.testWordDisplay.textContent = currentWord.word; // This should not be set here for meaning -> word test
    let choices = [{ text: currentWord.word, correct: true }]; // Choices are now words
    
    // Get other words from the current course for distractors
    const otherWordsInCourse = allWordsData[state.currentCourse]
        .filter(w => w.word !== currentWord.word)
        .map(w => w.word);
    
    const shuffledOtherWords = shuffleArray(otherWordsInCourse);

    // Add up to 3 distinct incorrect word choices
    for (let i = 0; i < 3 && i < shuffledOtherWords.length; i++) {
        choices.push({ text: shuffledOtherWords[i], correct: false });
    }

    // If not enough distractors from the current course, pull from other courses
    if (choices.length < 4) {
        const allOtherWords = Object.values(allWordsData).flat()
            .map(w => w.word)
            .filter(w => !choices.some(c => c.text === w)); // Ensure uniqueness
        const shuffledAllOtherWords = shuffleArray(allOtherWords);
        for (let i = 0; choices.length < 4 && i < shuffledAllOtherWords.length; i++) {
            choices.push({ text: shuffledAllOtherWords[i], correct: false });
        }
    }

    choices = shuffleArray(choices);
    document.querySelectorAll('.test-choice-button').forEach((button, index) => {
        if (choices[index]) {
            const newButton = button.cloneNode(true);
            newButton.textContent = choices[index].text;
            newButton.dataset.correct = choices[index].correct;
            newButton.disabled = false;
            newButton.className = 'btn test-choice-button'; // Reset classes
            newButton.style.display = 'block';
            // Remove existing event listener to prevent duplicates
            const oldButton = button;
            const newButtonClean = oldButton.cloneNode(true);
            oldButton.parentNode.replaceChild(newButtonClean, oldButton);
            newButtonClean.textContent = choices[index].text;
            newButtonClean.dataset.correct = choices[index].correct;
            newButtonClean.disabled = false;
            newButtonClean.className = 'btn test-choice-button';
            newButtonClean.style.display = 'block';
            newButtonClean.addEventListener('click', handleMeaningChoice);
        } else {
            button.style.display = 'none';
        }
    });
}

function handleMeaningChoice(event) {
    const selectedButton = event.target;
    const isCorrect = selectedButton.dataset.correct === 'true';
    document.querySelectorAll('.test-choice-button').forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.correct === 'true') btn.classList.add('correct-feedback');
    });
    playSound(isCorrect ? 'correct' : 'incorrect');
    selectedButton.classList.add(isCorrect ? 'correct-feedback' : 'incorrect-feedback');
    
    // Reveal the correct word
    elements.testWordDisplay.textContent = state.currentWord.word;
    elements.testWordDisplay.style.display = 'block';

    if (isCorrect) state.testCorrectCount++; else state.testIncorrectCount++;
    updateStats(state.currentWord, isCorrect); // 統計を更新
    setTimeout(() => {
        elements.testWordDisplay.style.display = 'none'; // Hide word display for next question
        state.testCurrentIndex++;
        if (state.testCurrentIndex < state.testWords.length) {
            state.currentWord = state.testWords[state.testCurrentIndex];
            elements.testMeaningDisplay.textContent = state.currentWord.meaning; // Update meaning
            setupMeaningQuiz();
        } else {
            endTest();
        }
    }, 1500);
}

function endTest() {
    stopBGM(); // Stop BGM when test ends
    state.testEndTime = Date.now();
    const totalQuestions = state.testCorrectCount + state.testIncorrectCount;
    const accuracy = totalQuestions > 0 ? (state.testCorrectCount / totalQuestions) * 100 : 0;
    const duration = (state.testEndTime - state.testStartTime) / 1000;
    
    // 途中終了でも結果を保存
    if (totalQuestions > 0) {
        const resultData = {
            date: new Date().toISOString(), 
            mode: state.testMode, 
            course: state.currentCourse,
            correct: state.testCorrectCount, 
            incorrect: state.testIncorrectCount,
            accuracy, 
            duration, 
            wpm: state.testMode === 'spelling' ? (state.testCorrectCount / (duration / 60)) : null
        };
        state.history.push(resultData);
        saveUserData();
        alert(`テスト終了！\n正解: ${state.testCorrectCount}, 不正解: ${state.testIncorrectCount}\n正答率: ${accuracy.toFixed(2)}%`);
    } else {
        alert('テストが中断されました。結果は保存されません。');
    }

    showScreen(elements.startScreen);
}

// --- 表示更新・統計 ---
function updatePersonalBests(result) {
    const mode = result.mode;
    if (!state.personalBests[mode]) state.personalBests[mode] = {};
    if ((state.personalBests[mode].score || 0) < result.score) state.personalBests[mode].score = result.score;
    if ((state.personalBests[mode].wpm || 0) < result.wpm) state.personalBests[mode].wpm = result.wpm;
    if ((state.personalBests[mode].maxCombo || 0) < result.maxCombo) state.personalBests[mode].maxCombo = result.maxCombo;
}

function updateStats(word, isCorrect) {
    const wordKey = word.word;
    if (!state.wordStats[wordKey]) {
        state.wordStats[wordKey] = {
            correct: 0, incorrect: 0,
            spellingTestCorrect: 0, spellingTestIncorrect: 0,
            meaningChoiceTestCorrect: 0, meaningChoiceTestIncorrect: 0
        };
    }

    // Update general word stats (used by practice typing and all tests)
    if (isCorrect) state.wordStats[wordKey].correct++; else state.wordStats[wordKey].incorrect++;

    // Update specific test stats if applicable
    if (state.testMode === 'spelling') {
        if (isCorrect) state.wordStats[wordKey].spellingTestCorrect++; else state.wordStats[wordKey].spellingTestIncorrect++;
    } else if (state.testMode === 'test_meaning_choice') {
        if (isCorrect) state.wordStats[wordKey].meaningChoiceTestCorrect++; else state.wordStats[wordKey].meaningChoiceTestIncorrect++;
    }

    // Update Label Stats (for history view)
    if (word.labels && word.labels.length > 0) {
        word.labels.forEach(label => {
            if (!state.labelStats[label]) state.labelStats[label] = { correct: 0, incorrect: 0 };
            if (isCorrect) state.labelStats[label].correct++; else state.labelStats[label].incorrect++;
        });
    }
}

function updateDisplay() {
    elements.scoreDisplay.textContent = state.score;
    elements.comboDisplay.textContent = state.combo;
    elements.missCountDisplay.textContent = state.missCount;
    elements.timerDisplay.textContent = state.timer;
}

function startTimer() {
    state.timer = 60;
    updateDisplay();
    state.intervalId = setInterval(() => {
        state.timer--;
        updateDisplay();
        if (state.timer <= 0) endGame();
    }, 1000);
}

function initHistoryChart() {
    if (historyChart) {
        historyChart.destroy();
    }
    const ctx = elements.historyChartCanvas.getContext('2d');
    historyChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { 
                y: { beginAtZero: true },
                x: { ticks: { autoSkip: false, maxRotation: 70, minRotation: 70 } }
            } 
        }
    });
}

function updateHistoryView(view = 'recent') {
    if (!elements.historyScreen.classList.contains('active')) return;

    // タブのアクティブ状態を更新
    const tabs = [elements.showRecentBtn, elements.showDailyBtn, elements.showBestsBtn, elements.showLabelStatsBtn];
    tabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = view === 'recent' ? elements.showRecentBtn :
                      view === 'daily' ? elements.showDailyBtn :
                      view === 'bests' ? elements.showBestsBtn :
                      elements.showLabelStatsBtn;
    activeTab.classList.add('active');

    // コンテナの表示を制御
    elements.historyTableContainer.style.display = 'none';
    elements.personalBestsContainer.style.display = 'none';
    elements.historyChartCanvas.parentElement.style.display = 'none';
    elements.modeFilterContainer.style.display = 'none';

    const filterValue = document.querySelector('input[name="history-mode-filter"]:checked').value;

    switch (view) {
        case 'recent':
            elements.historyTableContainer.style.display = 'block';
            elements.modeFilterContainer.style.display = 'flex';
            renderRecentHistory(filterValue);
            break;
        case 'daily':
            elements.historyChartCanvas.parentElement.style.display = 'block';
            elements.historyTableContainer.style.display = 'block';
            renderDailyStats();
            break;
        case 'bests':
            elements.personalBestsContainer.style.display = 'block';
            renderPersonalBests();
            break;
        case 'label':
            elements.historyChartCanvas.parentElement.style.display = 'block';
            elements.historyTableContainer.style.display = 'block';
            renderLabelStats();
            break;
    }
}

function renderRecentHistory(modeFilter) {
    let html = '<table><thead><tr><th>日時</th><th>モード</th><th>コース</th><th>スコア/結果</th><th>WPM</th><th>正解率</th><th>ミス</th></tr></thead><tbody>';
    
    const filteredHistory = state.history.filter(h => {
        if (modeFilter === 'all') return true;
        return h.mode === modeFilter;
    });
    
    if (filteredHistory.length === 0) {
        html += '<tr><td colspan="7">履歴がありません。</td></tr>';
    } else {
        filteredHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(h => {
            const date = new Date(h.date).toLocaleString();
            const modeName = getModeDisplayName(h.mode);
            const scoreOrResult = h.score !== undefined ? h.score : `${h.correct}/${h.correct + h.incorrect}`;
            const missCount = h.missCount !== undefined ? h.missCount : h.incorrect;
            const modeClass = h.mode === 'practice_typing' ? 'mode-cell-typing' :
                              h.mode === 'test_spelling' ? 'mode-cell-spelling' :
                              h.mode === 'test_meaning_choice' ? 'mode-cell-meaning' : '';

            html += `
                <tr>
                    <td>${date}</td>
                    <td><span class="${modeClass}">${modeName}</span></td>
                    <td>${h.course}</td>
                    <td>${scoreOrResult}</td>
                    <td>${h.wpm ? h.wpm.toFixed(1) : 'N/A'}</td>
                    <td>${h.accuracy.toFixed(1)}%</td>
                    <td>${missCount}</td>
                </tr>
            `;
        });
    }
    html += '</tbody></table>';
    elements.historyTableContainer.innerHTML = html;
}

function renderDailyStats() {
    const dailyData = {};

    state.history.forEach(h => {
        const date = new Date(h.date).toLocaleDateString();
        if (!dailyData[date]) {
            dailyData[date] = {
                typingWpm: [],
                typingAccuracy: [],
                testAccuracy: [],
                totalPlays: 0
            };
        }
        dailyData[date].totalPlays++;
        if (h.mode === 'practice_typing') {
            if(h.wpm) dailyData[date].typingWpm.push(h.wpm);
            if(h.accuracy) dailyData[date].typingAccuracy.push(h.accuracy);
        } else { // Test modes
            if(h.accuracy) dailyData[date].testAccuracy.push(h.accuracy);
        }
    });

    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
    
    const avgWpm = sortedDates.map(date => {
        const wpmList = dailyData[date].typingWpm;
        return wpmList.length > 0 ? wpmList.reduce((a, b) => a + b, 0) / wpmList.length : 0;
    });

    const avgTestAccuracy = sortedDates.map(date => {
        const accList = dailyData[date].testAccuracy;
        return accList.length > 0 ? accList.reduce((a, b) => a + b, 0) / accList.length : 0;
    });

    initHistoryChart();
    historyChart.data.labels = sortedDates;
    historyChart.data.datasets = [
        {
            label: '平均WPM (タイピング)',
            data: avgWpm,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            yAxisID: 'yWpm',
        },
        {
            label: '平均正解率 (テスト)',
            data: avgTestAccuracy,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            yAxisID: 'yAccuracy',
        }
    ];
    historyChart.options.scales = {
        yWpm: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'WPM' }
        },
        yAccuracy: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 0,
            max: 100,
            title: { display: true, text: '正解率 (%)' },
            grid: { drawOnChartArea: false }
        }
    };
    historyChart.update();

    let html = '<table><thead><tr><th>日付</th><th>プレイ回数</th><th>平均WPM</th><th>平均正解率(テスト)</th></tr></thead><tbody>';
    if (sortedDates.length === 0) {
        html += '<tr><td colspan="4">データがありません。</td></tr>';
    } else {
        sortedDates.forEach((date, i) => {
            html += `
                <tr>
                    <td>${date}</td>
                    <td>${dailyData[date].totalPlays}</td>
                    <td>${avgWpm[i] > 0 ? avgWpm[i].toFixed(1) : 'N/A'}</td>
                    <td>${avgTestAccuracy[i] > 0 ? avgTestAccuracy[i].toFixed(1) + '%' : 'N/A'}</td>
                </tr>
            `;
        });
    }
    html += '</tbody></table>';
    elements.historyTableContainer.innerHTML = html;
}

function renderPersonalBests() {
    let html = '<h3>自己ベスト</h3>';
    const bests = state.personalBests;
    if (Object.keys(bests).length === 0) {
        html += '<p>まだ記録がありません。</p>';
    } else {
        const groupedBests = {};
        for (const modeKey in bests) {
            const baseMode = getModeDisplayName(modeKey);
            if (!groupedBests[baseMode]) {
                groupedBests[baseMode] = {};
            }
            // Merge stats, preferring higher values
            for(const stat in bests[modeKey]) {
                if (!groupedBests[baseMode][stat] || bests[modeKey][stat] > groupedBests[baseMode][stat]) {
                    groupedBests[baseMode][stat] = bests[modeKey][stat];
                }
            }
        }

        for (const mode in groupedBests) {
            html += `<h4>${mode}</h4>`;
            html += '<ul>';
            if (groupedBests[mode].score) html += `<li>最高スコア: ${groupedBests[mode].score}</li>`;
            if (groupedBests[mode].wpm) html += `<li>最高WPM: ${groupedBests[mode].wpm.toFixed(1)}</li>`;
            if (groupedBests[mode].maxCombo) html += `<li>最大コンボ: ${groupedBests[mode].maxCombo}</li>`;
            html += '</ul>';
        }
    }
    elements.personalBestsContainer.innerHTML = html;
}

function renderLabelStats() {
    let html = '<table><thead><tr><th>ラベル</th><th>正解</th><th>不正解</th><th>正解率</th></tr></thead><tbody>';
    const sortedLabels = Object.entries(state.labelStats).sort((a, b) => a[0].localeCompare(b[0]));

    if (sortedLabels.length === 0) {
        html += '<tr><td colspan="4">ラベルデータがありません。</td></tr>';
    } else {
        sortedLabels.forEach(([label, stats]) => {
            const total = stats.correct + stats.incorrect;
            const accuracy = total > 0 ? (stats.correct / total) * 100 : 0;
            html += `
                <tr>
                    <td>${label}</td>
                    <td>${stats.correct}</td>
                    <td>${stats.incorrect}</td>
                    <td>${accuracy.toFixed(1)}%</td>
                </tr>
            `;
        });
    }
    html += '</tbody></table>';
    elements.historyTableContainer.innerHTML = html;

    // Update chart
    initHistoryChart();
    const labels = sortedLabels.map(([label, _]) => label);
    const accuracyData = sortedLabels.map(([_, stats]) => {
        const total = stats.correct + stats.incorrect;
        return total > 0 ? (stats.correct / total) * 100 : 0;
    });
    historyChart.data.labels = labels;
    historyChart.data.datasets = [{
        label: '正解率 (%)',
        data: accuracyData,
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgb(255, 159, 64)',
        borderWidth: 1
    }];
    historyChart.options.scales.y.ticks = {
        callback: function(value) {
            return value + '%'
        }
    };
    historyChart.update();
}

function getModeDisplayName(modeKey) {
    const names = {
        'practice_typing': 'タイピング',
        'test_meaning_choice': '意味選択テスト',
        'test_spelling': 'スペルテスト'
    };
    if (modeKey.startsWith('practice_')) return names['practice_typing'];
    return names[modeKey] || modeKey;
}

// =================================================================
// イベントリスナー設定
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadWordsData();
    initHistoryChart();
});

elements.showModeSelectionBtn.addEventListener('click', () => {
    startRandomBGM();
    showScreen(elements.modeSelectionScreen);
});
elements.modeBackButton.addEventListener('click', () => {
    stopBGM(); // Stop BGM when returning to start screen
    showScreen(elements.startScreen);
});
elements.historyButton.addEventListener('click', () => {
    showScreen(elements.historyScreen);
    updateHistoryView('recent');
});
elements.historyBackButton.addEventListener('click', () => {
    stopBGM(); // Stop BGM when returning to start screen
    showScreen(elements.startScreen);
});
elements.contentSelect.addEventListener('change', (event) => {
    populateLabelSelection(event.target.value);
    saveSettings();
});
elements.selectAllLabelsBtn.addEventListener('click', () => {
    elements.labelSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = true);
    updateSelectedLabels();
});
elements.deselectAllLabelsBtn.addEventListener('click', () => {
    elements.labelSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    updateSelectedLabels();
});
document.querySelectorAll('input[name="filter-type"]').forEach(radio => {
    radio.addEventListener('change', (event) => {
        state.filterType = event.target.value;
        elements.customFilterPanel.style.display = (state.filterType === 'custom') ? 'flex' : 'none';
        saveSettings();
    });
});
elements.incorrectCountFilter.addEventListener('input', (e) => {
    state.customFilter.incorrectCount = parseInt(e.target.value) || 0;
    saveSettings();
});
elements.accuracyRangeFilterMin.addEventListener('input', (e) => {
    state.customFilter.accuracyMin = parseInt(e.target.value) || 0;
    saveSettings();
});
elements.accuracyRangeFilterMax.addEventListener('input', (e) => {
    state.customFilter.accuracyMax = parseInt(e.target.value) || 100;
    saveSettings();
});
elements.startMeaningChoiceTestBtn.addEventListener('click', () => startTest('test_meaning_choice'));
elements.startSpellingTestBtn.addEventListener('click', () => startTest('spelling'));
elements.startWordTypingAudioBtn.addEventListener('click', () => startGame('practice_word_typing_audio'));
elements.startWordTypingNoAudioBtn.addEventListener('click', () => startGame('practice_word_typing_no_audio'));
elements.startMeaningTypingAudioBtn.addEventListener('click', () => startGame('practice_meaning_recall_audio'));
elements.startMeaningTypingNoAudioBtn.addEventListener('click', () => startGame('practice_meaning_recall_no_audio'));
elements.startWordToMeaningAudioBtn.addEventListener('click', () => startGame('practice_word_to_meaning_audio'));
elements.startWordToMeaningNoAudioBtn.addEventListener('click', () => startGame('practice_word_to_meaning_no_audio'));
elements.typingInput.addEventListener('input', handleTypingInput);
document.addEventListener('keydown', (event) => {
    if (elements.gameScreen.classList.contains('active') && event.key.length === 1) {
        elements.typingInput.focus();
    } else if (elements.testScreen.classList.contains('active') && state.testMode === 'spelling' && event.key.length === 1) {
        elements.testTypingInput.focus();
    }
});
elements.testTypingInput.addEventListener('input', (event) => {
    if (state.testMode !== 'spelling' || !state.currentWord) return;

    const typedText = elements.testTypingInput.value;
    const targetText = state.currentWord.word;
    let displayHtml = '';

    // Play key sound for any new input
    if (event.inputType === 'insertText') { // Only play sound for new character input
        playSound('key');
    }

    // Display typed characters
    for (let i = 0; i < typedText.length; i++) {
        displayHtml += `<span class="typed-char">${typedText[i]}</span>`;
    }

    // Display underscores for remaining characters
    for (let i = typedText.length; i < targetText.length; i++) {
        displayHtml += `<span class="untyped">_</span>`;
    }
    elements.testInputDisplay.innerHTML = displayHtml;

    // Enable submit button if there is any input
    elements.testSubmitButton.disabled = (typedText.length === 0);
});
elements.testSubmitButton.addEventListener('click', () => {
    if (state.testMode !== 'spelling') return;

    const typedText = elements.testTypingInput.value;
    const targetText = state.currentWord.word;
    const isCorrect = (typedText === targetText);

    elements.testTypingInput.disabled = true; // Disable input after submission
    elements.testSubmitButton.disabled = true; // Disable button after submission

    playSound(isCorrect ? 'correct' : 'incorrect');
    elements.testWordDisplay.textContent = targetText; // Reveal the correct word
    elements.testWordDisplay.classList.add(isCorrect ? 'correct-feedback' : 'incorrect-feedback');
    elements.testWordDisplay.style.display = 'block'; // Ensure it's visible

    if (isCorrect) state.testCorrectCount++; else state.testIncorrectCount++;
    updateStats(state.currentWord, isCorrect);

    setTimeout(() => {
        elements.testTypingInput.disabled = false;
        elements.testTypingInput.value = '';
        state.currentInput = ''; // Reset currentInput for the next test word
        elements.testInputDisplay.textContent = '';
        elements.testWordDisplay.classList.remove('correct-feedback', 'incorrect-feedback');
        elements.testWordDisplay.style.display = 'none'; // Hide word display for next question
        state.testCurrentIndex++;
        if (state.testCurrentIndex < state.testWords.length) {
            state.currentWord = state.testWords[state.testCurrentIndex];
            elements.testMeaningDisplay.textContent = state.currentWord.meaning;
            elements.testInputDisplay.innerHTML = '_ '.repeat(state.currentWord.word.length).trim(); // Display underscores for typing
            elements.testSubmitButton.disabled = (elements.testTypingInput.value.length === 0); // Re-enable submit button based on input presence
        } else {
            endTest();
        }
    }, 1500);
});
elements.testFinishButton.addEventListener('click', () => {
    if (confirm('テストを終了しますか？ここまでの結果が保存されます。')) {
        endTest();
    }
});
elements.restartButton.addEventListener('click', () => startGame(state.gameMode));
elements.backToTopButton.addEventListener('click', () => {
    stopBGM(); // Stop BGM when returning to start screen
    showScreen(elements.startScreen);
});

elements.showRecentBtn.addEventListener('click', () => updateHistoryView('recent'));
elements.showDailyBtn.addEventListener('click', () => updateHistoryView('daily'));
elements.showBestsBtn.addEventListener('click', () => updateHistoryView('bests'));
elements.showLabelStatsBtn.addEventListener('click', () => updateHistoryView('label'));
document.querySelectorAll('input[name="history-mode-filter"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const activeTab = document.querySelector('.history-nav .btn-tab.active').id;
        const view = activeTab === 'show-recent-btn' ? 'recent' :
                     activeTab === 'show-daily-btn' ? 'daily' :
                     activeTab === 'show-bests-btn' ? 'bests' : 'label';
        updateHistoryView(view);
    });
});
elements.exportDataButton.addEventListener('click', () => {
    const data = { 
        history: state.history, 
        dailyStats: state.dailyStats,
        wordStats: state.wordStats,
        labelStats: state.labelStats,
        personalBests: state.personalBests
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'typing_combo_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('データを保存しました！');
});
elements.importDataButton.addEventListener('click', () => elements.importFileInput.click());
elements.importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm('現在のデータを上書きしてインポートしますか？')) {
                state.history = importedData.history || [];
                state.dailyStats = importedData.dailyStats || {};
                state.wordStats = importedData.wordStats || {};
                state.labelStats = importedData.labelStats || {};
                state.personalBests = importedData.personalBests || {};
                saveUserData();
                alert('データをインポートしました！');
            }
        } catch (error) {
            alert('ファイルの読み込みに失敗しました。JSON形式が正しいか確認してください。');
            console.error('Error importing data:', error);
        }
    };
    reader.readAsText(file);
});
elements.clearDataButton.addEventListener('click', () => {
    if (confirm('全ての成績とデータを削除しますか？この操作は元に戻せません。')) {
        localStorage.clear();
        state.history = [];
        state.dailyStats = {};
        state.wordStats = {};
        state.labelStats = {};
        state.personalBests = {};
        alert('全てのデータを削除しました。');
        showScreen(elements.startScreen);
        // populateCourseSelect(); // This might not be necessary if course data isn't cleared
    }
});

// Accordion Event Listener
if (elements.labelAccordionHeader) {
    elements.labelAccordionHeader.addEventListener('click', () => {
        const content = elements.labelAccordionContent;
        const icon = elements.accordionIcon;
        const header = elements.labelAccordionHeader;

        if (content.classList.contains('expanded')) {
            content.style.maxHeight = '0';
            content.classList.remove('expanded');
            header.classList.remove('expanded');
        } else {
            // Calculate the natural height of the content
            content.style.maxHeight = content.scrollHeight + 'px';
            content.classList.add('expanded');
            header.classList.add('expanded');
        }
    });
}