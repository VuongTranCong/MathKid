/**
 * MathKid App - Main Application Logic
 * Handles UI interactions, game state, and user experience
 */

class MathKidApp {
    constructor() {
        this.currentProblem = null;
        this.userAnswer = '';
        this.gameStats = {
            correct: 0,
            total: 0,
            streak: 0
        };

        this.encouragementMessages = {
            correct: [
                "🎉 Amazing job!",
                "⭐ You're a math star!",
                "🏆 Fantastic!",
                "🎯 Perfect!",
                "🌟 Brilliant work!",
                "👏 Excellent!",
                "🚀 You're on fire!",
                "💯 Outstanding!",
                "🎪 Awesome!",
                "🌈 Super!"
            ],
            incorrect: [
                "🤔 Think again!",
                "💪 You've got this!",
                "🎯 Try once more!",
                "⭐ Keep trying!",
                "🌟 Don't give up!",
                "💡 Think it through!",
                "🔄 Give it another try!",
                "🧠 Use your brain!",
                "🎈 You can do it!",
                "🌟 Keep going!"
            ],
            streak: [
                "🔥 You're on a roll!",
                "⚡ Lightning fast!",
                "🎪 Math wizard!",
                "🦄 Incredible streak!",
                "🌈 You're unstoppable!"
            ]
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadGameStats();
        this.generateNewProblem();
        this.updateProgressDisplay();

        // Register service worker if supported
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/MathKid/sw.js')
                .then(reg => console.log('SW registered:', reg))
                .catch(err => console.log('SW registration failed:', err));
        }
    }

