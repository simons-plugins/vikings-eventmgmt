export class AppState {
    constructor() {
        this.state = {
            user: null,
            sections: [],
            events: [],
            attendees: [],
            ui: {
                sidebarCollapsed: false,
                currentView: 'login',
                loading: false,
                error: null
            }
        };
        this.listeners = new Map();
    }

    get(key) {
        return key ? this.state[key] : this.state;
    }

    set(key, value) {
        this.state[key] = value;
        this.notify(key, value);
    }

    update(key, updater) {
        if (typeof updater === 'function') {
            this.state[key] = updater(this.state[key]);
        } else {
            this.state[key] = { ...this.state[key], ...updater };
        }
        this.notify(key, this.state[key]);
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    notify(key, value) {
        const callbacks = this.listeners.get(key) || [];
        callbacks.forEach(callback => callback(value));
    }

    // Convenience methods
    setLoading(loading, message = 'Loading...') {
        this.update('ui', { loading, loadingMessage: message });
    }

    setError(error) {
        this.update('ui', { error });
    }

    clearError() {
        this.update('ui', { error: null });
    }
}