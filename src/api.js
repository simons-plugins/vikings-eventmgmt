// Always use production backend - simplifies configuration and avoids local setup issues
const BACKEND_URL = 'https://vikings-osm-event-manager.onrender.com';

console.info('Using Backend URL:', BACKEND_URL); // Changed to info

// Check if OSM API access has been blocked
function checkIfBlocked() {
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        throw new Error('OSM API access has been blocked. Please contact the system administrator.');
    }
}

// Clear blocked status (for admin use)
function clearBlockedStatus() {
    sessionStorage.removeItem('osm_blocked');
    console.info('OSM blocked status cleared'); // Changed to info
}

// Enhanced rate limit monitoring for backend-provided rate limit info
function logRateLimitInfo(responseData, apiName) {
    if (responseData && responseData._rateLimitInfo) {
        const info = responseData._rateLimitInfo;
        
        // Log OSM rate limit info
        if (info.osm) {
            const osm = info.osm;
            const percentUsed = osm.limit > 0 ? ((osm.limit - osm.remaining) / osm.limit * 100).toFixed(1) : 0;
            
            console.groupCollapsed(`🔄 ${apiName} Rate Limit Status`); // Changed to groupCollapsed
            console.debug(`📊 OSM API:`, { // Changed to debug
                remaining: `${osm.remaining}/${osm.limit}`,
                percentUsed: `${percentUsed}%`,
                window: osm.window || 'per hour',
                available: osm.available,
                rateLimited: osm.rateLimited || false
            });
            
            // Warn when getting close to OSM limit
            if (osm.remaining < 20 && osm.limit > 0) {
                console.warn(`⚠️ OSM rate limit warning for ${apiName}: Only ${osm.remaining} requests remaining (${percentUsed}% used)!`);
            }
            
            if (osm.remaining < 10 && osm.limit > 0) {
                console.error(`🚨 CRITICAL: Only ${osm.remaining} OSM requests remaining for ${apiName}! (${percentUsed}% used)`);
            }
        }
        
        // Log backend rate limit info (less critical but useful)
        if (info.backend) {
            const backend = info.backend;
            const backendPercentUsed = backend.limit > 0 ? (((backend.limit - backend.remaining) / backend.limit) * 100).toFixed(1) : 0;
            
            console.debug(`🖥️ Backend API:`, { // Changed to debug
                remaining: `${backend.remaining}/${backend.limit}`,
                percentUsed: `${backendPercentUsed}%`,
                window: backend.window || 'per minute'
            });
        }
        
        console.groupEnd();
    } else {
        console.debug(`📊 ${apiName}: No rate limit info available`); // Changed to debug
    }
}

// Enhanced API response handler with new rate limit monitoring
async function handleAPIResponseWithRateLimit(response, apiName) {
    // Handle rate limiting (429 status)
    if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if this is OSM rate limiting or backend rate limiting
        if (errorData.rateLimitInfo) {
            const retryAfter = errorData.rateLimitInfo.retryAfter || 'unknown time';
            console.warn(`🚫 ${apiName} rate limited by OSM. Backend managing retry. Wait: ${retryAfter}s`);
            
            if (errorData.rateLimitInfo.retryAfter) {
                throw new Error(`OSM API rate limit exceeded. Please wait ${errorData.rateLimitInfo.retryAfter} seconds before trying again.`);
            } else {
                throw new Error('OSM API rate limit exceeded. Please wait before trying again.');
            }
        } else {
            console.warn(`🚫 ${apiName} rate limited. Backend managing request flow.`);
            throw new Error('Rate limited. The backend is managing request flow to prevent blocking.');
        }
    }
    
    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
        console.warn(`🔐 Authentication error on ${apiName}: ${response.status}`);
        handleTokenExpiration();
        return null;
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
        
        // Check for OSM blocking/critical errors
        if (errorMessage && typeof errorMessage === 'string') {
            const errorLower = errorMessage.toLowerCase();
            if (errorLower.includes('blocked') || errorLower.includes('permanently blocked')) {
                console.error(`🚨 CRITICAL: OSM API BLOCKED on ${apiName}!`, errorMessage);
                sessionStorage.setItem('osm_blocked', 'true');
                throw new Error(`OSM API BLOCKED: ${errorMessage}`);
            }
        }
        
        console.error(`❌ ${apiName} API error:`, errorMessage);
        throw new Error(`${apiName} failed: ${errorMessage}`);
    }
    
    // Parse JSON response
    try {
        const data = await response.json();
        
        // Log rate limit info if available
        logRateLimitInfo(data, apiName);
        
        // Check for token expiration in response data
        if (!isTokenValid(data)) {
            console.warn(`🔐 Token invalid in ${apiName} response`);
            handleTokenExpiration();
            return null;
        }
        
        return data;
    } catch (jsonError) {
        console.error(`❌ ${apiName} returned invalid JSON`);
        throw new Error(`${apiName} returned invalid response`);
    }
}

// Optional rate limit status checker
async function checkRateLimitStatus() {
    try {
        const response = await fetch(`${BACKEND_URL}/rate-limit-status`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const statusData = await response.json();
            if (statusData.rateLimitInfo || statusData._rateLimitInfo) {
                const info = statusData.rateLimitInfo || statusData._rateLimitInfo;
                logRateLimitInfo({ _rateLimitInfo: info }, 'Rate Limit Status Check');
                return info;
            }
        }
    } catch (error) {
        console.warn('Could not fetch rate limit status:', error);
    }
    return null;
}

