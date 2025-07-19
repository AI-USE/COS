let elements = {}; // Initialize as empty object, will be populated on DOMContentLoaded

// ゲームの状態
const state = {
    gameMode: null, // 'practice_word_typing_word_audio', 'practice_word_typing_meaning_audio', 'practice_word_typing_no_audio', 'practice_meaning_recall_meaning_audio', 'practice_meaning_recall_word_audio', 'practice_meaning_recall_no_audio', 'test_meaning_choice', 'test_spelling'
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
    meaningQuizActive: false, // 新しいモードで意味クイズがアクティブかどうか
    testWords: [], // テストモード用単語リスト
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
    filterType: 'all', // 'all', 'unseen', 'mistakes', 'custom', 'correct'
    customFilter: { incorrectCount: 0, accuracyMin: 0, accuracyMax: 100 },
    isBgmPlaying: false, // BGMが再生中かどうかを追跡する新しい状態変数
    searchSelectedLabels: new Set() // 記録検索用の選択されたラベル
};

let allWordsData = {}; // 全ての単語データ
let courseLabels = {}; // コースごとのラベル
let typingDailyChart;
let meaningTestChart;
let spellingTestChart;
let bgmFilesList = []; // ADDED: Global variable to store BGM file paths

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

// 文字の比較を柔軟に行うヘルパー関数
function isCharMatch(typedChar, expectedChar) {
    if (expectedChar === '〜' || expectedChar === '~') {
        // 期待される文字が全角または半角のチルダの場合、
        // 入力された文字が全角チルダ、半角チルダ、ハット、またはハイフンのいずれかであれば一致とみなす
        return ['〜', '~', '^', '-'].includes(typedChar);
    } else {
        // それ以外の文字は、小文字にして比較
        return typedChar.toLowerCase() === expectedChar.toLowerCase();
    }
}

// タイピング文字列を正規化する関数（主にチルダの扱い）
function normalizeTypingString(str) {
    if (!str) return '';
    return str.replace(/〜/g, '~'); // 全角チルダを半角チルダに置換
}

function generateSpellingTestDisplay(targetText, currentInput) {
    let displayHtml = '';
    let inputCharIndex = 0; // currentInputの現在処理中の文字のインデックス

    for (let i = 0; i < targetText.length; i++) {
        const targetChar = targetText[i];

        if (/[^a-zA-Z0-9]/.test(targetChar)) { // 英数字以外の文字（スキップ対象）
            displayHtml += `<span class="symbol-hint">${targetChar}</span>`;
        } else { // 英数字
            if (inputCharIndex < currentInput.length) {
                // ユーザーが入力した文字がある場合
                displayHtml += `<span class="typed">${currentInput[inputCharIndex]}</span>`; // Use a neutral 'typed' class instead of 'correct'
                inputCharIndex++;
            } else {
                // 未入力の英数字はアンダースコア
                displayHtml += `<span class="untyped">_</span>`;
            }
        }
    }
    return displayHtml;
}

// 新しいスペルテストの回答判定関数
function checkSpellingTestAnswer(typedText, targetText) {
    // Extract only alphanumeric characters from the target text for comparison.
    const targetToType = targetText.replace(/[^a-zA-Z0-9]/g, '');

    // Normalize both the user's input and the extracted target text to be lowercase.
    const normalizedTyped = typedText.toLowerCase();
    const normalizedTargetToType = targetToType.toLowerCase();

    // The answer is correct if the normalized strings match exactly.
    return normalizedTyped === normalizedTargetToType;
}

// 文字列が日本語のひらがなまたはカタカナを含むかを判定する関数
function containsJapaneseCharacters(text) {
    if (!text) return false;
    // ひらがな、カタカナのUnicode範囲をチェック
    return /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
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
            createBeep(880, 0.1, 1.0); // 高い音で短いビープ
            break;
        case 'incorrect':
            createBeep(220, 0.2, 1.0); // 低い音で少し長いビープ
            break;
        case 'finish':
            // 終了音は特に指定がなければ再生しない、または別の音を割り当てる
            return; 
        case 'combo':
            // コンボ音も同様
            return;
        case 'key':
            createBeep(440, 0.05, 0.8); // タイプ音を少し大きく
            break;
        default:
            return;
    }
}

function playWordAudio(word) {
    if (!word) {
        console.warn("No word object provided for audio playback.");
        createBeep(660, 0.1, 0.8);
        return;
    }

    if (word.audio) {
        const audio = new Audio(word.audio);
        audio.volume = 1.0; // 音量を最大に設定
        audio.play().catch(e => {
            console.error("Word audio play failed:", e);
            // Fallback to speech synthesis if audio file fails to play
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(word.word);
                utterance.lang = containsJapaneseCharacters(word.word) ? 'ja-JP' : 'en-US';
                utterance.rate = 1.5;
                utterance.volume = 1.0;
                speechSynthesis.speak(utterance);
            } else {
                createBeep(660, 0.1, 0.8);
            }
        });
    } else {
        console.warn("Word audio not available for:", word.word);
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word.word);
            utterance.lang = containsJapaneseCharacters(word.word) ? 'ja-JP' : 'en-US';
            utterance.rate = 1.0;
            utterance.volume = 1.0;
            speechSynthesis.speak(utterance);
        } else {
            createBeep(660, 0.1, 0.8); // Fallback to beep if no audio and no speech synthesis
        }
    }
}

