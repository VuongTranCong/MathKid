/**
 * MathKid Math Engine
 * Handles problem generation, validation, and math logic
 */

window.MathEngine = (function() {
    'use strict';

    // Default settings
    let settings = {
        minNumber: 20,
        maxNumber: 40,
        operations: ['addition', 'subtraction'], // 'addition', 'subtraction', 'mixed'
        sessionLength: null, // null for unlimited
        difficulty: 'easy' // 'easy', 'medium', 'hard'
    };

    /**
     * Load settings from storage
     */
    function loadSettings() {
        if (window.Storage) {
            const saved = window.Storage.get('mathSettings');
            if (saved) {
                settings = { ...settings, ...saved };
            }
        }
        return settings;
    }

    /**
     * Save settings to storage
     */
    function saveSettings(newSettings) {
        settings = { ...settings, ...newSettings };
        if (window.Storage) {
            window.Storage.set('mathSettings', settings);
        }
    }

    /**
     * Generate a random number within the specified range
     */
    function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate an addition problem
     */
    function generateAdditionProblem() {
        const num1 = getRandomNumber(settings.minNumber, settings.maxNumber);
        const num2 = getRandomNumber(settings.minNumber, settings.maxNumber);

        return {
            num1,
            num2,
            operator: '+',
            answer: num1 + num2,
            type: 'addition'
        };
    }

    /**
     * Generate a subtraction problem
     * Ensures positive results by making the first number larger
     */
    function generateSubtractionProblem() {
        let num1, num2;

        // Generate two numbers
        const n1 = getRandomNumber(settings.minNumber, settings.maxNumber);
        const n2 = getRandomNumber(settings.minNumber, settings.maxNumber);

        // Ensure num1 >= num2 for positive results
        if (n1 >= n2) {
            num1 = n1;
            num2 = n2;
        } else {
            num1 = n2;
            num2 = n1;
        }

        // Special case: if both numbers are the same and at minimum,
        // adjust to avoid 0 - 0 = 0
        if (num1 === num2 && num1 === settings.minNumber && settings.minNumber > 1) {
            num1 = getRandomNumber(settings.minNumber + 1, settings.maxNumber);
        }

        return {
            num1,
            num2,
            operator: '-',
            answer: num1 - num2,
            type: 'subtraction'
        };
    }

    /**
     * Generate a multiplication problem (for advanced difficulty)
     */
    function generateMultiplicationProblem() {
        // For multiplication, use smaller numbers to keep answers manageable
        const maxMult = Math.min(settings.maxNumber, 12);
        const minMult = Math.max(settings.minNumber, 1);

        const num1 = getRandomNumber(minMult, maxMult);
        const num2 = getRandomNumber(minMult, maxMult);

        return {
            num1,
            num2,
            operator: '×',
            answer: num1 * num2,
            type: 'multiplication'
        };
    }

    /**
     * Generate problems based on difficulty level
     */
    function generateProblemByDifficulty() {
        const { difficulty } = settings;

        switch (difficulty) {
            case 'easy':
                // Only single digits, addition and subtraction
                const easyOps = settings.operations.filter(op =>
                    op === 'addition' || op === 'subtraction'
                );
                return generateProblemByOperation(easyOps[getRandomNumber(0, easyOps.length - 1)]);

            case 'medium':
                // Include all selected operations
                const randomOp = settings.operations[getRandomNumber(0, settings.operations.length - 1)];
                return generateProblemByOperation(randomOp);

            case 'hard':
                // Include multiplication if available, otherwise use selected operations
                if (settings.operations.includes('multiplication')) {
                    const hardOps = [...settings.operations];
                    if (!hardOps.includes('multiplication')) {
                        hardOps.push('multiplication');
                    }
                    const randomOp = hardOps[getRandomNumber(0, hardOps.length - 1)];
                    return generateProblemByOperation(randomOp);
                } else {
                    const randomOp = settings.operations[getRandomNumber(0, settings.operations.length - 1)];
                    return generateProblemByOperation(randomOp);
                }

            default:
                return generateAdditionProblem();
        }
    }

    /**
     * Generate a problem based on operation type
     */
    function generateProblemByOperation(operation) {
        switch (operation) {
            case 'addition':
                return generateAdditionProblem();
            case 'subtraction':
                return generateSubtractionProblem();
            case 'multiplication':
                return generateMultiplicationProblem();
            case 'mixed':
                // Randomly choose between addition and subtraction
                const mixedOps = ['addition', 'subtraction'];
                const randomOp = mixedOps[getRandomNumber(0, mixedOps.length - 1)];
                return generateProblemByOperation(randomOp);
            default:
                return generateAdditionProblem();
        }
    }

    /**
     * Main problem generation function
     */
    function generateProblem() {
        loadSettings();

        // If no operations selected, default to addition
        if (!settings.operations || settings.operations.length === 0) {
            settings.operations = ['addition'];
        }

        let problem;

        // Generate based on operation preference
        if (settings.operations.includes('mixed')) {
            // Mixed mode - randomly select operation
            problem = generateProblemByDifficulty();
        } else if (settings.operations.length === 1) {
            // Single operation mode
            problem = generateProblemByOperation(settings.operations[0]);
        } else {
            // Multiple operations selected - randomly choose one
            const randomOperation = settings.operations[getRandomNumber(0, settings.operations.length - 1)];
            problem = generateProblemByOperation(randomOperation);
        }

        // Add metadata
        problem.timestamp = Date.now();
        problem.settings = { ...settings };

        return problem;
    }

    /**
     * Validate an answer
     */
    function validateAnswer(problem, userAnswer) {
        if (!problem || typeof userAnswer !== 'number') {
            return false;
        }

        return userAnswer === problem.answer;
    }

    /**
     * Get problem statistics
     */
    function getProblemStats(problem) {
        if (!problem) return null;

        return {
            difficulty: calculateDifficulty(problem),
            timeToSolve: null, // Can be set by calling code
            type: problem.type,
            numbers: [problem.num1, problem.num2],
            answer: problem.answer
        };
    }

    /**
     * Calculate problem difficulty (1-10 scale)
     */
    function calculateDifficulty(problem) {
        let difficulty = 1;

        // Base difficulty on numbers involved
        const maxNum = Math.max(problem.num1, problem.num2);
        difficulty += Math.floor(maxNum / 5);

        // Adjust for operation
        switch (problem.type) {
            case 'addition':
                difficulty += 1;
                break;
            case 'subtraction':
                difficulty += 2;
                break;
            case 'multiplication':
                difficulty += 3;
                break;
        }

        // Adjust for result size
        if (problem.answer > 20) difficulty += 1;
        if (problem.answer > 50) difficulty += 1;
        if (problem.answer > 100) difficulty += 2;

        return Math.min(difficulty, 10);
    }

    /**
     * Generate practice set
     */
    function generatePracticeSet(count = 10) {
        const problems = [];
        for (let i = 0; i < count; i++) {
            problems.push(generateProblem());
        }
        return problems;
    }

    /**
     * Get current settings
     */
    function getSettings() {
        return { ...settings };
    }

    /**
     * Update settings
     */
    function updateSettings(newSettings) {
        saveSettings(newSettings);
        return getSettings();
    }

    /**
     * Reset settings to defaults
     */
    function resetSettings() {
        const defaultSettings = {
            minNumber: 20,
            maxNumber: 40,
            operations: ['addition', 'subtraction'],
            sessionLength: null,
            difficulty: 'easy'
        };
        saveSettings(defaultSettings);
        return getSettings();
    }

    /**
     * Validate settings
     */
    function validateSettings(settingsToValidate) {
        const errors = [];

        if (settingsToValidate.minNumber < 0) {
            errors.push('Minimum number must be 0 or greater');
        }

        if (settingsToValidate.maxNumber < settingsToValidate.minNumber) {
            errors.push('Maximum number must be greater than minimum number');
        }

        if (settingsToValidate.maxNumber > 999) {
            errors.push('Maximum number should not exceed 999 for kid-friendly experience');
        }

        if (!settingsToValidate.operations || settingsToValidate.operations.length === 0) {
            errors.push('At least one operation must be selected');
        }

        const validOperations = ['addition', 'subtraction', 'multiplication', 'mixed'];
        const invalidOps = settingsToValidate.operations?.filter(op => !validOperations.includes(op));
        if (invalidOps && invalidOps.length > 0) {
            errors.push(`Invalid operations: ${invalidOps.join(', ')}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Initialize settings on load
    loadSettings();

    // Public API
    return {
        generateProblem,
        validateAnswer,
        getProblemStats,
        generatePracticeSet,
        getSettings,
        updateSettings,
        resetSettings,
        validateSettings,
        calculateDifficulty
    };
})();