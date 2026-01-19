/**
 * MathKid Settings - Parent Settings Panel Logic
 * Handles settings form interactions, validation, and data management
 */

class SettingsManager {
    constructor() {
        this.currentSettings = {};
        this.autoSaveTimeout = null;

        this.init();
    }

    init() {
        this.loadCurrentSettings();
        this.setupEventListeners();
        this.updateUI();
        this.loadProgressStats();
        this.generatePreviewProblems();
    }

    loadCurrentSettings() {
        if (window.Storage) {
            this.currentSettings = window.Storage.getMathSettings();
        } else {
            // Fallback defaults if storage not available
            this.currentSettings = {
                minNumber: 20,
                maxNumber: 40,
                operations: ['addition', 'subtraction'],
                sessionLength: null,
                difficulty: 'easy'
            };
        }
    }

    setupEventListeners() {
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.handleBack();
        });

        // Reset all button
        document.getElementById('resetAllBtn').addEventListener('click', () => {
            this.handleResetAll();
        });

        // Range sliders and number inputs
        this.setupRangeControls();

        // Operation checkboxes
        document.querySelectorAll('input[name="operations"]').forEach(input => {
            input.addEventListener('change', () => {
                this.handleOperationChange();
                this.generatePreviewProblems();
                this.autoSave();
            });
        });

        // Difficulty radio buttons
        document.querySelectorAll('input[name="difficulty"]').forEach(input => {
            input.addEventListener('change', () => {
                this.autoSave();
            });
        });

        // Session type radio buttons
        document.querySelectorAll('input[name="sessionType"]').forEach(input => {
            input.addEventListener('change', () => {
                this.handleSessionTypeChange();
                this.autoSave();
            });
        });

        // Session length controls
        this.setupSessionLengthControls();

        // Progress management buttons
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.handleExportData();
        });

        document.getElementById('resetProgressBtn').addEventListener('click', () => {
            this.handleResetProgress();
        });

        // Footer buttons
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.handleCancel();
        });

        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        // Confirmation modal (still needed for reset operations)
        this.setupConfirmationModal();
    }

    setupRangeControls() {
        // Min number controls
        const minRange = document.getElementById('minNumberRange');
        const minInput = document.getElementById('minNumber');
        const minDisplay = document.getElementById('minNumberDisplay');

        const updateMinNumber = (value) => {
            const numValue = parseInt(value);
            minRange.value = numValue;
            minInput.value = numValue;
            minDisplay.textContent = numValue;

            // Ensure max is always >= min
            const maxRange = document.getElementById('maxNumberRange');
            const maxInput = document.getElementById('maxNumber');
            const maxDisplay = document.getElementById('maxNumberDisplay');

            if (parseInt(maxInput.value) < numValue) {
                const newMax = Math.max(numValue + 1, numValue);
                maxRange.value = newMax;
                maxInput.value = newMax;
                maxDisplay.textContent = newMax;
            }

            maxRange.min = numValue + 1;
            maxInput.min = numValue + 1;

            this.generatePreviewProblems();
            this.autoSave();
        };

        minRange.addEventListener('input', (e) => updateMinNumber(e.target.value));
        minInput.addEventListener('input', (e) => updateMinNumber(e.target.value));

        // Max number controls
        const maxRange = document.getElementById('maxNumberRange');
        const maxInput = document.getElementById('maxNumber');
        const maxDisplay = document.getElementById('maxNumberDisplay');

        const updateMaxNumber = (value) => {
            const numValue = parseInt(value);
            maxRange.value = numValue;
            maxInput.value = numValue;
            maxDisplay.textContent = numValue;

            this.generatePreviewProblems();
            this.autoSave();
        };

        maxRange.addEventListener('input', (e) => updateMaxNumber(e.target.value));
        maxInput.addEventListener('input', (e) => updateMaxNumber(e.target.value));
    }

    setupSessionLengthControls() {
        const lengthRange = document.getElementById('sessionLengthRange');
        const lengthInput = document.getElementById('sessionLength');
        const lengthDisplay = document.getElementById('sessionLengthDisplay');

        const updateSessionLength = (value) => {
            const numValue = parseInt(value);
            lengthRange.value = numValue;
            lengthInput.value = numValue;
            lengthDisplay.textContent = numValue;
            this.autoSave();
        };

        lengthRange.addEventListener('input', (e) => updateSessionLength(e.target.value));
        lengthInput.addEventListener('input', (e) => updateSessionLength(e.target.value));
    }

    setupConfirmationModal() {
        const modal = document.getElementById('confirmModal');
        const cancelBtn = document.getElementById('confirmCancel');
        const okBtn = document.getElementById('confirmOk');

        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // OK button handler is set dynamically based on action
    }

    updateUI() {
        // Update number ranges
        document.getElementById('minNumberRange').value = this.currentSettings.minNumber;
        document.getElementById('minNumber').value = this.currentSettings.minNumber;
        document.getElementById('minNumberDisplay').textContent = this.currentSettings.minNumber;

        document.getElementById('maxNumberRange').value = this.currentSettings.maxNumber;
        document.getElementById('maxNumber').value = this.currentSettings.maxNumber;
        document.getElementById('maxNumberDisplay').textContent = this.currentSettings.maxNumber;

        // Update max range minimum constraint
        document.getElementById('maxNumberRange').min = this.currentSettings.minNumber + 1;
        document.getElementById('maxNumber').min = this.currentSettings.minNumber + 1;

        // Update operations
        document.querySelectorAll('input[name="operations"]').forEach(input => {
            input.checked = this.currentSettings.operations.includes(input.value);
        });

        // Update difficulty
        document.getElementById(`${this.currentSettings.difficulty}Difficulty`).checked = true;

        // Update session settings
        if (this.currentSettings.sessionLength === null) {
            document.getElementById('unlimitedSession').checked = true;
            document.getElementById('sessionLengthControl').style.display = 'none';
        } else {
            document.getElementById('limitedSession').checked = true;
            document.getElementById('sessionLengthControl').style.display = 'block';
            document.getElementById('sessionLengthRange').value = this.currentSettings.sessionLength;
            document.getElementById('sessionLength').value = this.currentSettings.sessionLength;
            document.getElementById('sessionLengthDisplay').textContent = this.currentSettings.sessionLength;
        }
    }

    handleOperationChange() {
        const checkedOps = Array.from(document.querySelectorAll('input[name="operations"]:checked'))
            .map(input => input.value);

        // Ensure at least one operation is selected
        if (checkedOps.length === 0) {
            // Re-check the first available operation
            document.getElementById('additionOp').checked = true;
        }

        // Handle mixed operation logic
        const mixedCheckbox = document.getElementById('mixedOp');
        const otherOps = ['additionOp', 'subtractionOp', 'multiplicationOp'];

        if (mixedCheckbox.checked) {
            // If mixed is selected, uncheck others
            otherOps.forEach(id => {
                document.getElementById(id).checked = false;
            });
        } else {
            // If any specific operation is selected, uncheck mixed
            const anyOtherChecked = otherOps.some(id => document.getElementById(id).checked);
            if (anyOtherChecked) {
                mixedCheckbox.checked = false;
            }
        }
    }

    handleSessionTypeChange() {
        const unlimited = document.getElementById('unlimitedSession').checked;
        const control = document.getElementById('sessionLengthControl');

        if (unlimited) {
            control.style.display = 'none';
        } else {
            control.style.display = 'block';
        }
    }

    generatePreviewProblems() {
        const minNum = parseInt(document.getElementById('minNumber').value) || 20;
        const maxNum = parseInt(document.getElementById('maxNumber').value) || 40;
        const checkedOps = Array.from(document.querySelectorAll('input[name="operations"]:checked'))
            .map(input => input.value);

        const previewContainer = document.getElementById('previewProblems');
        previewContainer.innerHTML = '';

        // Generate 3 example problems
        for (let i = 0; i < 3; i++) {
            const problem = this.generateSampleProblem(minNum, maxNum, checkedOps);
            if (problem) {
                const problemSpan = document.createElement('span');
                problemSpan.className = 'preview-problem';
                problemSpan.textContent = `${problem.num1} ${problem.operator} ${problem.num2} = ${problem.answer}`;
                previewContainer.appendChild(problemSpan);
            }
        }

        if (previewContainer.children.length === 0) {
            const placeholder = document.createElement('span');
            placeholder.className = 'preview-problem';
            placeholder.textContent = 'Select operations to see examples';
            placeholder.style.color = '#999';
            previewContainer.appendChild(placeholder);
        }
    }

    generateSampleProblem(min, max, operations) {
        if (operations.length === 0) return null;

        const getRandomNumber = (minimum, maximum) => {
            return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
        };

        let operation = operations[Math.floor(Math.random() * operations.length)];

        // Handle mixed operation
        if (operation === 'mixed') {
            const basicOps = ['addition', 'subtraction'];
            operation = basicOps[Math.floor(Math.random() * basicOps.length)];
        }

        switch (operation) {
            case 'addition':
                const add1 = getRandomNumber(min, max);
                const add2 = getRandomNumber(min, max);
                return {
                    num1: add1,
                    num2: add2,
                    operator: '+',
                    answer: add1 + add2
                };

            case 'subtraction':
                const sub1 = getRandomNumber(min, max);
                const sub2 = getRandomNumber(min, Math.min(sub1, max));
                return {
                    num1: sub1,
                    num2: sub2,
                    operator: '-',
                    answer: sub1 - sub2
                };

            case 'multiplication':
                const mult1 = getRandomNumber(Math.max(min, 1), Math.min(max, 12));
                const mult2 = getRandomNumber(Math.max(min, 1), Math.min(max, 12));
                return {
                    num1: mult1,
                    num2: mult2,
                    operator: '×',
                    answer: mult1 * mult2
                };

            default:
                return null;
        }
    }

    loadProgressStats() {
        if (!window.Storage) return;

        const stats = window.Storage.getGameStats();
        const progress = window.Storage.getUserProgress();

        document.getElementById('totalProblems').textContent = stats.total || 0;
        document.getElementById('correctAnswers').textContent = stats.correct || 0;

        const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        document.getElementById('accuracy').textContent = `${accuracy}%`;

        document.getElementById('bestStreak').textContent = stats.bestStreak || 0;
    }

    collectFormData() {
        const minNumber = parseInt(document.getElementById('minNumber').value);
        const maxNumber = parseInt(document.getElementById('maxNumber').value);

        const operations = Array.from(document.querySelectorAll('input[name="operations"]:checked'))
            .map(input => input.value);

        const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'easy';

        const unlimited = document.getElementById('unlimitedSession').checked;
        const sessionLength = unlimited ? null : parseInt(document.getElementById('sessionLength').value);

        return {
            minNumber,
            maxNumber,
            operations,
            difficulty,
            sessionLength
        };
    }

    validateSettings(settings) {
        const errors = [];

        if (settings.minNumber < 0) {
            errors.push('Minimum number cannot be negative');
        }

        if (settings.maxNumber <= settings.minNumber) {
            errors.push('Maximum number must be greater than minimum number');
        }

        if (settings.operations.length === 0) {
            errors.push('At least one operation must be selected');
        }

        if (settings.sessionLength !== null && settings.sessionLength < 1) {
            errors.push('Session length must be at least 1 problem');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    showConfirmation(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');

        titleEl.textContent = title;
        messageEl.textContent = message;

        // Remove existing event listeners
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);

        // Add new event listener
        newOkBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            onConfirm();
        });

        modal.classList.remove('hidden');
    }

    showSuccess(message) {
        const toast = document.getElementById('successMessage');
        const text = document.getElementById('successText');

        text.textContent = message;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    autoSave() {
        // Debounce auto-save to avoid excessive saves during rapid changes
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(() => {
            this.saveSettings();
        }, 500); // Wait 500ms after last change before saving
    }

    saveSettings() {
        const settings = this.collectFormData();
        const validation = this.validateSettings(settings);

        if (!validation.valid) {
            // Don't auto-save invalid settings, but don't alert either
            console.warn('Settings validation failed:', validation.errors);
            return;
        }

        // Save settings silently
        if (window.Storage) {
            const success = window.Storage.saveMathSettings(settings);
            if (success) {
                this.currentSettings = settings;
                this.showSuccess('Settings saved!');

                // Update math engine with new settings
                if (window.MathEngine) {
                    window.MathEngine.updateSettings(settings);
                }
            }
        }
    }

    handleBack() {
        // Auto-save handles saving, so just navigate back immediately
        window.location.href = 'index.html';
    }

    handleCancel() {
        // Auto-save handles saving, so just navigate back immediately
        window.location.href = 'index.html';
    }

    handleSave() {
        // Force immediate save when user explicitly clicks save
        this.saveSettings();
    }

    handleResetAll() {
        this.showConfirmation(
            'Reset All Settings',
            'This will reset all settings to their default values. Are you sure?',
            () => {
                if (window.MathEngine) {
                    const defaults = window.MathEngine.resetSettings();
                    this.currentSettings = defaults;
                    this.updateUI();
                    this.generatePreviewProblems();
                    this.showSuccess('Settings reset to defaults');
                }
            }
        );
    }

    handleResetProgress() {
        this.showConfirmation(
            'Reset Progress',
            'This will permanently delete all progress data including statistics and achievements. This cannot be undone. Are you sure?',
            () => {
                if (window.Storage) {
                    window.Storage.resetGameStats();
                    window.Storage.saveUserProgress({
                        level: 1,
                        experience: 0,
                        achievements: [],
                        completedSessions: 0,
                        totalProblems: 0,
                        accuracyHistory: []
                    });
                    this.loadProgressStats();
                    this.showSuccess('All progress data has been reset');
                }
            }
        );
    }

    handleExportData() {
        if (!window.Storage) {
            alert('Data export not available - storage not supported');
            return;
        }

        try {
            const data = window.Storage.exportData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `mathkid-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            this.showSuccess('Data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting data. Please try again.');
        }
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});