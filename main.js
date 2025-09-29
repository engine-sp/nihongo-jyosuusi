document.addEventListener('DOMContentLoaded', () => {
            // --- STATE ---
            let allCountersData = null;
            let practiceScope = []; // Array of counter keys, e.g., ['つ', '人']
            let quizQuestions = [];
            let userResults = [];
            let currentQuestionIndex = 0;
            const TOTAL_QUESTIONS = 10;

            // --- UI ELEMENTS ---
            const startScreen = document.getElementById('start-screen');
            const practiceScreen = document.getElementById('practice-screen');
            const endScreen = document.getElementById('end-screen');
            const scopeModal = document.getElementById('scope-modal');
            const scopeDisplay = document.getElementById('scope-display');
            const scopeCheckboxes = document.getElementById('scope-checkboxes');
            const scopeError = document.getElementById('scope-error');
            
            const modifyScopeBtn = document.getElementById('modify-scope-btn');
            const startQuizBtn = document.getElementById('start-quiz-btn');
            const selectAllBtn = document.getElementById('select-all-btn');
            const deselectAllBtn = document.getElementById('deselect-all-btn');
            const confirmScopeBtn = document.getElementById('confirm-scope-btn');
            const cancelScopeBtn = document.getElementById('cancel-scope-btn');

            const progressText = document.getElementById('progress-text');
            const categoryDisplay = document.getElementById('category-display');
            const iconDisplay = document.getElementById('icon-display');
            const kanjiDisplay = document.getElementById('kanji-display');
            const statusBar = document.getElementById('status-bar');
            const answerInput = document.getElementById('answer-input');
            const submitAnswerBtn = document.getElementById('submit-answer-btn');
            const stopQuizBtn = document.getElementById('stop-quiz-btn');

            const nextQuestionBtn = document.getElementById('next-question-btn');

            const finalScore = document.getElementById('final-score');
            const reviewBody = document.getElementById('review-body');
            const restartBtn = document.getElementById('restart-btn');

            // --- FUNCTIONS ---

            function showScreen(screenId) {
                [startScreen, practiceScreen, endScreen].forEach(screen => {
                    screen.classList.add('hidden');
                });
                document.getElementById(screenId).classList.remove('hidden');

                // Dynamically adjust body classes for scrolling on end screen
                if (screenId === 'end-screen') {
                    document.body.classList.remove('items-center');
                    document.body.classList.add('py-12');
                } else {
                    document.body.classList.add('items-center');
                    document.body.classList.remove('py-12');
                }
            }

            function openScopeModal() {
                scopeCheckboxes.innerHTML = '';
                for (const key in allCountersData) {
                    const counter = allCountersData[key];
                    const isChecked = practiceScope.includes(key);
                    scopeCheckboxes.innerHTML += `
                        <label class="flex items-start">
                            <input type="checkbox" data-key="${key}" class="h-5 w-5 text-blue-600 border-gray-300 rounded flex-shrink-0" ${isChecked ? 'checked' : ''}>
                            <span class="ml-2 text-gray-700"><span class="block">${counter.name.ch}</span><small class="block">${counter.name.en}</small></span>
                        </label>
                    `;
                }
                scopeModal.classList.remove('hidden');
            }

            function updateScope() {
                const selectedCheckboxes = scopeCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
                if (selectedCheckboxes.length === 0) {
                    scopeError.classList.remove('hidden');
                    return;
                }
                
                practiceScope = Array.from(selectedCheckboxes).map(cb => cb.dataset.key);
                
                if (practiceScope.length === Object.keys(allCountersData).length) {
                    scopeDisplay.textContent = '全部';
                } else {
                    scopeDisplay.textContent = practiceScope.map(key => allCountersData[key].name.ch).join(', ');
                }

                scopeError.classList.add('hidden');
                scopeModal.classList.add('hidden');
            }
            
            function startQuiz() {
                // Flatten questions from selected scope
                let questionPool = [];
                practiceScope.forEach(key => {
                    const category = allCountersData[key];
                    const itemsWithCategory = category.items.map(item => ({
                        ...item,
                        categoryIcon: category.icon,
                        categoryName: category.name
                    }));
                    questionPool.push(...itemsWithCategory);
                });

                // Shuffle and pick 10 questions
                quizQuestions = questionPool.sort(() => 0.5 - Math.random()).slice(0, TOTAL_QUESTIONS);
                currentQuestionIndex = 0;
                userResults = [];
                
                showScreen('practice-screen');
                displayQuestion();
            }

            function displayQuestion() {
                if (currentQuestionIndex >= quizQuestions.length) {
                    endQuiz();
                    return;
                }

                const q = quizQuestions[currentQuestionIndex];
                progressText.textContent = `第${currentQuestionIndex + 1}題 / 共${quizQuestions.length}題`;
                categoryDisplay.textContent = `${q.categoryName.ch} (${q.categoryName.en})`;
                iconDisplay.textContent = q.categoryIcon[Math.floor(Math.random() * q.categoryIcon.length)];
                kanjiDisplay.textContent = q.kanji;
                statusBar.innerHTML = '&nbsp;';
                answerInput.value = '';
                answerInput.disabled = false;
                submitAnswerBtn.disabled = false;
                submitAnswerBtn.classList.remove('hidden');
                nextQuestionBtn.classList.add('hidden');
                answerInput.focus();
            }

            function checkAnswer() {
                const userAnswer = answerInput.value.trim();
                if (!userAnswer) return;

                const currentQuestion = quizQuestions[currentQuestionIndex];
                const isCorrect = currentQuestion.hiragana.includes(userAnswer);
                
                answerInput.disabled = true;
                submitAnswerBtn.disabled = true;

                userResults.push({
                    question: currentQuestion,
                    userAnswer: userAnswer,
                    isCorrect: isCorrect
                });

                // Animate icon
                iconDisplay.classList.remove('animate-joy', 'animate-sad');
                void iconDisplay.offsetWidth; // Force reflow
                iconDisplay.classList.add(isCorrect ? 'animate-joy' : 'animate-sad');

                if (isCorrect) {
                    statusBar.textContent = '答對了！';
                    statusBar.className = 'h-8 mb-4 text-lg font-semibold text-green-500';
                } else {
                    statusBar.innerHTML = `答錯了... 正確答案是: <span class="font-bold">${currentQuestion.hiragana.join(' or ')}</span>`;
                    statusBar.className = 'h-8 mb-4 text-lg font-semibold text-red-500';
                }

                submitAnswerBtn.classList.add('hidden');
                nextQuestionBtn.classList.remove('hidden');
            }

            function endQuiz() {
                const correctCount = userResults.filter(r => r.isCorrect).length;
                finalScore.textContent = `您答對了 ${correctCount} / ${quizQuestions.length} 題！`;

                reviewBody.innerHTML = '';
                userResults.forEach(result => {
                    const row = document.createElement('tr');
                    row.className = result.isCorrect ? 'bg-green-100' : 'bg-red-100';
                    
                    let yourAnswerHTML = result.userAnswer;
                    if (!result.isCorrect) {
                        // Simple highlight for incorrect answer
                        yourAnswerHTML = `<span class="font-bold text-red-700">${result.userAnswer}</span>`;
                    }

                    row.innerHTML = `
                        <td class="border px-4 py-2" data-label="題目">${result.question.kanji}</td>
                        <td class="border px-4 py-2" data-label="您的答案">${yourAnswerHTML}</td>
                        <td class="border px-4 py-2 text-center" data-label="正解？">${result.isCorrect ? '✅' : '❌'}</td>
                        <td class="border px-4 py-2" data-label="正確答案">${result.question.hiragana.join(', ')}</td>
                    `;
                    reviewBody.appendChild(row);
                });

                showScreen('end-screen');
            }
            
            function resetApp() {
                practiceScope = Object.keys(allCountersData);
                scopeDisplay.textContent = '全部';
                showScreen('start-screen');
            }

            // --- EVENT LISTENERS ---
            modifyScopeBtn.addEventListener('click', openScopeModal);
            
            cancelScopeBtn.addEventListener('click', () => {
                scopeError.classList.add('hidden');
                scopeModal.classList.add('hidden');
            });

            selectAllBtn.addEventListener('click', () => {
                scopeCheckboxes.querySelectorAll('input').forEach(cb => cb.checked = true);
            });

            deselectAllBtn.addEventListener('click', () => {
                scopeCheckboxes.querySelectorAll('input').forEach(cb => cb.checked = false);
            });
            
            confirmScopeBtn.addEventListener('click', updateScope);
            startQuizBtn.addEventListener('click', startQuiz);
            
            submitAnswerBtn.addEventListener('click', checkAnswer);
            answerInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    checkAnswer();
                }
            });

            stopQuizBtn.addEventListener('click', endQuiz);
            restartBtn.addEventListener('click', resetApp);

            nextQuestionBtn.addEventListener('click', () => {
                currentQuestionIndex++;
                displayQuestion();
            });

            // --- INITIALIZATION ---
            fetch('jyosuushi.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error("讀取 jyosuushi.json 失敗。");
                    }
                    return response.json();
                })
                .then(data => {
                    allCountersData = data.counters;
                    // Default scope is all categories
                    practiceScope = Object.keys(allCountersData);
                    startQuizBtn.disabled = false;
                })
                .catch(error => {
                    console.error(error);

                    document.getElementById('app').innerHTML = `<div class="text-red-500 font-bold text-center">
                        錯誤：<br>${error.message}<br> 無法初始化應用程式。
                    </div>`;
                });
        });