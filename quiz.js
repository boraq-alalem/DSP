document.addEventListener('DOMContentLoaded', () => {
    const quizSelectionForm = document.getElementById('quiz-selection');
    const quizContainer = document.getElementById('quizContainer');
    const quizForm = document.getElementById('quizForm');
    const submitButton = quizForm.querySelector('button[type="submit"]');
    const retryButton = document.getElementById('retryButton');

    const scoreProgressModalElement = document.getElementById('scoreProgressModal');
    const progressCircle = document.getElementById('progressCircle');
    const scoreTextCircle = document.getElementById('scoreTextCircle');
    const scoreProgressModal = new bootstrap.Modal(scoreProgressModalElement);

    let questions = [];

    async function loadQuestions(quizFile) {
        try {
            const response = await fetch(quizFile);
            const data = await response.json();
            questions = data.questions || [];

            // ✅ إصلاح correctAnswer إذا كانت حرفًا مثل "A", "B", "C"
            questions = questions.map(q => {
                if (q.type === 'mcq' && typeof q.correctAnswer === 'string' && q.correctAnswer.length === 1) {
                    const index = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(q.correctAnswer.toUpperCase());
                    if (index >= 0 && q.options && q.options[index]) {
                        return {
                            ...q,
                            correctAnswer: q.options[index]
                        };
                    }
                }
                return q;
            });

            renderQuestions();
        } catch (error) {
            console.error('Error fetching quiz questions:', error);
            quizContainer.innerHTML = '<p>فشل تحميل الأسئلة. حاول مرة أخرى لاحقًا.</p>';
        }
    }

    function renderQuestions() {
        quizContainer.innerHTML = questions.map((q, index) => {
            if (q.type === 'mcq') {
                return `
                    <div class="question-card">
                        <h5>${index + 1}. ${q.question}</h5>
                        ${q.options.map(option => `
                            <div class="form-check option-container">
                                <input class="form-check-input" type="radio" name="q${q.id}" id="q${q.id}-${option}" value="${option}">
                                <label class="form-check-label" for="q${q.id}-${option}">${option}</label>
                            </div>
                        `).join('')}
                    </div>`;
            } else if (q.type === 'tf') {
                return `
                    <div class="question-card">
                        <h5>${index + 1}. ${q.question}</h5>
                        <div class="form-check option-container">
                            <input class="form-check-input" type="radio" name="q${q.id}" id="q${q.id}-true" value="true">
                            <label class="form-check-label" for="q${q.id}-true">True</label>
                        </div>
                        <div class="form-check option-container">
                            <input class="form-check-input" type="radio" name="q${q.id}" id="q${q.id}-false" value="false">
                            <label class="form-check-label" for="q${q.id}-false">False</label>
                        </div>
                    </div>`;
            }
        }).join('');
    }

    quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let score = 0;
        const totalQuestions = questions.length;

        questions.forEach((q) => {
            const selected = quizContainer.querySelector(`input[name="q${q.id}"]:checked`);
            const userAnswer = selected ? selected.value.trim().toLowerCase() : null;
            const correctAnswer = String(q.correctAnswer).trim().toLowerCase();

            if (userAnswer === correctAnswer) score++;
        });

        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
        const degree = (percentage / 100) * 360;
        progressCircle.style.background = `conic-gradient(#0d6efd ${degree}deg, #e9ecef ${degree}deg)`;
        scoreTextCircle.innerHTML = `${score}<span style="font-size: 0.8rem; display: block;">/${totalQuestions}</span>`;
        scoreProgressModal.show();

        scoreProgressModalElement.addEventListener('hidden.bs.modal', () => {
            const questionCards = quizContainer.querySelectorAll('.question-card');
            questions.forEach((q, index) => {
                const card = questionCards[index];
                const inputs = card.querySelectorAll(`input[name="q${q.id}"]`);
                const selected = card.querySelector(`input[name="q${q.id}"]:checked`);
                const userAnswer = selected ? selected.value.trim().toLowerCase() : null;
                const correctAnswer = String(q.correctAnswer).trim().toLowerCase();
                const isCorrect = userAnswer === correctAnswer;

                inputs.forEach(input => {
                    input.disabled = true;
                    const wrapper = input.closest('.option-container');
                    if (wrapper) wrapper.classList.remove('option-container-hover');
                });

                inputs.forEach(input => {
                    const wrapper = input.closest('.option-container');
                    if (!wrapper) return;

                    if (input.value.trim().toLowerCase() === correctAnswer) {
                        wrapper.classList.add('option-correct');
                    }
                    if (selected && selected === input && !isCorrect) {
                        wrapper.classList.add('option-incorrect');
                    }
                });

                if (!isCorrect && !card.querySelector('.explanation')) {
                    const explanationDiv = document.createElement('div');
                    explanationDiv.classList.add('explanation', 'bg-light', 'mt-3');
                    explanationDiv.innerHTML = `
                        <strong>الإجابة الصحيحة:</strong> ${q.correctAnswer}
                        <br>
                        <strong>الشرح:</strong> ${q.explanation}
                    `;
                    card.appendChild(explanationDiv);
                }
            });

            submitButton.classList.add('d-none');
            retryButton.classList.remove('d-none');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, { once: true });
    });

    quizSelectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedQuiz = document.querySelector('input[name="quiz"]:checked').value;
        // إعادة تهيئة واجهة المستخدم وحالة الأزرار
        retryButton.classList.add('d-none');
        submitButton.classList.remove('d-none');
        // إزالة أي نتائج أو ألوان سابقة من الأسئلة
        quizContainer.innerHTML = '';
        // تحميل الأسئلة الجديدة
        loadQuestions(selectedQuiz);
    });

    // ❌ لا نحمل أي اختبار افتراضياً
});
