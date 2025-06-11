// Always use production backend - simplifies configuration and avoids local setup issues
const BACKEND_URL = 'https://vikings-osm-event-manager.onrender.com';

console.log('Using Backend URL:', BACKEND_URL);

// Check if OSM API access has been blocked
function checkIfBlocked() {
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        throw new Error('OSM API access has been blocked. Please contact the system administrator.');
    }
}

// Clear blocked status (for admin use)
export function clearBlockedStatus() {
    sessionStorage.removeItem('osm_blocked');
    console.log('OSM blocked status cleared');
}

// Rate limit monitoring function
function checkRateLimit(response) {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (limit && remaining && reset) {
        const usage = ((limit - remaining) / limit * 100).toFixed(1);
        console.log(`🔄 Rate Limit Status:`, {
            limit: `${limit} requests/hour`,
            remaining: `${remaining} requests left`,
            resetIn: `${reset} seconds`,
            usage: `${usage}% used`
        });
        
        // Warn when getting close to limit
        if (remaining < 10) {
            console.warn(`⚠️ Rate limit warning: Only ${remaining} requests remaining!`);
        }
        
        if (remaining < 5) {
            console.error(`🚨 CRITICAL: Only ${remaining} requests remaining! Consider slowing down API calls.`);
        }
        
        return { limit: parseInt(limit), remaining: parseInt(remaining), reset: parseInt(reset), usage: parseFloat(usage) };
    }
    return null;
}

// Enhanced error handling for API responses
async function handleAPIResponse(response, apiName) {
    // Check rate limiting first
    const rateLimitInfo = checkRateLimit(response);
    
    // Handle rate limiting (429 status)
    if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        console.error(`🚫 Rate limited on ${apiName}! Retry after ${retryAfter} seconds`);
        throw new Error(`Rate limited. Please wait ${retryAfter} seconds before trying again.`);
    }
    
    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
        console.warn(`🔐 Authentication error on ${apiName}: ${response.status}`);
        handleTokenExpiration();
        return null;
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}`;
        let isBlocked = false;
        let isCritical = false;
        
        try {
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
                
                // Check for OSM blocking/critical errors
                if (errorData.error && typeof errorData.error === 'string') {
                    const errorLower = errorData.error.toLowerCase();
                    if (errorLower.includes('blocked') || errorLower.includes('permanently blocked')) {
                        isBlocked = true;
                        isCritical = true;
                    }
                }
            } else {
                // If not JSON, get text (but limit it)
                const errorText = await response.text();
                errorMessage = errorText.substring(0, 200);
                
                // Check for blocking in HTML/text responses
                const errorLower = errorText.toLowerCase();
                if (errorLower.includes('blocked') || errorLower.includes('permanently blocked')) {
                    isBlocked = true;
                    isCritical = true;
                }
                
                if (errorText.includes('<!doctype') || errorText.includes('<html')) {
                    errorMessage = `Server returned HTML error page instead of JSON (likely OSM API issue)`;
                }
            }
        } catch (parseError) {
            console.warn(`Could not parse error response from ${apiName}:`, parseError);
        }
        
        // Handle critical blocking errors
        if (isBlocked) {
            console.error(`🚨 CRITICAL: OSM API BLOCKED on ${apiName}!`, errorMessage);
            
            // Check if we're in a test environment
            const isTestEnvironment = typeof jest !== 'undefined' || 
                                     (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent === 'jsdom');
            
            if (!isTestEnvironment && typeof window !== 'undefined' && window.alert) {
                alert(`CRITICAL ERROR: OSM API Access Blocked!\n\n` +
                      `Error: ${errorMessage}\n\n` +
                      `This application has been blocked by Online Scout Manager. ` +
                      `Please contact the system administrator immediately.`);
            } else {
                console.error('CRITICAL ERROR: OSM API Access Blocked!', errorMessage);
            }
            
            // Disable further API calls
            sessionStorage.setItem('osm_blocked', 'true');
            
            throw new Error(`OSM API BLOCKED: ${errorMessage}`);
        }
        
        console.error(`❌ ${apiName} API error:`, errorMessage);
        throw new Error(`${apiName} failed: ${errorMessage}`);
    }
    
    // Parse JSON response
    try {
        const data = await response.json();
        
        // Check for token expiration in response data
        if (!isTokenValid(data)) {
            console.warn(`🔐 Token invalid in ${apiName} response`);
            handleTokenExpiration();
            return null;
        }
        
        return data;
    } catch (jsonError) {
        const responseText = await response.text();
        console.error(`❌ ${apiName} returned invalid JSON:`, {
            status: response.status,
            contentType: response.headers.get('content-type'),
            responsePreview: responseText.substring(0, 200)
        });
        throw new Error(`${apiName} returned invalid JSON response`);
    }
}

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
    
    // Check if we're in a test environment (Jest/JSDOM)
    const isTestEnvironment = typeof jest !== 'undefined' || 
                             (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent === 'jsdom');
    
    if (isTestEnvironment) {
        console.log('Test environment detected - skipping alert and page reload');
        return;
    }
    
    // Show a message to the user (browser only)
    if (typeof window !== 'undefined' && window.alert) {
        alert('Your session has expired. Please log in again.');
    }
    
    // Force a full page reload to reset the app state (browser only)
    if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
    }
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
        // Check if API access has been blocked
        checkIfBlocked();
        
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return { items: [] };
        }

        console.log('Fetching flexi records for section:', sectionId, 'archived:', archived);

        const response = await fetch(`${BACKEND_URL}/get-flexi-records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: token,
                sectionid: sectionId,
                archived: archived
            })
        });

        // Use enhanced error handling
        const data = await handleAPIResponse(response, 'getFlexiRecords');
        if (data === null) return { items: [] }; // Token expired

        console.log('Flexi records API response data:', data);
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