function speakMeaning(text) {
    if (!('speechSynthesis' in window)) {
        console.warn("Speech Synthesis API not supported in this browser.");
        createBeep(660, 0.1, 0.8); // 代替電子音
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP'; // 日本語に設定
    utterance.rate = 1.0; // 読み上げ速度 (速めに設定)
    utterance.volume = 1.0; // 音量
    speechSynthesis.speak(utterance);
}

function startRandomBGM() {
    console.log("startRandomBGM called.");
    if (state.isBgmPlaying) {
        console.log("BGM is already playing, returning.");
        return;
    }
    const bgmFiles = bgmFilesList; // MODIFIED: Use dynamically loaded BGM files
    if (bgmFiles.length === 0) {
        console.warn("No BGM files available.");
        return;
    }
    const selectedBGM = bgmFiles[Math.floor(Math.random() * bgmFiles.length)];
    console.log("Selected BGM:", selectedBGM);
    if (elements.bgmPlayer) {
        elements.bgmPlayer.src = selectedBGM;
        elements.bgmPlayer.loop = true;
        elements.bgmPlayer.volume = 0.1; // BGMの音量を小さく設定 (0.0から1.0)
        elements.bgmPlayer.play().then(() => {
            state.isBgmPlaying = true;
            console.log("BGM started playing.");
        }).catch(e => {
            console.error("BGM play failed:", e);
            // Check for specific error types, e.g., NotAllowedError for autoplay policy
            if (e.name === 'NotAllowedError') {
                console.warn("Autoplay was prevented. User interaction might be required.");
            }
        });
    } else {
        console.error("BGM player element not found.");
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
        elements.gameScreen, elements.testScreen, elements.resultScreen, elements.gradeManagementScreen
    ];
    screens.forEach(screen => {
        screen.classList.toggle('active', screen === screenElement);
    });
}

// --- データ管理 ---
async function loadWordsData() {
    showScreen(elements.loadingScreen);
    try {
        const [wordsResponse, bgmResponse] = await Promise.all([
            fetch('words.json'),
            fetch('bgm_files.json') // ADDED: Fetch BGM file list
        ]);

        if (!wordsResponse.ok) throw new Error(`HTTP error! status: ${wordsResponse.status} for words.json`);
        if (!bgmResponse.ok) throw new Error(`HTTP error! status: ${bgmResponse.status} for bgm_files.json`);

        allWordsData = await wordsResponse.json();
        bgmFilesList = await bgmResponse.json(); // ADDED: Store BGM file list

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
        console.error('Failed to load initial data:', error);
        elements.loadingScreen.innerHTML = '<p style="color: red;">データの読み込みに失敗しました。ページをリロードしてください。</p>';
    }
}

function populateCourseSelect(selectElement = elements.contentSelect) {
    selectElement.innerHTML = '';
    // Only populate courseLabels once for the main contentSelect
    if (selectElement === elements.contentSelect) {
        courseLabels = {};
    }

    for (const courseName in allWordsData) {
        const option = document.createElement('option');
        option.value = courseName;
        option.textContent = courseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        selectElement.appendChild(option);

        if (selectElement === elements.contentSelect) {
            const labels = new Set();
            allWordsData[courseName].forEach(word => {
                // word.labels が常に配列であることを前提とする
                if (word.labels && Array.isArray(word.labels)) {
                    word.labels.forEach(label => labels.add(label));
                    console.log(`  Processing word: ${word.word}, labels:`, word.labels); // ADDED MORE DETAILED DEBUG LOG
                }
            });
            courseLabels[courseName] = Array.from(labels).sort();
            console.log(`Course: ${courseName}, Collected Labels:`, courseLabels[courseName]); // ADDED DEBUG LOG
        }
    }
    if (selectElement.options.length > 0) {
        // Handled by loadSettings or specific tab logic
    }
}

function populateLabelSelection(courseName, containerElement = elements.labelSelectionContainer, selectedLabelsSet = state.selectedLabels) {
    containerElement.innerHTML = '';
    const labels = courseLabels[courseName] || [];
    console.log(`populateLabelSelection for course: ${courseName}, selectedLabelsSet:`, Array.from(selectedLabelsSet)); // ADDED DEBUG LOG
    labels.forEach(label => {
        const div = document.createElement('div');
        div.className = 'label-checkbox-item';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `label-${label}-${containerElement.id}`; // Unique ID for each label checkbox
        input.value = label;
        const isChecked = selectedLabelsSet.has(label); // Capture the checked state
        input.checked = isChecked; // Set the initial checked state
        console.log(`  Label: "${label}", isChecked: ${isChecked}`); // ADDED DEBUG LOG for each label
        input.addEventListener('change', (event) => {
            const label = event.target.value;
            const isChecked = event.target.checked;
            if (containerElement === elements.labelSelectionContainer) {
                if (isChecked) {
                    state.selectedLabels.add(label);
                } else {
                    state.selectedLabels.delete(label);
                }
                saveSettings();
            } else if (containerElement === elements.searchLabelSelectionContainer) {
                if (isChecked) {
                    state.searchSelectedLabels.add(label);
                } else {
                    state.searchSelectedLabels.delete(label);
                }
                // 検索フィルターは一時的なのでsaveSettingsは不要
            }
        });
        const labelElement = document.createElement('label');
        labelElement.htmlFor = `label-${label}-${containerElement.id}`;
        labelElement.textContent = label;
        div.appendChild(input);
        div.appendChild(labelElement);
        containerElement.appendChild(div);
    });
}



function loadUserData() {
    try {
        const savedHistory = localStorage.getItem('typingComboHistory');
        if (savedHistory) {
            const loadedHistory = JSON.parse(savedHistory);
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
            state.history = loadedHistory.filter(entry => new Date(entry.date).getTime() > oneWeekAgo);
        }

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
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
        const filteredHistory = state.history.filter(entry => new Date(entry.date).getTime() > oneWeekAgo);
        localStorage.setItem('typingComboHistory', JSON.stringify(filteredHistory));
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
            populateLabelSelection(state.currentCourse);

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
                    return stats.spellingTestIncorrect > 0;
                } else { // Test modes
                    return stats.incorrect > 0;
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
    state.currentInput = '';
    state.nextCharIndex = 0;
    elements.typingInput.value = '';

    state.currentWordIndex++;
    if (state.currentWordIndex >= state.currentWords.length) {
        endGame();
        return;
    }
    state.currentWord = state.currentWords[state.currentWordIndex];
    state.currentInput = '';
    elements.typingInput.value = '';

    // Clear all displays initially
    elements.wordDisplay.textContent = '';
    elements.meaningDisplay.textContent = '';
    elements.inputDisplay.innerHTML = ''; // Clear input display content

    // Set displays based on game mode
    let hintText = '';
    switch (state.gameMode) {
        case 'practice_word_typing_word_audio':
        case 'practice_word_typing_no_audio':
            elements.meaningDisplay.textContent = state.currentWord.meaning;
            hintText = state.currentWord.word;
            break;
        case 'practice_word_typing_meaning_audio': // NEW MODE: Word Typing with Meaning Audio
            elements.meaningDisplay.textContent = state.currentWord.meaning; // Display meaning
            hintText = state.currentWord.word; // Type the word
            break;
        case 'practice_meaning_recall_meaning_audio':
        case 'practice_meaning_recall_word_audio':
        case 'practice_meaning_recall_no_audio':
            elements.meaningDisplay.textContent = state.currentWord.meaning;
            hintText = '_ '.repeat(state.currentWord.word.length).trim();
            break;
    }

    // Create individual spans for each character in the hintText
    for (let i = 0; i < hintText.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.textContent = hintText[i];
        charSpan.classList.add('hint'); // All characters start as hint
        elements.inputDisplay.appendChild(charSpan);
    }

    // Play audio based on the specific game mode
    if (state.gameMode === 'practice_word_typing_word_audio') {
        playWordAudio(state.currentWord);
    } else if (state.gameMode === 'practice_word_typing_meaning_audio') {
        speakMeaning(state.currentWord.meaning);
    } else if (state.gameMode === 'practice_meaning_recall_meaning_audio') {
        speakMeaning(state.currentWord.meaning);
    } else if (state.gameMode === 'practice_meaning_recall_word_audio') {
        playWordAudio(state.currentWord);
    }
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

    // ラベル別成績の表示ロジックは履歴画面に移行するため、ここでは��易表示または削除
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
    const inputChar = elements.typingInput.value;
    const targetText = state.currentWord.word;

    // 入力欄は毎回リセット（1文字ずつ処理）
    elements.typingInput.value = '';

    // 入力が1文字以外、または削除操作なら無視
    if (
        inputChar.length !== 1 ||
        event.inputType === 'deleteContentBackward' ||
        event.inputType === 'deleteContentForward'
    ) return;

    // 英数字以外の文字はスキップ対象
    function isSkippableChar(c) {
        return !(/[a-zA-Z0-9]/.test(c));
    }

    // スキップ文字を一括で進める処理（スコア・コンボも加算）
    function skipSkippableChars() {
        while (
            state.nextCharIndex < targetText.length &&
            isSkippableChar(targetText[state.nextCharIndex])
        ) {
            glowChar(state.nextCharIndex);
            advanceChar(false); // スキップでもコンボ加算
        }
    }

    // 1文字進める（コンボ加算 or なし）
    function advanceChar(addCombo) {
        state.nextCharIndex++;
        state.totalTypedChars++;
        state.correctTypedChars++;
        if (addCombo) {
            state.combo++;
            if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        }
        triggerAnimation(elements.comboDisplay, 'combo-animate');
        applyComboBonus();
    }

    // 光らせる
    function glowChar(index) {
        const spans = elements.inputDisplay.querySelectorAll('span');
        if (spans[index]) {
            spans[index].classList.add('char-correct-animate');
        }
    }

    // 表示更新（文字色やヒント）
    function updateDisplay() {
        const isMeaningRecallMode = state.gameMode.includes('meaning_recall');
        let displayHtml = '';
        for (let i = 0; i < targetText.length; i++) {
            const char = targetText[i];
            if (i < state.nextCharIndex) {
                const shownChar = isMeaningRecallMode ? state.currentInput[i] || char : char;
                displayHtml += `<span class="correct">${shownChar}</span>`;
            } else {
                displayHtml += isMeaningRecallMode
                    ? `<span class="hint">_</span>`
                    : `<span class="untyped">${char}</span>`;
            }
        }
        elements.inputDisplay.innerHTML = displayHtml;
    }

    // 単語完了処理
    function handleWordComplete() {
        playSound('correct');
        state.score +=  + state.combo * 5;
        updateStats(state.currentWord, true);
        triggerAnimation(elements.wordDisplay, 'word-correct-animate');
        nextWord();
        updateScoreDisplay();
    }

    // スコア表示即時更新用（例）
    function updateScoreDisplay() {
        elements.scoreDisplay.textContent = `${state.score}`;
    }

    // --- 処理開始 ---

    // まずスキップ文字処理
    skipSkippableChars();

    // 単語完了チェック
    if (state.nextCharIndex >= targetText.length) {
        handleWordComplete();
        return;
    }

    // 次に期待される文字
    const expectedChar = targetText[state.nextCharIndex];

    if (isCharMatch(inputChar, expectedChar)) {
        state.currentInput += inputChar;
        playSound('key'); // ADDED: Play key sound on correct input
        state.score +=  50;
        updateScoreDisplay()
        glowChar(state.nextCharIndex);
        advanceChar(true);
    } else {
        playSound('incorrect');
        state.missCount++;
        state.combo = 0;
    }

    // 入力後に再度スキップ判定
    skipSkippableChars();

    // 単語完了判定
    if (state.nextCharIndex >= targetText.length) {
        handleWordComplete();
    } else {
        updateDisplay();
    }
}

// 共通化：コンボボーナス適用処理
function applyComboBonus() {
    if (state.combo > 0 && state.combo % 20 === 0) {
        let bonusSeconds = 0;
        if (state.combo === 20) {
            bonusSeconds = 1;
        } else if (state.combo === 40) {
            bonusSeconds = 2;
        } else if (state.combo >= 60) {
            bonusSeconds = 3;
        }
        if (bonusSeconds > 0) {
            state.timer = Math.max(0, state.timer + bonusSeconds);
            triggerAnimation(elements.timerDisplay, 'timer-bonus-animate');
        }
    }
    if (state.combo > 0 && state.combo % 10 === 0) {
        playSound('combo');
    }
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
                } else { // Test modes
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
                }
            });
            break;
        case 'custom':
            filteredWords = filteredWords.filter(word => {
                const stats = state.wordStats[word.word] || { correct: 0, incorrect: 0 };
                // Use general correct/incorrect counts for consistency across all modes
                const correctCount = stats.correct;
                const incorrectCount = stats.incorrect;
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
        speakMeaning(state.currentWord.meaning); // 読み上げ機能を追加
        setupMeaningQuiz();
    } else if (state.testMode === 'spelling') {
        elements.multipleChoiceContainer.style.display = 'none';
        elements.typingTestContainer.style.display = 'flex';
        elements.testMeaningDisplay.style.display = 'block';
        elements.testTypingInput.value = '';
        elements.testTypingInput.focus();
        state.currentWord = state.testWords[state.testCurrentIndex];
        elements.testMeaningDisplay.textContent = state.currentWord.meaning;
        speakMeaning(state.currentWord.meaning); // 読み上げ機能を追加
        elements.testWordDisplay.textContent = ''; // Clear previous word display
        state.currentInput = ''; // Reset currentInput
        state.nextCharIndex = 0; // Initialize nextCharIndex
        elements.testInputDisplay.innerHTML = generateSpellingTestDisplay(state.currentWord.word, state.currentInput); // Display initial hint with symbols
        elements.testSubmitButton.disabled = true; // Initially disable submit button
    }
}