    setupEventListeners() {
        // Number pad buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNumberPadClick(e));
        });

        // Action buttons
        document.getElementById('newProblemBtn').addEventListener('click', () => {
            this.generateNewProblem();
        });

        document.getElementById('resetProgressBtn').addEventListener('click', () => {
            this.resetProgress();
        });

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsAccess();
        });

        // Settings access modal
        document.getElementById('accessSubmitBtn').addEventListener('click', () => {
            this.checkSettingsAccess();
        });

        document.getElementById('accessCancelBtn').addEventListener('click', () => {
            this.closeSettingsAccess();
        });

        // Enter key for settings access
        document.getElementById('accessAnswer').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkSettingsAccess();
            }
        });

        // Keyboard support for main game
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });

        // Prevent zoom on double tap - only on specific elements, not globally
        document.querySelectorAll('.number-btn, .action-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                // Add touch feedback
                btn.style.transform = 'scale(0.95)';
            });
            btn.addEventListener('touchend', (e) => {
                // Remove touch feedback
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);
            });
        });
    }

    handleNumberPadClick(e) {
        const btn = e.target;
        const number = btn.dataset.number;
        const action = btn.dataset.action;

        // Add click animation
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 150);

        if (number !== undefined) {
            this.addDigit(number);
        } else if (action === 'clear') {
            this.clearAnswer();
        } else if (action === 'submit') {
            this.submitAnswer();
        }
    }

    handleKeyboardInput(e) {
        // Only handle keyboard in main game (not in modal)
        if (!document.getElementById('settingsAccessModal').classList.contains('hidden')) {
            return;
        }

        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            this.addDigit(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            this.clearAnswer();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.submitAnswer();
        }
    }

    addDigit(digit) {
        // Limit answer length to prevent overflow
        if (this.userAnswer.length < 4) {
            this.userAnswer += digit;
            this.updateAnswerDisplay();
        }
    }

    clearAnswer() {
        this.userAnswer = '';
        this.updateAnswerDisplay();
        this.clearFeedback();
    }

    updateAnswerDisplay() {
        const answerElement = document.getElementById('userAnswer');
        answerElement.textContent = this.userAnswer || '?';

        // Add typing animation
        answerElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            answerElement.style.transform = '';
        }, 200);
    }

    submitAnswer() {
        if (!this.userAnswer) {
            this.showFeedback('Please enter an answer first!', 'incorrect');
            return;
        }

        const userNum = parseInt(this.userAnswer);
        const correct = userNum === this.currentProblem.answer;

        this.gameStats.total++;

        if (correct) {
            this.gameStats.correct++;
            this.gameStats.streak++;
            this.handleCorrectAnswer();
        } else {
            this.gameStats.streak = 0;
            this.handleIncorrectAnswer();
        }

        this.saveGameStats();
        this.updateProgressDisplay();
    }

    handleCorrectAnswer() {
        let message;

        if (this.gameStats.streak >= 5) {
            message = this.getRandomMessage('streak');
        } else {
            message = this.getRandomMessage('correct');
        }

        this.showFeedback(message, 'correct');

        // Auto-generate new problem after correct answer
        setTimeout(() => {
            this.generateNewProblem();
        }, 2000);
    }

    handleIncorrectAnswer() {
        const message = this.getRandomMessage('incorrect');
        this.showFeedback(message, 'incorrect');

        // Clear the user's answer so they can try again or get new problem
        setTimeout(() => {
            this.clearAnswer();
        }, 3000);
    }

    getRandomMessage(type) {
        const messages = this.encouragementMessages[type];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    showFeedback(message, type) {
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.textContent = message;
        feedbackElement.className = `feedback-message ${type}`;

        // Add bounce animation
        feedbackElement.style.animation = 'none';
        feedbackElement.offsetHeight; // Trigger reflow
        feedbackElement.style.animation = 'bounce 0.5s ease';
    }

    clearFeedback() {
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.className = 'feedback-message empty';
        feedbackElement.textContent = '';
    }

    generateNewProblem() {
        if (!window.MathEngine) {
            console.error('MathEngine not loaded');
            return;
        }

        this.currentProblem = window.MathEngine.generateProblem();
        this.displayProblem();
        this.clearAnswer();
        this.clearFeedback();
    }

    displayProblem() {
        if (!this.currentProblem) return;

        document.getElementById('firstNumber').textContent = this.currentProblem.num1;
        document.getElementById('operator').textContent = this.currentProblem.operator;
        document.getElementById('secondNumber').textContent = this.currentProblem.num2;

        // Add problem change animation
        const problemDisplay = document.querySelector('.problem-display');
        problemDisplay.style.transform = 'scale(0.95)';
        setTimeout(() => {
            problemDisplay.style.transform = '';
        }, 200);
    }

    updateProgressDisplay() {
        document.getElementById('correctCount').textContent = this.gameStats.correct;
        document.getElementById('totalCount').textContent = this.gameStats.total;

        // Update progress bar
        const progressPercent = this.gameStats.total > 0 ?
            (this.gameStats.correct / this.gameStats.total) * 100 : 0;
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
    }

    resetProgress() {
        if (confirm('Are you sure you want to reset all progress?')) {
            this.gameStats = { correct: 0, total: 0, streak: 0 };
            this.saveGameStats();
            this.updateProgressDisplay();
            this.generateNewProblem();
            this.showFeedback('Progress reset! 🔄', 'correct');
        }
    }

    loadGameStats() {
        if (!window.Storage) return;

        const savedStats = window.Storage.get('gameStats');
        if (savedStats) {
            this.gameStats = { ...this.gameStats, ...savedStats };
        }
    }

    saveGameStats() {
        if (window.Storage) {
            window.Storage.set('gameStats', this.gameStats);
        }
    }

    // Settings Access Modal
    openSettingsAccess() {
        const modal = document.getElementById('settingsAccessModal');
        const accessAnswer = document.getElementById('accessAnswer');

        // Generate a simple multiplication problem for parent access
        const num1 = Math.floor(Math.random() * 8) + 5; // 5-12
        const num2 = Math.floor(Math.random() * 8) + 5; // 5-12

        document.getElementById('accessNumber1').textContent = num1;
        document.getElementById('accessNumber2').textContent = num2;
        this.accessProblemAnswer = num1 * num2;

        modal.classList.remove('hidden');
        accessAnswer.value = '';
        accessAnswer.focus();
    }

    closeSettingsAccess() {
        document.getElementById('settingsAccessModal').classList.add('hidden');
    }

    checkSettingsAccess() {
        const userAnswer = parseInt(document.getElementById('accessAnswer').value);

        if (userAnswer === this.accessProblemAnswer) {
            this.closeSettingsAccess();
            // Redirect to settings page
            window.location.href = 'settings.html';
        } else {
            alert('Incorrect answer. This area is for parents only.');
            document.getElementById('accessAnswer').value = '';
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mathKidApp = new MathKidApp();
});

// Add CSS animation keyframes via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce {
        0%, 20%, 60%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        80% { transform: translateY(-5px); }
    }
`;
document.head.appendChild(style);