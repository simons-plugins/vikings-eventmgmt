export class ApiClient {
    constructor() {
        this.baseUrl = 'https://vikings-osm-event-manager.onrender.com';
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            console.log(`Making ${options.method || 'GET'} request to: ${url}`);
            
            // Log the request body for debugging
            if (options.body) {
                console.log('Request body:', options.body);
            }
            
            const defaultOptions = {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                // Try to get more detailed error info
                const errorText = await response.text();
                console.error(`HTTP ${response.status} error:`, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    async getUserRoles(accessToken) {
        console.log('getUserRoles called with token:', accessToken ? 'present' : 'missing');
        
        if (!accessToken) {
            throw new Error('Access token is required for getUserRoles');
        }
        
        return await this.makeRequest('/get-user-roles', {
            method: 'POST',
            body: JSON.stringify({ access_token: accessToken })
        });
    }

    async getTerms(accessToken) {
        return await this.makeRequest('/get-terms', {
            method: 'POST',
            body: JSON.stringify({ access_token: accessToken })
        });
    }

    async getSectionConfig(accessToken, sectionId) {
        return await this.makeRequest('/get-section-config', {
            method: 'POST',
            body: JSON.stringify({ 
                access_token: accessToken, 
                sectionid: sectionId 
            })
        });
    }

    async getEvents(accessToken, sectionId, termId) {
        return await this.makeRequest('/get-events', {
            method: 'POST',
            body: JSON.stringify({ 
                access_token: accessToken, 
                sectionid: sectionId, 
                termid: termId 
            })
        });
    }

    async getEventAttendance(accessToken, eventId, sectionId, termId) {
        return await this.makeRequest('/get-event-attendance', {
            method: 'POST',
            body: JSON.stringify({ 
                access_token: accessToken, 
                eventid: eventId, 
                sectionid: sectionId, 
                termid: termId 
            })
        });
    }

    async getContactDetails(accessToken, sectionId, scoutId, termId) {
        return await this.makeRequest(`/get-contact-details?sectionid=${sectionId}&scoutid=${scoutId}&termid=${termId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    }

    async getListOfMembers(accessToken, sectionId, termId, section) {
        return await this.makeRequest(`/get-list-of-members?sectionid=${sectionId}&termid=${termId}&section=${encodeURIComponent(section)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    }
}