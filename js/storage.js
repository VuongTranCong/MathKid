/**
 * MathKid Storage Management
 * Handles local storage operations for settings, progress, and user data
 */

window.Storage = (function() {
    'use strict';

    // Storage keys
    const STORAGE_KEYS = {
        MATH_SETTINGS: 'mathkid_settings',
        GAME_STATS: 'mathkid_game_stats',
        SESSION_DATA: 'mathkid_session',
        USER_PROGRESS: 'mathkid_progress',
        PARENT_SETTINGS: 'mathkid_parent_settings'
    };

    // Default data structures
    const DEFAULT_SETTINGS = {
        minNumber: 20,
        maxNumber: 40,
        operations: ['addition', 'subtraction'],
        sessionLength: null,
        difficulty: 'easy'
    };

    const DEFAULT_GAME_STATS = {
        correct: 0,
        total: 0,
        streak: 0,
        bestStreak: 0,
        totalTime: 0,
        averageTime: 0
    };

    const DEFAULT_PROGRESS = {
        level: 1,
        experience: 0,
        achievements: [],
        completedSessions: 0,
        totalProblems: 0,
        accuracyHistory: []
    };

    /**
     * Check if localStorage is available
     */
    function isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage not available:', e);
            return false;
        }
    }

    /**
     * Get item from localStorage with error handling
     */
    function get(key) {
        if (!isStorageAvailable()) {
            console.warn('Storage not available');
            return null;
        }

        try {
            const item = localStorage.getItem(STORAGE_KEYS[key] || key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error getting storage item:', key, e);
            return null;
        }
    }

    /**
     * Set item in localStorage with error handling
     */
    function set(key, value) {
        if (!isStorageAvailable()) {
            console.warn('Storage not available');
            return false;
        }

        try {
            const storageKey = STORAGE_KEYS[key] || key;
            localStorage.setItem(storageKey, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error setting storage item:', key, e);

            // Handle quota exceeded error
            if (e.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, attempting to clear old data');
                clearOldSessionData();

                // Try again after cleanup
                try {
                    localStorage.setItem(STORAGE_KEYS[key] || key, JSON.stringify(value));
                    return true;
                } catch (e2) {
                    console.error('Still unable to store after cleanup:', e2);
                }
            }
            return false;
        }
    }

    /**
     * Remove item from localStorage
     */
    function remove(key) {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(STORAGE_KEYS[key] || key);
            return true;
        } catch (e) {
            console.error('Error removing storage item:', key, e);
            return false;
        }
    }

    /**
     * Clear all MathKid data
     */
    function clear() {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('Error clearing storage:', e);
            return false;
        }
    }

    /**
     * Get math settings with defaults
     */
    function getMathSettings() {
        const settings = get('MATH_SETTINGS');
        return { ...DEFAULT_SETTINGS, ...settings };
    }

    /**
     * Save math settings
     */
    function saveMathSettings(settings) {
        const validatedSettings = validateMathSettings(settings);
        return set('MATH_SETTINGS', validatedSettings);
    }

    /**
     * Validate math settings
     */
    function validateMathSettings(settings) {
        const validated = { ...DEFAULT_SETTINGS };

        if (settings.minNumber >= 0 && settings.minNumber <= 999) {
            validated.minNumber = Math.floor(settings.minNumber);
        }

        if (settings.maxNumber >= settings.minNumber && settings.maxNumber <= 999) {
            validated.maxNumber = Math.floor(settings.maxNumber);
        }

        if (Array.isArray(settings.operations) && settings.operations.length > 0) {
            const validOps = ['addition', 'subtraction', 'multiplication', 'mixed'];
            validated.operations = settings.operations.filter(op => validOps.includes(op));
            if (validated.operations.length === 0) {
                validated.operations = ['addition'];
            }
        }

        if (settings.sessionLength === null ||
            (typeof settings.sessionLength === 'number' && settings.sessionLength > 0)) {
            validated.sessionLength = settings.sessionLength;
        }

        if (['easy', 'medium', 'hard'].includes(settings.difficulty)) {
            validated.difficulty = settings.difficulty;
        }

        return validated;
    }

    /**
     * Get game statistics with defaults
     */
    function getGameStats() {
        const stats = get('GAME_STATS');
        return { ...DEFAULT_GAME_STATS, ...stats };
    }

    /**
     * Save game statistics
     */
    function saveGameStats(stats) {
        const currentStats = getGameStats();
        const updatedStats = { ...currentStats, ...stats };

        // Update best streak
        if (updatedStats.streak > updatedStats.bestStreak) {
            updatedStats.bestStreak = updatedStats.streak;
        }

        // Update average time
        if (updatedStats.total > 0 && updatedStats.totalTime > 0) {
            updatedStats.averageTime = Math.round(updatedStats.totalTime / updatedStats.total);
        }

        return set('GAME_STATS', updatedStats);
    }

    /**
     * Reset game statistics
     */
    function resetGameStats() {
        return set('GAME_STATS', { ...DEFAULT_GAME_STATS });
    }

    /**
     * Get user progress
     */
    function getUserProgress() {
        const progress = get('USER_PROGRESS');
        return { ...DEFAULT_PROGRESS, ...progress };
    }

    /**
     * Save user progress
     */
    function saveUserProgress(progress) {
        const currentProgress = getUserProgress();
        const updatedProgress = { ...currentProgress, ...progress };
        return set('USER_PROGRESS', updatedProgress);
    }

    /**
     * Add achievement
     */
    function addAchievement(achievementId, title, description) {
        const progress = getUserProgress();

        // Check if achievement already exists
        if (progress.achievements.some(a => a.id === achievementId)) {
            return false;
        }

        const achievement = {
            id: achievementId,
            title,
            description,
            earnedAt: Date.now()
        };

        progress.achievements.push(achievement);
        return saveUserProgress(progress);
    }

    /**
     * Update accuracy history
     */
    function updateAccuracyHistory(accuracy) {
        const progress = getUserProgress();
        const timestamp = Date.now();

        progress.accuracyHistory.push({
            accuracy: Math.round(accuracy * 100),
            timestamp
        });

        // Keep only last 30 entries
        if (progress.accuracyHistory.length > 30) {
            progress.accuracyHistory = progress.accuracyHistory.slice(-30);
        }

        return saveUserProgress(progress);
    }

    /**
     * Get session data
     */
    function getSessionData() {
        return get('SESSION_DATA') || {
            startTime: Date.now(),
            problemsSolved: 0,
            currentStreak: 0,
            sessionStats: { ...DEFAULT_GAME_STATS }
        };
    }

    /**
     * Save session data
     */
    function saveSessionData(data) {
        return set('SESSION_DATA', data);
    }

    /**
     * Clear old session data (cleanup for storage quota)
     */
    function clearOldSessionData() {
        remove('SESSION_DATA');

        // Also clean up old accuracy history
        const progress = getUserProgress();
        if (progress.accuracyHistory.length > 10) {
            progress.accuracyHistory = progress.accuracyHistory.slice(-10);
            saveUserProgress(progress);
        }
    }

    /**
     * Export all data for backup
     */
    function exportData() {
        if (!isStorageAvailable()) {
            return null;
        }

        const data = {};
        Object.keys(STORAGE_KEYS).forEach(key => {
            data[key] = get(key);
        });

        return {
            version: '1.0',
            exportedAt: Date.now(),
            data
        };
    }

    /**
     * Import data from backup
     */
    function importData(backup) {
        if (!backup || !backup.data) {
            return false;
        }

        try {
            Object.keys(backup.data).forEach(key => {
                if (backup.data[key] !== null) {
                    set(key, backup.data[key]);
                }
            });
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }

    /**
     * Get storage usage info
     */
    function getStorageInfo() {
        if (!isStorageAvailable()) {
            return null;
        }

        const info = {
            available: true,
            usage: {},
            total: 0
        };

        Object.keys(STORAGE_KEYS).forEach(key => {
            const item = localStorage.getItem(STORAGE_KEYS[key]);
            const size = item ? item.length : 0;
            info.usage[key] = size;
            info.total += size;
        });

        // Estimate total localStorage usage
        let totalUsed = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalUsed += localStorage[key].length + key.length;
            }
        }

        info.totalLocalStorage = totalUsed;
        info.mathKidPercentage = info.total > 0 ? (info.total / totalUsed * 100).toFixed(2) : 0;

        return info;
    }

    /**
     * Initialize storage with default values if needed
     */
    function initialize() {
        // Set defaults only if values don't exist
        if (!get('MATH_SETTINGS')) {
            set('MATH_SETTINGS', DEFAULT_SETTINGS);
        }

        if (!get('GAME_STATS')) {
            set('GAME_STATS', DEFAULT_GAME_STATS);
        }

        if (!get('USER_PROGRESS')) {
            set('USER_PROGRESS', DEFAULT_PROGRESS);
        }

        return true;
    }

    // Initialize on load
    initialize();

    // Public API
    return {
        // Generic storage methods
        get,
        set,
        remove,
        clear,

        // Specific data methods
        getMathSettings,
        saveMathSettings,
        getGameStats,
        saveGameStats,
        resetGameStats,
        getUserProgress,
        saveUserProgress,
        addAchievement,
        updateAccuracyHistory,
        getSessionData,
        saveSessionData,

        // Utility methods
        exportData,
        importData,
        getStorageInfo,
        isStorageAvailable,

        // Constants
        STORAGE_KEYS
    };
})();