function setupMeaningQuiz() {
    const currentWord = state.currentWord;
    // elements.testWordDisplay.textContent = currentWord.word; // This should not be set here for meaning -> word test
    let choices = [{ text: currentWord.word, correct: true }]; // Choices are now words

    const currentWordLabels = new Set(currentWord.labels); // 現在の単語のラベルを取得
    const otherWordsInCourseAndLabel = allWordsData[state.currentCourse]
        .filter(w => w.word !== currentWord.word && w.labels && w.labels.some(label => currentWordLabels.has(label)))
        .map(w => w.word);

    const shuffledOtherWords = shuffleArray(otherWordsInCourseAndLabel);

    // 同じコース、同じラベルから最大3つの不正解の選択肢を追加
    for (let i = 0; i < 3 && i < shuffledOtherWords.length; i++) {
        choices.push({ text: shuffledOtherWords[i], correct: false });
    }
    // 他のコースからの選択肢は追加しない（要件による）

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
    playWordAudio(state.currentWord); // 正解を読み上げる

    if (isCorrect) state.testCorrectCount++; else state.testIncorrectCount++;
    updateStats(state.currentWord, isCorrect); // 統計を更新
    setTimeout(() => {
        elements.testWordDisplay.style.display = 'none'; // Hide word display for next question
        state.testCurrentIndex++;
        if (state.testCurrentIndex < state.testWords.length) {
            state.currentWord = state.testWords[state.testCurrentIndex];
            elements.testMeaningDisplay.textContent = state.currentWord.meaning;
            speakMeaning(state.currentWord.meaning); // 読み上げ機能を追加
            setupMeaningQuiz();
        } else {
            endTest();
        }
    }, 1500);
}