function getToken() {
    return sessionStorage.getItem('access_token'); // <-- changed
}

// Add token validation function:
function isTokenValid(responseData) {
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

function handleTokenExpiration() {
    console.info('Token expired - redirecting to login'); // Changed to info
    // Clear expired token
    sessionStorage.removeItem('access_token');
    
    // Clear any cached data
    localStorage.removeItem('viking_sections_cache');
    
    // Check if we're in a test environment (Jest/JSDOM)
    const isTestEnvironment = typeof jest !== 'undefined' || 
                             (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent === 'jsdom');
    
    if (isTestEnvironment) {
        console.info('Test environment detected - skipping alert and page reload'); // Changed to info
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
function clearToken() {
    sessionStorage.removeItem('access_token');
    console.info('Authentication token cleared'); // Changed to info
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

async function getTermsForSection(sectionId) {
    const token = getToken();
    if (!token) return [];
    const response = await fetch(`${BACKEND_URL}/get-terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token })
    });
    const data = await handleAPIResponseWithRateLimit(response, 'getTermsForSection');
    return data ? (data[sectionId] || []) : [];
}

async function getMostRecentTermId(sectionId) {
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

        const data = await handleAPIResponseWithRateLimit(response, 'getMostRecentTermId');
        if (!data) return null;
        
        console.debug('Terms API response for section', sectionId, ':', data); // Changed to debug
        
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
        console.debug('Most recent term found for section', sectionId, ':', mostRecentTerm); // Changed to debug
        return mostRecentTerm.termid;

    } catch (error) {
        console.error('Error fetching most recent term ID:', error);
        return null;
    }
}

async function getUserRoles() {
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
        
        const data = await handleAPIResponseWithRateLimit(response, 'getUserRoles');
        if (!data) return [];
        
        // Handle the response format - convert object with numbered keys to array
        // Remove _rateLimitInfo from the data before processing
        const { _rateLimitInfo, ...sectionsData } = data;
        
        // Convert object with numbered keys to array
        const sectionsArray = Object.values(sectionsData);
        
        return sectionsArray;
        
    } catch (error) {
        console.error('Error fetching user roles:', error);
        throw error;
    }
}

async function getEvents(sectionid, termid) {
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

        const data = await handleAPIResponseWithRateLimit(response, 'getEvents');
        return data || { items: [] };

    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

async function getEventAttendance(sectionId, eventId, termId) {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return { items: [] };
        }

        console.debug('API call with params:', { sectionId, eventId, termId }); // Changed to debug

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

        console.debug('API response status:', response.status); // Changed to debug

        const data = await handleAPIResponseWithRateLimit(response, 'getEventAttendance');
        console.debug('API response data:', data); // Changed to debug
        
        return data || { items: [] };

    } catch (error) {
        console.error('Error fetching event attendance:', error);
        throw error;
    }
}

async function getFlexiRecords(sectionId, archived = 'n') {
    try {
        // Check if API access has been blocked
        checkIfBlocked();
        
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return { items: [] };
        }

        const response = await fetch(`${BACKEND_URL}/get-flexi-records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                access_token: token,
                sectionid: sectionId,
                archived: archived
            })
        });

        const data = await handleAPIResponseWithRateLimit(response, 'getFlexiRecords');
        return data || { items: [] };

    } catch (error) {
        console.error('Error fetching flexi records:', error);
        throw error;
    }
}

// Test backend connectivity
async function testBackendConnection() {
    try {
        console.info('Testing backend connection to:', BACKEND_URL); // Changed to info
        const response = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.debug('Backend connection test - Status:', response.status); // Changed to debug
        
        if (response.ok) {
            const data = await response.text();
            console.debug('Backend connection test - Response:', data); // Changed to debug
            return true;
        } else {
            console.error('Backend connection test failed:', response.status); // Keep as error
            return false;
        }
    } catch (error) {
        console.error('Backend connection test error:', error);
        return false;
    }
}

// --- Expose functions globally for CDN build ---
if (typeof window.API_FUNCTIONS === 'undefined') {
  window.API_FUNCTIONS = {};
}
window.API_FUNCTIONS.getUserRoles = getUserRoles;
window.API_FUNCTIONS.getMostRecentTermId = getMostRecentTermId;
window.API_FUNCTIONS.getEvents = getEvents;
window.API_FUNCTIONS.getEventAttendance = getEventAttendance;
window.API_FUNCTIONS.getFlexiRecords = getFlexiRecords;
window.API_FUNCTIONS.getToken = getToken;
window.API_FUNCTIONS.clearToken = clearToken;
window.API_FUNCTIONS.isAuthenticated = isAuthenticated;
window.API_FUNCTIONS.handleTokenExpiration = handleTokenExpiration;
window.API_FUNCTIONS.getTermsForSection = getTermsForSection;
window.API_FUNCTIONS.checkRateLimitStatus = checkRateLimitStatus;
window.API_FUNCTIONS.clearBlockedStatus = clearBlockedStatus;
window.API_FUNCTIONS.testBackendConnection = testBackendConnection;
// isTokenValid, checkIfBlocked, logRateLimitInfo, handleAPIResponseWithRateLimit are internal