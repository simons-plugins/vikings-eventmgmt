export class AuthManager {
    constructor() {
        this.clientId = '98YWRWrOQyUVAlJuPHs8AdsbVg2mUCQO';
        this.scope = 'section:member:read section:programme:read section:event:read';
        this.redirectUri = window.location.origin + '/callback.html';
        this.apiBaseUrl = 'https://vikings-osm-event-manager.onrender.com';
    }

    async checkForToken() {
        try {
            const token = await this.getToken();
            return token ? 'authenticated' : 'unauthenticated';
        } catch (error) {
            console.error('Token check failed:', error);
            return 'error';
        }
    }

    async getToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/token`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('No valid token found');
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.access_token || null;
        } catch (error) {
            console.error('Error getting token:', error);
            throw error;
        }
    }

    redirectToLogin() {
        const authUrl = `https://www.onlinescoutmanager.co.uk/oauth/authorize?` +
            `client_id=${this.clientId}&` +
            `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
            `scope=${encodeURIComponent(this.scope)}&` +
            `response_type=code`;
        
        console.log('Redirecting to OSM login...');
        window.location.href = authUrl;
    }

    async logout() {
        try {
            await fetch(`${this.apiBaseUrl}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            console.log('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}