function updateResultScreenVisibility(isTestMode) {
    document.querySelectorAll('.practice-mode-only').forEach(el => {
        el.style.display = isTestMode ? 'none' : 'flex';
    });
    document.querySelectorAll('.test-mode-only').forEach(el => {
        el.style.display = isTestMode ? 'flex' : 'none';
    });
}

function endTest() {
    stopBGM(); // Stop BGM when test ends
    state.testEndTime = Date.now();
    const totalQuestions = state.testCorrectCount + state.testIncorrectCount;
    const accuracy = totalQuestions > 0 ? (state.testCorrectCount / totalQuestions) * 100 : 0; // Corrected this line
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
    }

    // Display results on the result screen
    elements.resultCorrectCount.textContent = state.testCorrectCount;
    elements.resultIncorrectCount.textContent = state.testIncorrectCount;
    elements.resultAccuracy.textContent = `${accuracy.toFixed(2)}%`;
    elements.resultDuration.textContent = `${duration.toFixed(1)}秒`;

    updateResultScreenVisibility(true); // Show test-specific elements, hide practice-specific
    showScreen(elements.resultScreen);
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

function renderPersonalBests(containerElement) {
    let html = '';
    const bests = state.personalBests;

    // タイピングモードの自己ベスト
    if (bests.practice_typing) {
        html += `
            <div class="result-item">
                <span>最高スコア (タイピング)</span>
                <span>${bests.practice_typing.score || 0}</span>
            </div>
            <div class="result-item">
                <span>最高WPM (タイピング)</span>
                <span>${(bests.practice_typing.wpm || 0).toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span>最大コンボ (タイピング)</span>
                <span>${bests.practice_typing.maxCombo || 0}</span>
            </div>
        `;
    }

    // テストモードの自己ベスト (必要であれば追加)
    // 例: スペルテストの最高正解数など

    if (html === '') {
        html = '<p>まだ自己最高記録がありません。</p>';
    }
    containerElement.innerHTML = html;
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

function initChart(canvasElement, chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
    }
    const ctx = canvasElement.getContext('2d');
    return new Chart(ctx, {
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

function updateGradeManagementView(mainTab = 'history') {
    // メインタブのアクティブ状態を更新
    const mainTabs = [elements.tabHistory, elements.tabTyping, elements.tabTest, elements.tabRecordSearch];
    mainTabs.forEach(tab => tab.classList.remove('active'));
    const activeMainTab = mainTabs.find(tab => tab.dataset.tab === mainTab);
    if (activeMainTab) activeMainTab.classList.add('active');

    // 各タブコンテンツの表示を制御
    elements.historyTabContent.classList.remove('active');
    elements.typingTabContent.classList.remove('active');
    elements.testTabContent.classList.remove('active');
    elements.recordSearchTabContent.classList.remove('active');

    switch (mainTab) {
        case 'history':
            elements.historyTabContent.classList.add('active');
            renderRecentHistory(document.querySelector('input[name="history-mode-filter"]:checked').value);
            break;
        case 'typing':
            elements.typingTabContent.classList.add('active');
            renderTypingTab();
            break;
        case 'test':
            elements.testTabContent.classList.add('active');
            updateTestSubTab('meaning-test'); // デフォルトで意味テストサブタブを表示
            break;
        case 'record-search':
            elements.recordSearchTabContent.classList.add('active');
            renderRecordSearchTab();
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
        html += '<tr><td colspan="7">履歴がありま��ん。</td></tr>';
    }
    else {
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

function renderTypingTab() {
    // 自己最高記録
    renderPersonalBests(elements.typingPersonalBestsContainer);

    // 日別平均とその推移の折れ線グラフ
    const dailyData = {};
    state.history.filter(h => h.mode === 'practice_typing').forEach(h => {
        const date = new Date(h.date).toLocaleDateString();
        if (!dailyData[date]) {
            dailyData[date] = {
                wpm: [],
                accuracy: [],
                totalPlays: 0
            };
        }
        dailyData[date].totalPlays++;
        if(h.wpm) dailyData[date].wpm.push(h.wpm);
        if(h.accuracy) dailyData[date].accuracy.push(h.accuracy);
    });

    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));

    const avgWpm = sortedDates.map(date => {
        const wpmList = dailyData[date].wpm;
        return wpmList.length > 0 ? wpmList.reduce((a, b) => a + b, 0) / wpmList.length : 0;
    });

    const avgAccuracy = sortedDates.map(date => {
        const accList = dailyData[date].accuracy;
        return accList.length > 0 ? accList.reduce((a, b) => a + b, 0) / accList.length : 0;
    });

    typingDailyChart = initChart(elements.typingDailyChartCanvas, typingDailyChart);
    typingDailyChart.data.labels = sortedDates;
    typingDailyChart.data.datasets = [
        {
            label: '平均WPM',
            data: avgWpm,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            type: 'line', // 折れ線グラフ
            fill: false,
            yAxisID: 'yWpm',
            tension: 0.1
        },
        {
            label: '平均正解率 (%)',
            data: avgAccuracy,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            type: 'line', // 折れ線グラフ
            fill: false,
            yAxisID: 'yAccuracy',
            tension: 0.1
        }
    ];
    typingDailyChart.options.scales = {
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
    typingDailyChart.update();

    let html = '<table><thead><tr><th>日付</th><th>プレイ回数</th><th>平均WPM</th><th>平均正解率</th></tr></thead><tbody>';
    if (sortedDates.length === 0) {
        html += '<tr><td colspan="4">データがありません。</td></tr>';
    }
    else {
        sortedDates.forEach((date, i) => {
            html += `
                <tr>
                    <td>${date}</td>
                    <td>${dailyData[date].totalPlays}</td>
                    <td>${avgWpm[i] > 0 ? avgWpm[i].toFixed(1) : 'N/A'}</td>
                    <td>${avgAccuracy[i] > 0 ? avgAccuracy[i].toFixed(1) + '%' : 'N/A'}</td>
                </tr>
            `;
        });
    }
    html += '</tbody></table>';
    elements.typingDailyTableContainer.innerHTML = html;
}

function updateTestSubTab(subTab = 'meaning-test') {
    const subTabs = [elements.subTabMeaningTest, elements.subTabSpellingTest];
    subTabs.forEach(tab => tab.classList.remove('active'));
    const activeSubTab = subTabs.find(tab => tab.dataset.subTab === subTab);
    if (activeSubTab) activeSubTab.classList.add('active');

    elements.meaningTestContent.classList.remove('active');
    elements.spellingTestContent.classList.remove('active');

    switch (subTab) {
        case 'meaning-test':
            elements.meaningTestContent.classList.add('active');
            renderTestMeaningTab();
            break;
        case 'spelling-test':
            elements.spellingTestContent.classList.add('active');
            renderTestSpellingTab();
            break;
    }
}

function renderTestMeaningTab() {
    populateCourseSelect(elements.testCourseSelectMeaning);
    elements.testCourseSelectMeaning.addEventListener('change', renderTestMeaningTab); // Re-render on course change

    const selectedCourse = elements.testCourseSelectMeaning.value;
    const wordsInCourse = allWordsData[selectedCourse] || [];

    const labelStats = {};
    wordsInCourse.forEach(word => {
        // Ensure word.labels is an array
        const labels = Array.isArray(word.labels) ? word.labels : (word.label ? [word.label] : []);

        const stats = state.wordStats[word.word] || { meaningChoiceTestCorrect: 0, meaningChoiceTestIncorrect: 0 };
        labels.forEach(label => {
            if (!labelStats[label]) {
                labelStats[label] = { correct: 0, incorrect: 0, unseen: 0, total: 0 };
            }
            labelStats[label].correct += stats.meaningChoiceTestCorrect;
            labelStats[label].incorrect += stats.meaningChoiceTestIncorrect;
            labelStats[label].total++; // Count total words with this label in the course
            if (stats.correct === 0 && stats.incorrect === 0) {
                labelStats[label].unseen++;
            }
        });
    });

    let tableHtml = '<table><thead><tr><th>ラベル</th><th>出題数</th><th>正解数</th><th>未出題問数</th><th>正答率</th></tr></thead><tbody>';
    const sortedLabels = Object.keys(labelStats).sort();

    if (sortedLabels.length === 0) {
        tableHtml += '<tr><td colspan="5">データがありません。</td></tr>';
    }
    else {
        sortedLabels.forEach(label => {
            const stats = labelStats[label];
            const askedCount = stats.correct + stats.incorrect;
            const accuracy = askedCount > 0 ? (stats.correct / askedCount) * 100 : 0;
            tableHtml += `
                <tr>
                    <td>${label}</td>
                    <td>${askedCount}</td>
                    <td>${stats.correct}</td>
                    <td>${stats.unseen}</td>
                    <td>${accuracy.toFixed(1)}%</td>
                </tr>
            `;
        });
    }
    tableHtml += '</tbody></table>';
    elements.meaningTestLabelStatsTable.innerHTML = tableHtml;

    // 正答率の棒グラフ
    meaningTestChart = initChart(elements.meaningTestChartCanvas, meaningTestChart);
    const labels = sortedLabels;
    const accuracyData = sortedLabels.map(label => {
        const stats = labelStats[label];
        const askedCount = stats.correct + stats.incorrect;
        return askedCount > 0 ? (stats.correct / askedCount) * 100 : 0;
    });

    meaningTestChart.data.labels = labels;
    meaningTestChart.data.datasets = [{
        label: '平均正解率 (%)',
        data: accuracyData,
        backgroundColor: 'rgba(0, 170, 255, 0.6)',
        borderColor: 'rgb(0, 170, 255)',
        borderWidth: 1
    }];
    meaningTestChart.options.scales.y.ticks = {
        callback: function(value) {
            return value + '%'
        }
    };
    meaningTestChart.update();
}

function renderTestSpellingTab() {
    populateCourseSelect(elements.testCourseSelectSpelling);
    elements.testCourseSelectSpelling.addEventListener('change', renderTestSpellingTab); // Re-render on course change

    const selectedCourse = elements.testCourseSelectSpelling.value;
    const wordsInCourse = allWordsData[selectedCourse] || [];

    const labelStats = {};
    wordsInCourse.forEach(word => {
        // Ensure word.labels is an array
        const labels = Array.isArray(word.labels) ? word.labels : (word.label ? [word.label] : []);

        const stats = state.wordStats[word.word] || { spellingTestCorrect: 0, spellingTestIncorrect: 0 };
        labels.forEach(label => {
            if (!labelStats[label]) {
                labelStats[label] = { correct: 0, incorrect: 0, unseen: 0, total: 0 };
            }
            labelStats[label].correct += stats.spellingTestCorrect;
            labelStats[label].incorrect += stats.spellingTestIncorrect;
            labelStats[label].total++; // Count total words with this label in the course
            if (stats.correct === 0 && stats.incorrect === 0) {
                labelStats[label].unseen++;
            }
        });
    });

    let tableHtml = '<table><thead><tr><th>ラベル</th><th>出題数</th><th>正解数</th><th>未出題問数</th><th>正答率</th></tr></thead><tbody>';
    const sortedLabels = Object.keys(labelStats).sort();

    if (sortedLabels.length === 0) {
        html += '<tr><td colspan="5">データがありません。</td></tr>';
    }
    else {
        sortedLabels.forEach(label => {
            const stats = labelStats[label];
            const askedCount = stats.correct + stats.incorrect;
            const accuracy = askedCount > 0 ? (stats.correct / askedCount) * 100 : 0;
            tableHtml += `
                <tr>
                    <td>${label}</td>
                    <td>${stats.correct}</td>
                    <td>${stats.unseen}</td>
                    <td>${accuracy.toFixed(1)}%</td>
                </tr>
            `;
        });
    }
    tableHtml += '</tbody></table>';
    elements.spellingTestLabelStatsTable.innerHTML = tableHtml;

    // 正答率の棒グラフ
    spellingTestChart = initChart(elements.spellingTestChartCanvas, spellingTestChart);
    const labels = sortedLabels;
    const accuracyData = sortedLabels.map(label => {
        const stats = labelStats[label];
        const askedCount = stats.correct + stats.incorrect;
        return askedCount > 0 ? (stats.correct / askedCount) * 100 : 0;
    });

    spellingTestChart.data.labels = labels;
    spellingTestChart.data.datasets = [{
        label: '正答率 (%)',
        data: accuracyData,
        backgroundColor: 'rgba(0, 170, 255, 0.6)',
        borderColor: 'rgb(0, 170, 255)',
        borderWidth: 1
    }];
    spellingTestChart.options.scales.y.ticks = {
        callback: function(value) {
            return value + '%'
        }
    };
    spellingTestChart.update();
}

function renderRecordSearchTab() {
    populateCourseSelect(elements.searchCourseSelect);

    // Initialize or reset search state for labels and filters when the tab is rendered
    state.searchSelectedLabels = new Set();
    const currentSearchCourse = elements.searchCourseSelect.value;
    const allLabelsForSearchCourse = courseLabels[currentSearchCourse] || [];
    allLabelsForSearchCourse.forEach(label => state.searchSelectedLabels.add(label));

    // Populate labels for the currently selected course in the search tab, with all selected
    populateLabelSelection(currentSearchCourse, elements.searchLabelSelectionContainer, state.searchSelectedLabels);

    // Ensure all checkboxes are checked in the UI initially
    elements.searchLabelSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = true);

    elements.searchFilterAll.checked = true;
    elements.searchCustomFilterPanel.style.display = 'none';
    elements.searchIncorrectCountFilter.value = 0;
    elements.searchAccuracyRangeFilterMin.value = 0;
    elements.searchAccuracyRangeFilterMax.value = 100;
    elements.recordSearchHitCount.textContent = '0';
    elements.recordSearchResultsTable.innerHTML = '';

    // Add event listener for course change in search tab
    elements.searchCourseSelect.onchange = () => {
        // When course changes, re-populate labels and select all for search
        state.searchSelectedLabels.clear();
        const newSearchCourse = elements.searchCourseSelect.value;
        const newAllLabelsForSearchCourse = courseLabels[newSearchCourse] || [];
        newAllLabelsForSearchCourse.forEach(label => state.searchSelectedLabels.add(label));

        populateLabelSelection(newSearchCourse, elements.searchLabelSelectionContainer, state.searchSelectedLabels);
        elements.searchLabelSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = true);

        // Also reset filter options for search tab when course changes
        elements.searchFilterAll.checked = true;
        elements.searchCustomFilterPanel.style.display = 'none';
        elements.searchIncorrectCountFilter.value = 0;
        elements.searchAccuracyRangeFilterMin.value = 0;
        elements.searchAccuracyRangeFilterMax.value = 100;
        elements.recordSearchHitCount.textContent = '0';
        elements.recordSearchResultsTable.innerHTML = '';
    };

    // Event listeners for search tab specific label controls
    elements.searchSelectAllLabels.onclick = () => {
        state.searchSelectedLabels.clear(); // Clear existing selections
        elements.searchLabelSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(c => {
            c.checked = true;
            state.searchSelectedLabels.add(c.value); // Add all labels to the set
        });
    };
    elements.searchDeselectAllLabels.onclick = () => {
        elements.searchLabelSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
        state.searchSelectedLabels.clear(); // Clear all selections
    };

    // Event listeners for search tab filter radios
    document.querySelectorAll('input[name="search-filter-type"]').forEach(radio => {
        radio.onchange = (event) => {
            elements.searchCustomFilterPanel.style.display = (event.target.value === 'custom') ? 'flex' : 'none';
        };
    });

    // Event listeners for custom filter inputs in search tab
    elements.searchIncorrectCountFilter.oninput = () => {}; // No state update needed here, only on search
    elements.searchAccuracyRangeFilterMin.oninput = () => {};
    elements.searchAccuracyRangeFilterMax.oninput = () => {};

    elements.performRecordSearch.onclick = performRecordSearch;
}

function performRecordSearch() {
    const course = elements.searchCourseSelect.value;
    const selectedLabels = new Set();
    elements.searchLabelSelectionContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        selectedLabels.add(checkbox.value);
    });

    const wordSearchTerm = elements.wordSearchInput.value.toLowerCase(); // 新しい検索語句を取得し、小文字に変換

    console.log('performRecordSearch called for course:', course);
    console.log('Selected Labels for search:', Array.from(selectedLabels));
    console.log('Word Search Term:', wordSearchTerm); // デバッグログを追加

    const filterType = document.querySelector('input[name="search-filter-type"]:checked').value;
    const incorrectCount = parseInt(elements.searchIncorrectCountFilter.value) || 0;
    const accuracyMin = parseInt(elements.accuracyRangeFilterMin.value) || 0;
    const accuracyMax = parseInt(elements.accuracyRangeFilterMax.value) || 100;

    let results = allWordsData[course] || [];
    console.log('Initial results (all words in course):', results.length);

    // Apply word search filter (ADDED)
    if (wordSearchTerm) {
        results = results.filter(word => word.word.toLowerCase().includes(wordSearchTerm));
        console.log('Results after word search filter:', results.length);
    }

    // Apply label filter
    if (selectedLabels.size > 0) {
        const initialLabelFilteredCount = results.length;
        results = results.filter(word => {
            const hasLabel = word.labels && word.labels.some(label => {
                const isSelected = selectedLabels.has(label);
                console.log(`Checking word: ${word.word}, label: "${label}", selected: ${isSelected}`);
                return isSelected;
            });
            return hasLabel;
        });
        console.log('Results after label filter:', results.length);
    } else {
        console.log('No labels selected, skipping label filter.');
    }

    // Apply problem filter
    const finalFilterType = filterType; // Capture for logging
    results = results.filter(word => {
        const stats = state.wordStats[word.word] || { correct: 0, incorrect: 0 };
        const totalAttempts = stats.correct + stats.incorrect;
        const accuracy = totalAttempts > 0 ? (stats.correct / totalAttempts) * 100 : 100;

        let includeWord = true;
        switch (finalFilterType) {
            case 'unseen':
                includeWord = totalAttempts === 0;
                break;
            case 'mistakes':
                includeWord = stats.incorrect > 0;
                break;
            case 'correct':
                includeWord = stats.correct > 0;
                break;
            case 'custom':
                const incorrectCountMatch = stats.incorrect >= incorrectCount;
                const accuracyMatch = accuracy >= accuracyMin && accuracy <= accuracyMax;
                includeWord = incorrectCountMatch && accuracyMatch;
                break;
            case 'all':
            default:
                includeWord = true;
                break;
        }
        // console.log(`Word: ${word.word}, Filter Type: ${finalFilterType}, Stats: ${JSON.stringify(stats)}, Include: ${includeWord}`); // Detailed debug for each word
        return includeWord;
    });
    console.log('Results after problem filter:', results.length); // Debug: final count

    elements.recordSearchHitCount.textContent = results.length;

    let tableHtml = '<table><thead><tr><th>語句</th><th>意味</th></tr></thead><tbody>';
    if (results.length === 0) {
        tableHtml += '<tr><td colspan="2">条件に合う記録が見つかりませんでした。</td></tr>';
    }
    else {
        results.forEach(word => {
            tableHtml += `
                <tr>
                    <td>${word.word}</td>
                    <td>${word.meaning}</td>
                </tr>
            `;
        });
    }
    tableHtml += '</tbody></table>';
    elements.recordSearchResultsTable.innerHTML = tableHtml;
}


