// Hybrid approach: OAuth uses production (URL consistency), API calls can use local
const OAUTH_BACKEND_URL = 'https://vikings-osm-event-manager.onrender.com';
const API_BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://vikings-osm-event-manager.onrender.com'
    : 'https://localhost:3001'; // Switch to local for testing

// Use different backends for OAuth vs API calls
const BACKEND_URL = OAUTH_BACKEND_URL; // OAuth always uses production
const API_URL = API_BACKEND_URL;       // API calls can use local

console.log('OAuth Backend URL:', OAUTH_BACKEND_URL);
console.log('API Backend URL:', API_BACKEND_URL);
console.log('Using Backend URL:', BACKEND_URL);
console.log('Frontend protocol:', window.location.protocol);

export function getToken() {
    return sessionStorage.getItem('access_token'); // <-- changed
}

// Add token validation function:
export function isTokenValid(responseData) {
    // Check if the response indicates token expiration or authentication errors
    if (responseData && (
        (responseData.status === false && responseData.error && responseData.error.code === 'access-error-2') ||
        responseData.error === 'Invalid access token' ||
        responseData.message === 'Unauthorized' ||
        responseData.error === 'Token expired'
    )) {
        return false;
    }
    return true;
}

export function handleTokenExpiration() {
    console.log('Token expired - redirecting to login');
    // Clear expired token
    sessionStorage.removeItem('access_token');
    
    // Clear any cached data
    localStorage.removeItem('viking_sections_cache');
    
    // Show a message to the user
    alert('Your session has expired. Please log in again.');
    
    // Force a full page reload to reset the app state
    window.location.reload();
}

// Clear authentication token (logout)
export function clearToken() {
    sessionStorage.removeItem('access_token');
    console.log('Authentication token cleared');
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!getToken();
}

export async function getTermsForSection(sectionId) {
    const token = getToken();
    if (!token) return [];
    const response = await fetch(`${BACKEND_URL}/get-terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token })
    });
    const data = await response.json();
    return data[sectionId] || [];
}

export async function getMostRecentTermId(sectionId) {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return null;
        }

        const response = await fetch(`${BACKEND_URL}/get-terms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                access_token: token,
                sectionid: sectionId 
            })
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleTokenExpiration();
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Terms API response for section', sectionId, ':', data);
        
        // Check for token expiration in response data
        if (!isTokenValid(data)) {
            handleTokenExpiration();
            return null;
        }
        
        // Handle different response formats
        let termsArray = null;
        
        if (data.items && Array.isArray(data.items)) {
            // Format: { items: [...] }
            termsArray = data.items;
        } else if (data[sectionId] && Array.isArray(data[sectionId])) {
            // Format: { "sectionId": [...] }
            termsArray = data[sectionId];
        } else if (Array.isArray(data)) {
            // Format: [...]
            termsArray = data;
        } else {
            console.warn('Unexpected terms response format:', data);
            return null;
        }
        
        if (!termsArray || termsArray.length === 0) {
            console.warn('No terms found for section:', sectionId);
            return null;
        }

        // Sort terms by start date (most recent first)
        const sortedTerms = termsArray.sort((a, b) => {
            const dateA = new Date(a.startdate);
            const dateB = new Date(b.startdate);
            return dateB - dateA; // Descending order (newest first)
        });

        const mostRecentTerm = sortedTerms[0];
        console.log('Most recent term found for section', sectionId, ':', mostRecentTerm);
        return mostRecentTerm.termid;

    } catch (error) {
        console.error('Error fetching most recent term ID:', error);
        return null;
    }
}

// Update your getUserRoles function to check for token expiration:
export async function getUserRoles() {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return [];
        }

        const response = await fetch(`${BACKEND_URL}/get-user-roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: token })
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleTokenExpiration();
                return [];
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for token expiration in response data
        if (!isTokenValid(data)) {
            handleTokenExpiration();
            return [];
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching user roles:', error);
        // If it's a network error, don't redirect - might be temporary
        throw error;
    }
}

export async function getEvents(sectionid, termid) {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return { items: [] };
        }

        const response = await fetch(`${BACKEND_URL}/get-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: token, sectionid, termid })
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleTokenExpiration();
                return { items: [] };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Check for token expiration in response data
        if (!isTokenValid(data)) {
            handleTokenExpiration();
            return { items: [] };
        }

        return data;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

export async function getEventAttendance(sectionId, eventId, termId) {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return { items: [] };
        }

        console.log('API call with params:', { sectionId, eventId, termId });

        const response = await fetch(`${BACKEND_URL}/get-event-attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                access_token: token, 
                sectionid: sectionId, 
                eventid: eventId,
                termid: termId
            })
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleTokenExpiration();
                return { items: [] };
            }
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`Failed to fetch event attendance: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API response data:', data);
        
        // Check for token expiration in response data
        if (!isTokenValid(data)) {
            handleTokenExpiration();
            return { items: [] };
        }

        return data;
    } catch (error) {
        console.error('Error fetching event attendance:', error);
        throw error;
    }
}

export async function getFlexiRecords(sectionId, archived = 'n') {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return { items: [] };
        }

        console.log('Fetching flexi records for section:', sectionId, 'archived:', archived);

        const response = await fetch(`${API_URL}/get-flexi-records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                access_token: token, 
                sectionid: sectionId,
                archived: archived
            })
        });

        console.log('Flexi records API response status:', response.status);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleTokenExpiration();
                return { items: [] };
            }
            const errorText = await response.text();
            console.error('Flexi records API error response:', errorText);
            throw new Error(`Failed to fetch flexi records: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Flexi records API response data:', data);
        
        // Check for token expiration in response data
        if (!isTokenValid(data)) {
            handleTokenExpiration();
            return { items: [] };
        }

        return data;
    } catch (error) {
        console.error('Error fetching flexi records:', error);
        throw error;
    }
}

// Test backend connectivity
export async function testBackendConnection() {
    try {
        console.log('Testing backend connection to:', BACKEND_URL);
        const response = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Backend connection test - Status:', response.status);
        
        if (response.ok) {
            const data = await response.text();
            console.log('Backend connection test - Response:', data);
            return true;
        } else {
            console.error('Backend connection test failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Backend connection test error:', error);
        return false;
    }
}