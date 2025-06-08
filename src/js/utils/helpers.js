import { UIComponents } from '../ui/components.js';

export class UIHelpers {
    static async withLoading(asyncFn, loadingMessage = 'Loading...', spinnerType = 'ring') {
        let spinner = null;
        
        try {
            // Show spinner
            spinner = UIComponents.createLoadingSpinner(spinnerType, loadingMessage);
            document.body.appendChild(spinner);
            
            // Execute async function
            const result = await asyncFn();
            return result;
            
        } catch (error) {
            console.error('Operation failed:', error);
            this.showError(error.message || 'An error occurred');
            throw error;
        } finally {
            // Hide spinner
            if (spinner && spinner.parentNode) {
                spinner.parentNode.removeChild(spinner);
            }
        }
    }

    static showError(message, duration = 5000) {
        return UIComponents.createErrorToast(message, duration);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    static formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    }

    static isMobile() {
        return window.innerWidth <= 991;
    }

    static createElement(tag, { classes, id, innerHTML, textContent, attributes = {} } = {}) {
        const element = document.createElement(tag);
        
        if (classes) element.className = classes;
        if (id) element.id = id;
        if (innerHTML) element.innerHTML = innerHTML;
        if (textContent) element.textContent = textContent;
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        return element;
    }
}

export class StorageHelpers {
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }
}