function getModeDisplayName(modeKey) {
    const names = {
        'practice_typing': 'タイピング',
        'test_meaning_choice': '意味選択テスト',
        'test_spelling': 'スペルテスト',
        'spelling': 'スペルテスト'
    };
    if (typeof modeKey === 'string' && modeKey.startsWith('practice_')) return names['practice_typing'];
    return names[modeKey] || modeKey || '不明なモード'; // Provide a fallback string
}

// =================================================================
// イベントリスナー設定
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の参照
    elements = {
        loadingScreen: document.getElementById('loading-screen'),
        startScreen: document.getElementById('start-screen'),
        modeSelectionScreen: document.getElementById('mode-selection-screen'),
        gameScreen: document.getElementById('game-screen'),
        testScreen: document.getElementById('test-screen'),
        resultScreen: document.getElementById('result-screen'),
        gradeManagementScreen: document.getElementById('grade-management-screen'),

        // Start Screen
        contentSelect: document.getElementById('content-select'),
        labelSelectionContainer: document.getElementById('label-selection-container'),
        selectAllLabelsBtn: document.getElementById('select-all-labels'),
        deselectAllLabelsBtn: document.getElementById('deselect-all-labels'),
        filterAll: document.getElementById('filter-all'),
        filterUnseen: document.getElementById('filter-unseen'),
        filterMistakes: document.getElementById('filter-mistakes'),
        filterCorrect: document.getElementById('filter-correct'), // Added filterCorrect
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
        startWordTypingWordAudioBtn: document.getElementById('start-word-typing-word-audio-btn'),
        startWordTypingMeaningAudioBtn: document.getElementById('start-word-typing-meaning-audio-btn'),
        startWordTypingNoAudioBtn: document.getElementById('start-word-typing-no-audio-btn'),
        startMeaningTypingMeaningAudioBtn: document.getElementById('start-meaning-typing-meaning-audio-btn'),
        startMeaningTypingWordAudioBtn: document.getElementById('start-meaning-typing-word-audio-btn'),
        startMeaningTypingNoAudioBtn: document.getElementById('start-meaning-typing-no-audio-btn'),


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
        resultCorrectCount: document.getElementById('result-correct-count'), // Added for test results
        resultIncorrectCount: document.getElementById('result-incorrect-count'), // Added for test results
        resultDuration: document.getElementById('result-duration'), // Added for test results
        restartButton: document.getElementById('restart-button'),
        backToTopButton: document.getElementById('back-to-top-button'),

        // Grade Management Screen Tabs
        tabHistory: document.getElementById('tab-history'),
        tabTyping: document.getElementById('tab-typing'),
        tabTest: document.getElementById('tab-test'),
        tabRecordSearch: document.getElementById('tab-record-search'),

        // Tab Contents
        historyTabContent: document.getElementById('history-tab-content'),
        typingTabContent: document.getElementById('typing-tab-content'),
        testTabContent: document.getElementById('test-tab-content'),
        recordSearchTabContent: document.getElementById('record-search-tab-content'),

        // History Tab (re-using historyTableContainer for recent history)
        historyTableContainer: document.getElementById('history-table-container'),
        modeFilterContainer: document.querySelector('#history-tab-content .mode-filter-container'), // Specific to history tab

        // Typing Tab
        typingPersonalBestsContainer: document.getElementById('typing-personal-bests-container'),
        typingDailyChartCanvas: document.getElementById('typing-daily-chart'),
        typingDailyTableContainer: document.getElementById('typing-daily-table-container'),

        // Test Tab
        subTabMeaningTest: document.getElementById('sub-tab-meaning-test'),
        subTabSpellingTest: document.getElementById('sub-tab-spelling-test'),
        meaningTestContent: document.getElementById('meaning-test-content'),
        spellingTestContent: document.getElementById('spelling-test-content'),
        testCourseSelectMeaning: document.getElementById('test-course-select-meaning'),
        meaningTestChartCanvas: document.getElementById('meaning-test-chart'),
        meaningTestLabelStatsTable: document.getElementById('meaning-test-label-stats-table'),
        testCourseSelectSpelling: document.getElementById('test-course-select-spelling'),
        spellingTestChartCanvas: document.getElementById('spelling-test-chart'),
        spellingTestLabelStatsTable: document.getElementById('spelling-test-label-stats-table'),

        // Record Search Tab
        searchCourseSelect: document.getElementById('search-course-select'),
        wordSearchInput: document.getElementById('word-search-input'), // ADDED
        searchLabelSelectionContainer: document.getElementById('search-label-selection-container'),
        searchSelectAllLabels: document.getElementById('search-select-all-labels'),
        searchDeselectAllLabels: document.getElementById('search-deselect-all-labels'),
        searchLabelAccordionHeader: document.getElementById('search-label-accordion-header'),
        searchFilterAll: document.getElementById('search-filter-all'),
        searchFilterUnseen: document.getElementById('search-filter-unseen'),
        searchFilterMistakes: document.getElementById('search-filter-mistakes'),
        searchFilterCorrect: document.getElementById('search-filter-correct'),
        searchFilterCustom: document.getElementById('search-filter-custom'),
        customFilterPanel: document.getElementById('search-custom-filter-panel'), // Corrected ID
        searchIncorrectCountFilter: document.getElementById('search-incorrect-count-filter'), // Corrected ID
        searchAccuracyRangeFilterMin: document.getElementById('search-accuracy-range-filter-min'), // Corrected ID
        searchAccuracyRangeFilterMax: document.getElementById('search-accuracy-range-filter-max'), // Corrected ID
        performRecordSearch: document.getElementById('perform-record-search'),
        recordSearchHitCount: document.getElementById('record-search-hit-count'),
        recordSearchResultsTable: document.getElementById('record-search-results-table'),

        gradeManagementBackButton: document.getElementById('grade-management-back-button'),

        bgmPlayer: document.getElementById('bgm-player')
    };

    // Initial chart setup for typing tab (will be re-initialized when tab is active)
    typingDailyChart = initChart(elements.typingDailyChartCanvas, typingDailyChart);
    meaningTestChart = initChart(elements.meaningTestChartCanvas, meaningTestChart);
    spellingTestChart = initChart(elements.spellingTestChartCanvas, spellingTestChart);

    // Load words data and then show the start screen
    loadWordsData();

    // Event Listeners
    elements.showModeSelectionBtn.addEventListener('click', () => {
        showScreen(elements.modeSelectionScreen);
    });
    elements.modeBackButton.addEventListener('click', () => {
        stopBGM(); // Stop BGM when returning to start screen
        showScreen(elements.startScreen);
    });
    elements.historyButton.addEventListener('click', () => {
        showScreen(elements.gradeManagementScreen);
        updateGradeManagementView('history'); // デフォルトで履歴タブを表示
    });
    elements.gradeManagementBackButton.addEventListener('click', () => {
        stopBGM(); // Stop BGM when returning to start screen
        showScreen(elements.startScreen);
    });
    elements.contentSelect.addEventListener('change', (event) => {
        state.currentCourse = event.target.value; // Update current course in state
        // When course changes, reset selected labels to all for the new course
        state.selectedLabels.clear();
        const newCourseLabels = courseLabels[state.currentCourse] || [];
        newCourseLabels.forEach(label => state.selectedLabels.add(label));

        populateLabelSelection(state.currentCourse); // Re-populate UI with new selections
        saveSettings();
    });
    elements.selectAllLabelsBtn.addEventListener('click', () => {
        state.selectedLabels.clear(); // Clear existing selections
        elements.labelSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(c => {
            c.checked = true;
            state.selectedLabels.add(c.value); // Add all labels to the set
        });
        saveSettings();
    });
    elements.deselectAllLabelsBtn.addEventListener('click', () => {
        elements.labelSelectionContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
        state.selectedLabels.clear(); // Clear all selections
        saveSettings();
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
    elements.startWordTypingWordAudioBtn.addEventListener('click', () => startGame('practice_word_typing_word_audio'));
    elements.startWordTypingMeaningAudioBtn.addEventListener('click', () => startGame('practice_word_typing_meaning_audio'));
    elements.startWordTypingNoAudioBtn.addEventListener('click', () => startGame('practice_word_typing_no_audio'));
    elements.startMeaningTypingMeaningAudioBtn.addEventListener('click', () => startGame('practice_meaning_recall_meaning_audio'));
    elements.startMeaningTypingWordAudioBtn.addEventListener('click', () => startGame('practice_meaning_recall_word_audio'));
    elements.startMeaningTypingNoAudioBtn.addEventListener('click', () => startGame('practice_meaning_recall_no_audio'));


    elements.typingInput.addEventListener('input', handleTypingInput);
    document.addEventListener('keydown', (event) => {
        if (elements.gameScreen.classList.contains('active') && event.key.length === 1) {
            elements.typingInput.focus();
        } else if (elements.testScreen.classList.contains('active') && state.testMode === 'spelling' && event.key.length === 1) {
            elements.testTypingInput.focus();
        }
    });
    elements.testTypingInput.addEventListener('input', (event) => {
        if (!state.currentWord) return;

        // Update the current input state with the full content of the input box
        state.currentInput = elements.testTypingInput.value;

        // Update the display to show the typed characters in the blanks, without giving feedback
        elements.testInputDisplay.innerHTML = generateSpellingTestDisplay(state.currentWord.word, state.currentInput);

        // Enable or disable the submit button based on whether there is input
        elements.testSubmitButton.disabled = state.currentInput.length === 0;
    });
    elements.testTypingInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !elements.testSubmitButton.disabled) {
            event.preventDefault(); // フォームのデフォルト送信を防ぐ
            elements.testSubmitButton.click(); // 送信ボタンのクリックイベントを発火
        }
    });

    elements.testSubmitButton.addEventListener('click', () => {
        const isCorrect = checkSpellingTestAnswer(state.currentInput, state.currentWord.word);
        
        // Add feedback class to the input display
        elements.testInputDisplay.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        playSound(isCorrect ? 'correct' : 'incorrect');
        playWordAudio(state.currentWord); // 正解を読み上げる
        updateStats(state.currentWord, isCorrect);
        
        if (isCorrect) {
            state.testCorrectCount++;
        } else {
            state.testIncorrectCount++;
            // Show the correct answer if wrong
            elements.testWordDisplay.textContent = `正解: ${state.currentWord.word}`;
            elements.testWordDisplay.style.display = 'block';
        }

        // Disable input and button after submission
        elements.testTypingInput.disabled = true;
        elements.testSubmitButton.disabled = true;

        // Wait a moment before proceeding to the next word or ending the test
        setTimeout(() => {
            // Reset feedback styles and displays
            elements.testInputDisplay.classList.remove('correct', 'incorrect');
            elements.testWordDisplay.style.display = 'none';
            elements.testTypingInput.disabled = false;

            state.testCurrentIndex++;
            if (state.testCurrentIndex < state.testWords.length) {
                state.currentWord = state.testWords[state.testCurrentIndex];
                state.currentInput = '';
                state.nextCharIndex = 0;
                elements.testTypingInput.value = '';
                elements.testMeaningDisplay.textContent = state.currentWord.meaning;
                speakMeaning(state.currentWord.meaning); // 読み上げ機能を追加
                elements.testInputDisplay.innerHTML = generateSpellingTestDisplay(state.currentWord.word, '');
                elements.testSubmitButton.disabled = true;
                elements.testTypingInput.focus();
            } else {
                endTest();
            }
        }, 2000); // 2-second delay to show feedback
    });
    elements.testFinishButton.addEventListener('click', endTest);
    elements.restartButton.addEventListener('click', () => {
        if (state.gameMode) {
            if (state.gameMode.startsWith('practice_')) {
                startGame(state.gameMode);
            } else {
                startTest(state.testMode);
            }
        } else {
            showScreen(elements.startScreen);
        }
    });
    elements.backToTopButton.addEventListener('click', () => {
        stopBGM(); // Stop BGM when returning to top
        showScreen(elements.startScreen);
    });
    elements.exportDataButton.addEventListener('click', () => {
        const dataToExport = {
            history: state.history,
            dailyStats: state.dailyStats,
            wordStats: state.wordStats,
            labelStats: state.labelStats,
            personalBests: state.personalBests
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `typing_combo_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    elements.importDataButton.addEventListener('click', () => elements.importFileInput.click());
    elements.importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Basic validation
                if (importedData.history && importedData.wordStats) {
                    state.history = importedData.history || [];
                    state.dailyStats = importedData.dailyStats || {};
                    state.wordStats = importedData.wordStats || {};
                    state.labelStats = importedData.labelStats || {};
                    state.personalBests = importedData.personalBests || {};
                    saveUserData();
                    alert('データが正常に読み込まれました。');
                    // Refresh views
                    updateGradeManagementView('history');
                } else {
                    alert('無効なデータファイルです。');
                }
            } catch (error) {
                alert('ファイルの読み込み中にエラーが発生しました。');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    });
    elements.clearDataButton.addEventListener('click', () => {
        if (confirm('本当にすべての成績データを削除しますか？この操作は元に戻せません。')) {
            localStorage.removeItem('typingComboHistory');
            localStorage.removeItem('typingComboDailyStats');
            localStorage.removeItem('typingComboWordStats');
            localStorage.removeItem('typingComboLabelStats');
            localStorage.removeItem('typingComboPersonalBests');
            localStorage.removeItem('typingComboSettings');
            // Reset state variables
            Object.assign(state, {
                history: [], dailyStats: {}, wordStats: {}, labelStats: {}, personalBests: {},
                selectedLabels: new Set(), filterType: 'all',
                customFilter: { incorrectCount: 0, accuracyMin: 0, accuracyMax: 100 }
            });
            alert('データが削除されました。');
            // Reload settings to apply defaults
            loadSettings();
            // Refresh views
            updateGradeManagementView('history');
        }
    });

    // Grade Management Tab Listeners
    elements.tabHistory.addEventListener('click', () => updateGradeManagementView('history'));
    elements.tabTyping.addEventListener('click', () => updateGradeManagementView('typing'));
    elements.tabTest.addEventListener('click', () => updateGradeManagementView('test'));
    elements.tabRecordSearch.addEventListener('click', () => updateGradeManagementView('record-search'));

    // History Tab Filter Listeners
    document.querySelectorAll('input[name="history-mode-filter"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            renderRecentHistory(event.target.value);
        });
    });

    // Test Tab Sub-Tab Listeners
    elements.subTabMeaningTest.addEventListener('click', () => updateTestSubTab('meaning-test'));
    elements.subTabSpellingTest.addEventListener('click', () => updateTestSubTab('spelling-test'));

    // Accordion Listener
    elements.labelAccordionHeader.addEventListener('click', () => {
        elements.labelAccordionContent.classList.toggle('open');
        elements.accordionIcon.textContent = elements.labelAccordionContent.classList.contains('open') ? '▲' : '▼';
    });

    // Search Accordion Listener
    elements.searchLabelAccordionHeader.addEventListener('click', () => {
        const content = elements.searchLabelAccordionHeader.nextElementSibling;
        content.classList.toggle('open');
        const icon = elements.searchLabelAccordionHeader.querySelector('.accordion-icon');
        icon.textContent = content.classList.contains('open') ? '▲' : '▼';
    });
});
