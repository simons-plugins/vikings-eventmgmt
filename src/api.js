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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwaS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSIsImZpbGUiOiJhcGkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBbHdheXMgdXNlIHByb2R1Y3Rpb24gYmFja2VuZCAtIHNpbXBsaWZpZXMgY29uZmlndXJhdGlvbiBhbmQgYXZvaWRzIGxvY2FsIHNldHVwIGlzc3Vlcwpjb25zdCBCQUNLRU5EX1VSTCA9ICdodHRwczovL3Zpa2luZ3Mtb3NtLWV2ZW50LW1hbmFnZXIub25yZW5kZXIuY29tJzsKCmNvbnNvbGUubG9nKCdVc2luZyBCYWNrZW5kIFVSTDonLCBCQUNLRU5EX1VSTCk7CgovLyBDaGVjayBpZiBPU00gQVBJIGFjY2VzcyBoYXMgYmVlbiBibG9ja2VkCmZ1bmN0aW9uIGNoZWNrSWZCbG9ja2VkKCkgewogICAgaWYgKHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ29zbV9ibG9ja2VkJykgPT09ICd0cnVlJykgewogICAgICAgIHRocm93IG5ldyBFcnJvcignT1NNIEFQSSBhY2Nlc3MgaGFzIGJlZW4gYmxvY2tlZC4gUGxlYXNlIGNvbnRhY3QgdGhlIHN5c3RlbSBhZG1pbmlzdHJhdG9yLicpOwogICAgfQp9CgovLyBDbGVhciBibG9ja2VkIHN0YXR1cyAoZm9yIGFkbWluIHVzZSkKZXhwb3J0IGZ1bmN0aW9uIGNsZWFyQmxvY2tlZFN0YXR1cygpIHsKICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oJ29zbV9ibG9ja2VkJyk7CiAgICBjb25zb2xlLmxvZygnT1NNIGJsb2NrZWQgc3RhdHVzIGNsZWFyZWQnKTsKfQoKLy8gUmF0ZSBsaW1pdCBtb25pdG9yaW5nIGZ1bmN0aW9uCmZ1bmN0aW9uIGNoZWNrUmF0ZUxpbWl0KHJlc3BvbnNlKSB7CiAgICBjb25zdCBsaW1pdCA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdYLVJhdGVMaW1pdC1MaW1pdCcpOwogICAgY29uc3QgcmVtYWluaW5nID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoJ1gtUmF0ZUxpbWl0LVJlbWFpbmluZycpOwogICAgY29uc3QgcmVzZXQgPSByZXNwb25zZS5oZWFkZXJzLmdldCgnWC1SYXRlTGltaXQtUmVzZXQnKTsKICAgIAogICAgaWYgKGxpbWl0ICYmIHJlbWFpbmluZyAmJiByZXNldCkgewogICAgICAgIGNvbnN0IHVzYWdlID0gKChsaW1pdCAtIHJlbWFpbmluZykgLyBsaW1pdCAqIDEwMCkudG9GaXhlZCgxKTsKICAgICAgICBjb25zb2xlLmxvZyhg8J+UhCBSYXRlIExpbWl0IFN0YXR1czpgLCB7CiAgICAgICAgICAgIGxpbWl0OiBgJHtsaW1pdH0gcmVxdWVzdHMvaG91cmAsCiAgICAgICAgICAgIHJlbWFpbmluZzogYCR7cmVtYWluaW5nfSByZXF1ZXN0cyBsZWZ0YCwKICAgICAgICAgICAgcmVzZXRJbjogYCR7cmVzZXR9IHNlY29uZHNgLAogICAgICAgICAgICB1c2FnZTogYCR7dXNhZ2V9JSB1c2VkYAogICAgICAgIH0pOwogICAgICAgIAogICAgICAgIC8vIFdhcm4gd2hlbiBnZXR0aW5nIGNsb3NlIHRvIGxpbWl0CiAgICAgICAgaWYgKHJlbWFpbmluZyA8IDEwKSB7CiAgICAgICAgICAgIGNvbnNvbGUud2Fybihg4pqg77iPIFJhdGUgbGltaXQgd2FybmluZzogT25seSAke3JlbWFpbmluZ30gcmVxdWVzdHMgcmVtYWluaW5nIWApOwogICAgICAgIH0KICAgICAgICAKICAgICAgICBpZiAocmVtYWluaW5nIDwgNSkgewogICAgICAgICAgICBjb25zb2xlLmVycm9yKGDwn5qoIENSSVRJQ0FMOiBPbmx5ICR7cmVtYWluaW5nfSByZXF1ZXN0cyByZW1haW5pbmchIENvbnNpZGVyIHNsb3dpbmcgZG93biBBUEkgY2FsbHMuYCk7CiAgICAgICAgfQogICAgICAgIAogICAgICAgIHJldHVybiB7IGxpbWl0OiBwYXJzZUludChsaW1pdCksIHJlbWFpbmluZzogcGFyc2VJbnQocmVtYWluaW5nKSwgcmVzZXQ6IHBhcnNlSW50KHJlc2V0KSwgdXNhZ2U6IHBhcnNlRmxvYXQodXNhZ2UpIH07CiAgICB9CiAgICByZXR1cm4gbnVsbDsKfQoKLy8gRW5oYW5jZWQgZXJyb3IgaGFuZGxpbmcgZm9yIEFQSSByZXNwb25zZXMKYXN5bmMgZnVuY3Rpb24gaGFuZGxlQVBJUmVzcG9uc2UocmVzcG9uc2UsIGFwaU5hbWUpIHsKICAgIC8vIENoZWNrIHJhdGUgbGltaXRpbmcgZmlyc3QKICAgIGNvbnN0IHJhdGVMaW1pdEluZm8gPSBjaGVja1JhdGVMaW1pdChyZXNwb25zZSk7CiAgICAKICAgIC8vIEhhbmRsZSByYXRlIGxpbWl0aW5nICg0Mjkgc3RhdHVzKQogICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDI5KSB7CiAgICAgICAgY29uc3QgcmV0cnlBZnRlciA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdSZXRyeS1BZnRlcicpOwogICAgICAgIGNvbnNvbGUuZXJyb3IoYPCfmqsgUmF0ZSBsaW1pdGVkIG9uICR7YXBpTmFtZX0hIFJldHJ5IGFmdGVyICR7cmV0cnlBZnRlcn0gc2Vjb25kc2ApOwogICAgICAgIHRocm93IG5ldyBFcnJvcihgUmF0ZSBsaW1pdGVkLiBQbGVhc2Ugd2FpdCAke3JldHJ5QWZ0ZXJ9IHNlY29uZHMgYmVmb3JlIHRyeWluZyBhZ2Fpbi5gKTsKICAgIH0KICAgIAogICAgLy8gSGFuZGxlIGF1dGhlbnRpY2F0aW9uIGVycm9ycwogICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxIHx8IHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAzKSB7CiAgICAgICAgY29uc29sZS53YXJuKGDwn5SQIEF1dGhlbnRpY2F0aW9uIGVycm9yIG9uICR7YXBpTmFtZX06ICR7cmVzcG9uc2Uuc3RhdHVzfWApOwogICAgICAgIGhhbmRsZVRva2VuRXhwaXJhdGlvbigpOwogICAgICAgIHJldHVybiBudWxsOwogICAgfQogICAgCiAgICAvLyBIYW5kbGUgb3RoZXIgSFRUUCBlcnJvcnMKICAgIGlmICghcmVzcG9uc2Uub2spIHsKICAgICAgICBjb25zdCBjb250ZW50VHlwZSA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKTsKICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YDsKICAgICAgICBsZXQgaXNCbG9ja2VkID0gZmFsc2U7CiAgICAgICAgbGV0IGlzQ3JpdGljYWwgPSBmYWxzZTsKICAgICAgICAKICAgICAgICB0cnkgewogICAgICAgICAgICBpZiAoY29udGVudFR5cGUgJiYgY29udGVudFR5cGUuaW5jbHVkZXMoJ2FwcGxpY2F0aW9uL2pzb24nKSkgewogICAgICAgICAgICAgICAgY29uc3QgZXJyb3JEYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpOwogICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gZXJyb3JEYXRhLm1lc3NhZ2UgfHwgZXJyb3JEYXRhLmVycm9yIHx8IGVycm9yTWVzc2FnZTsKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIE9TTSBibG9ja2luZy9jcml0aWNhbCBlcnJvcnMKICAgICAgICAgICAgICAgIGlmIChlcnJvckRhdGEuZXJyb3IgJiYgdHlwZW9mIGVycm9yRGF0YS5lcnJvciA9PT0gJ3N0cmluZycpIHsKICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvckxvd2VyID0gZXJyb3JEYXRhLmVycm9yLnRvTG93ZXJDYXNlKCk7CiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yTG93ZXIuaW5jbHVkZXMoJ2Jsb2NrZWQnKSB8fCBlcnJvckxvd2VyLmluY2x1ZGVzKCdwZXJtYW5lbnRseSBibG9ja2VkJykpIHsKICAgICAgICAgICAgICAgICAgICAgICAgaXNCbG9ja2VkID0gdHJ1ZTsKICAgICAgICAgICAgICAgICAgICAgICAgaXNDcml0aWNhbCA9IHRydWU7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgfQogICAgICAgICAgICB9IGVsc2UgewogICAgICAgICAgICAgICAgLy8gSWYgbm90IEpTT04sIGdldCB0ZXh0IChidXQgbGltaXQgaXQpCiAgICAgICAgICAgICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7CiAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBlcnJvclRleHQuc3Vic3RyaW5nKDAsIDIwMCk7CiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBibG9ja2luZyBpbiBIVE1ML3RleHQgcmVzcG9uc2VzCiAgICAgICAgICAgICAgICBjb25zdCBlcnJvckxvd2VyID0gZXJyb3JUZXh0LnRvTG93ZXJDYXNlKCk7CiAgICAgICAgICAgICAgICBpZiAoZXJyb3JMb3dlci5pbmNsdWRlcygnYmxvY2tlZCcpIHx8IGVycm9yTG93ZXIuaW5jbHVkZXMoJ3Blcm1hbmVudGx5IGJsb2NrZWQnKSkgewogICAgICAgICAgICAgICAgICAgIGlzQmxvY2tlZCA9IHRydWU7CiAgICAgICAgICAgICAgICAgICAgaXNDcml0aWNhbCA9IHRydWU7CiAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIGlmIChlcnJvclRleHQuaW5jbHVkZXMoJzwhZG9jdHlwZScpIHx8IGVycm9yVGV4dC5pbmNsdWRlcygnPGh0bWwnKSkgewogICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGBTZXJ2ZXIgcmV0dXJuZWQgSFRNTCBlcnJvciBwYWdlIGluc3RlYWQgb2YgSlNPTiAobGlrZWx5IE9TTSBBUEkgaXNzdWUpYDsKICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgfQogICAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyb3IpIHsKICAgICAgICAgICAgY29uc29sZS53YXJuKGBDb3VsZCBub3QgcGFyc2UgZXJyb3IgcmVzcG9uc2UgZnJvbSAke2FwaU5hbWV9OmAsIHBhcnNlRXJyb3IpOwogICAgICAgIH0KICAgICAgICAKICAgICAgICAvLyBIYW5kbGUgY3JpdGljYWwgYmxvY2tpbmcgZXJyb3JzCiAgICAgICAgaWYgKGlzQmxvY2tlZCkgewogICAgICAgICAgICBjb25zb2xlLmVycm9yKGDwn5qoIENSSVRJQ0FMOiBPU00gQVBJIEJMT0NLRUQgb24gJHthcGlOYW1lfSFgLCBlcnJvck1lc3NhZ2UpOwogICAgICAgICAgICAKICAgICAgICAgICAgLy8gQ2hlY2sgaWYgd2UncmUgaW4gYSB0ZXN0IGVudmlyb25tZW50CiAgICAgICAgICAgIGNvbnN0IGlzVGVzdEVudmlyb25tZW50ID0gdHlwZW9mIGplc3QgIT09ICd1bmRlZmluZWQnIHx8IAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5uYXZpZ2F0b3IgJiYgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQgPT09ICdqc2RvbScpOwogICAgICAgICAgICAKICAgICAgICAgICAgaWYgKCFpc1Rlc3RFbnZpcm9ubWVudCAmJiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuYWxlcnQpIHsKICAgICAgICAgICAgICAgIGFsZXJ0KGBDUklUSUNBTCBFUlJPUjogT1NNIEFQSSBBY2Nlc3MgQmxvY2tlZCFcXG5cXG5gICsKICAgICAgICAgICAgICAgICAgICAgIGBFcnJvcjogJHtlcnJvck1lc3NhZ2V9XFxuXFxuYCArCiAgICAgICAgICAgICAgICAgICAgICBgVGhpcyBhcHBsaWNhdGlvbiBoYXMgYmVlbiBibG9ja2VkIGJ5IE9ubGluZSBTY291dCBNYW5hZ2VyLiBgICsKICAgICAgICAgICAgICAgICAgICAgIGBQbGVhc2UgY29udGFjdCB0aGUgc3lzdGVtIGFkbWluaXN0cmF0b3IgaW1tZWRpYXRlbHkuYCk7CiAgICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDUklUSUNBTCBFUlJPUjogT1NNIEFQSSBBY2Nlc3MgQmxvY2tlZCEnLCBlcnJvck1lc3NhZ2UpOwogICAgICAgICAgICB9CiAgICAgICAgICAgIAogICAgICAgICAgICAvLyBEaXNhYmxlIGZ1cnRoZXIgQVBJIGNhbGxzCiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ29zbV9ibG9ja2VkJywgJ3RydWUnKTsKICAgICAgICAgICAgCiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgT1NNIEFQSSBCTE9DS0VEOiAke2Vycm9yTWVzc2FnZX1gKTsKICAgICAgICB9CiAgICAgICAgCiAgICAgICAgY29uc29sZS5lcnJvcihg4p2MICR7YXBpTmFtZX0gQVBJIGVycm9yOmAsIGVycm9yTWVzc2FnZSk7CiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2FwaU5hbWV9IGZhaWxlZDogJHtlcnJvck1lc3NhZ2V9YCk7CiAgICB9CiAgICAKICAgIC8vIFBhcnNlIEpTT04gcmVzcG9uc2UKICAgIHRyeSB7CiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsKICAgICAgICAKICAgICAgICAvLyBDaGVjayBmb3IgdG9rZW4gZXhwaXJhdGlvbiBpbiByZXNwb25zZSBkYXRhCiAgICAgICAgaWYgKCFpc1Rva2VuVmFsaWQoZGF0YSkpIHsKICAgICAgICAgICAgY29uc29sZS53YXJuKGDwn5SQIFRva2VuIGludmFsaWQgaW4gJHthcGlOYW1lfSByZXNwb25zZWApOwogICAgICAgICAgICBoYW5kbGVUb2tlbkV4cGlyYXRpb24oKTsKICAgICAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgICAgfQogICAgICAgIAogICAgICAgIHJldHVybiBkYXRhOwogICAgfSBjYXRjaCAoanNvbkVycm9yKSB7CiAgICAgICAgY29uc3QgcmVzcG9uc2VUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpOwogICAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCAke2FwaU5hbWV9IHJldHVybmVkIGludmFsaWQgSlNPTjpgLCB7CiAgICAgICAgICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLAogICAgICAgICAgICBjb250ZW50VHlwZTogcmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpLAogICAgICAgICAgICByZXNwb25zZVByZXZpZXc6IHJlc3BvbnNlVGV4dC5zdWJzdHJpbmcoMCwgMjAwKQogICAgICAgIH0pOwogICAgICAgIHRocm93IG5ldyBFcnJvcihgJHthcGlOYW1lfSByZXR1cm5lZCBpbnZhbGlkIEpTT04gcmVzcG9uc2VgKTsKICAgIH0KfQoKZXhwb3J0IGZ1bmN0aW9uIGdldFRva2VuKCkgewogICAgcmV0dXJuIHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ2FjY2Vzc190b2tlbicpOyAvLyA8LS0gY2hhbmdlZAp9CgovLyBBZGQgdG9rZW4gdmFsaWRhdGlvbiBmdW5jdGlvbjoKZXhwb3J0IGZ1bmN0aW9uIGlzVG9rZW5WYWxpZChyZXNwb25zZURhdGEpIHsKICAgIC8vIENoZWNrIGlmIHRoZSByZXNwb25zZSBpbmRpY2F0ZXMgdG9rZW4gZXhwaXJhdGlvbiBvciBhdXRoZW50aWNhdGlvbiBlcnJvcnMKICAgIGlmIChyZXNwb25zZURhdGEgJiYgKAogICAgICAgIChyZXNwb25zZURhdGEuc3RhdHVzID09PSBmYWxzZSAmJiByZXNwb25zZURhdGEuZXJyb3IgJiYgcmVzcG9uc2VEYXRhLmVycm9yLmNvZGUgPT09ICdhY2Nlc3MtZXJyb3ItMicpIHx8CiAgICAgICAgcmVzcG9uc2VEYXRhLmVycm9yID09PSAnSW52YWxpZCBhY2Nlc3MgdG9rZW4nIHx8CiAgICAgICAgcmVzcG9uc2VEYXRhLm1lc3NhZ2UgPT09ICdVbmF1dGhvcml6ZWQnIHx8CiAgICAgICAgcmVzcG9uc2VEYXRhLmVycm9yID09PSAnVG9rZW4gZXhwaXJlZCcKICAgICkpIHsKICAgICAgICByZXR1cm4gZmFsc2U7CiAgICB9CiAgICByZXR1cm4gdHJ1ZTsKfQoKZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZVRva2VuRXhwaXJhdGlvbigpIHsKICAgIGNvbnNvbGUubG9nKCdUb2tlbiBleHBpcmVkIC0gcmVkaXJlY3RpbmcgdG8gbG9naW4nKTsKICAgIC8vIENsZWFyIGV4cGlyZWQgdG9rZW4KICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oJ2FjY2Vzc190b2tlbicpOwogICAgCiAgICAvLyBDbGVhciBhbnkgY2FjaGVkIGRhdGEKICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd2aWtpbmdfc2VjdGlvbnNfY2FjaGUnKTsKICAgIAogICAgLy8gQ2hlY2sgaWYgd2UncmUgaW4gYSB0ZXN0IGVudmlyb25tZW50IChKZXN0L0pTRE9NKQogICAgY29uc3QgaXNUZXN0RW52aXJvbm1lbnQgPSB0eXBlb2YgamVzdCAhPT0gJ3VuZGVmaW5lZCcgfHwgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5uYXZpZ2F0b3IgJiYgd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQgPT09ICdqc2RvbScpOwogICAgCiAgICBpZiAoaXNUZXN0RW52aXJvbm1lbnQpIHsKICAgICAgICBjb25zb2xlLmxvZygnVGVzdCBlbnZpcm9ubWVudCBkZXRlY3RlZCAtIHNraXBwaW5nIGFsZXJ0IGFuZCBwYWdlIHJlbG9hZCcpOwogICAgICAgIHJldHVybjsKICAgIH0KICAgIAogICAgLy8gU2hvdyBhIG1lc3NhZ2UgdG8gdGhlIHVzZXIgKGJyb3dzZXIgb25seSkKICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuYWxlcnQpIHsKICAgICAgICBhbGVydCgnWW91ciBzZXNzaW9uIGhhcyBleHBpcmVkLiBQbGVhc2UgbG9nIGluIGFnYWluLicpOwogICAgfQogICAgCiAgICAvLyBGb3JjZSBhIGZ1bGwgcGFnZSByZWxvYWQgdG8gcmVzZXQgdGhlIGFwcCBzdGF0ZSAoYnJvd3NlciBvbmx5KQogICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5sb2NhdGlvbikgewogICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTsKICAgIH0KfQoKLy8gQ2xlYXIgYXV0aGVudGljYXRpb24gdG9rZW4gKGxvZ291dCkKZXhwb3J0IGZ1bmN0aW9uIGNsZWFyVG9rZW4oKSB7CiAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKCdhY2Nlc3NfdG9rZW4nKTsKICAgIGNvbnNvbGUubG9nKCdBdXRoZW50aWNhdGlvbiB0b2tlbiBjbGVhcmVkJyk7Cn0KCi8vIENoZWNrIGlmIHVzZXIgaXMgYXV0aGVudGljYXRlZApleHBvcnQgZnVuY3Rpb24gaXNBdXRoZW50aWNhdGVkKCkgewogICAgcmV0dXJuICEhZ2V0VG9rZW4oKTsKfQoKZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFRlcm1zRm9yU2VjdGlvbihzZWN0aW9uSWQpIHsKICAgIGNvbnN0IHRva2VuID0gZ2V0VG9rZW4oKTsKICAgIGlmICghdG9rZW4pIHJldHVybiBbXTsKICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7QkFDS0VORF9VUkx9L2dldC10ZXJtc2AsIHsKICAgICAgICBtZXRob2Q6ICdQT1NUJywKICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFjY2Vzc190b2tlbjogdG9rZW4gfSkKICAgIH0pOwogICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsKICAgIHJldHVybiBkYXRhW3NlY3Rpb25JZF0gfHwgW107Cn0KCmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNb3N0UmVjZW50VGVybUlkKHNlY3Rpb25JZCkgewogICAgdHJ5IHsKICAgICAgICBjb25zdCB0b2tlbiA9IGdldFRva2VuKCk7CiAgICAgICAgaWYgKCF0b2tlbikgewogICAgICAgICAgICBoYW5kbGVUb2tlbkV4cGlyYXRpb24oKTsKICAgICAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgICAgfQoKICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9nZXQtdGVybXNgLCB7CiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLAogICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyAKICAgICAgICAgICAgICAgIGFjY2Vzc190b2tlbjogdG9rZW4sCiAgICAgICAgICAgICAgICBzZWN0aW9uaWQ6IHNlY3Rpb25JZCAKICAgICAgICAgICAgfSkKICAgICAgICB9KTsKCiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykgewogICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEgfHwgcmVzcG9uc2Uuc3RhdHVzID09PSA0MDMpIHsKICAgICAgICAgICAgICAgIGhhbmRsZVRva2VuRXhwaXJhdGlvbigpOwogICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgICAgICAgIH0KICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQIGVycm9yISBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApOwogICAgICAgIH0KCiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTsKICAgICAgICBjb25zb2xlLmxvZygnVGVybXMgQVBJIHJlc3BvbnNlIGZvciBzZWN0aW9uJywgc2VjdGlvbklkLCAnOicsIGRhdGEpOwogICAgICAgIAogICAgICAgIC8vIENoZWNrIGZvciB0b2tlbiBleHBpcmF0aW9uIGluIHJlc3BvbnNlIGRhdGEKICAgICAgICBpZiAoIWlzVG9rZW5WYWxpZChkYXRhKSkgewogICAgICAgICAgICBoYW5kbGVUb2tlbkV4cGlyYXRpb24oKTsKICAgICAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgICAgfQogICAgICAgIAogICAgICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgcmVzcG9uc2UgZm9ybWF0cwogICAgICAgIGxldCB0ZXJtc0FycmF5ID0gbnVsbDsKICAgICAgICAKICAgICAgICBpZiAoZGF0YS5pdGVtcyAmJiBBcnJheS5pc0FycmF5KGRhdGEuaXRlbXMpKSB7CiAgICAgICAgICAgIC8vIEZvcm1hdDogeyBpdGVtczogWy4uLl0gfQogICAgICAgICAgICB0ZXJtc0FycmF5ID0gZGF0YS5pdGVtczsKICAgICAgICB9IGVsc2UgaWYgKGRhdGFbc2VjdGlvbklkXSAmJiBBcnJheS5pc0FycmF5KGRhdGFbc2VjdGlvbklkXSkpIHsKICAgICAgICAgICAgLy8gRm9ybWF0OiB7IFwic2VjdGlvbklkXCI6IFsuLi5dIH0KICAgICAgICAgICAgdGVybXNBcnJheSA9IGRhdGFbc2VjdGlvbklkXTsKICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHsKICAgICAgICAgICAgLy8gRm9ybWF0OiBbLi4uXQogICAgICAgICAgICB0ZXJtc0FycmF5ID0gZGF0YTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgICBjb25zb2xlLndhcm4oJ1VuZXhwZWN0ZWQgdGVybXMgcmVzcG9uc2UgZm9ybWF0OicsIGRhdGEpOwogICAgICAgICAgICByZXR1cm4gbnVsbDsKICAgICAgICB9CiAgICAgICAgCiAgICAgICAgaWYgKCF0ZXJtc0FycmF5IHx8IHRlcm1zQXJyYXkubGVuZ3RoID09PSAwKSB7CiAgICAgICAgICAgIGNvbnNvbGUud2FybignTm8gdGVybXMgZm91bmQgZm9yIHNlY3Rpb246Jywgc2VjdGlvbklkKTsKICAgICAgICAgICAgcmV0dXJuIG51bGw7CiAgICAgICAgfQoKICAgICAgICAvLyBTb3J0IHRlcm1zIGJ5IHN0YXJ0IGRhdGUgKG1vc3QgcmVjZW50IGZpcnN0KQogICAgICAgIGNvbnN0IHNvcnRlZFRlcm1zID0gdGVybXNBcnJheS5zb3J0KChhLCBiKSA9PiB7CiAgICAgICAgICAgIGNvbnN0IGRhdGVBID0gbmV3IERhdGUoYS5zdGFydGRhdGUpOwogICAgICAgICAgICBjb25zdCBkYXRlQiA9IG5ldyBEYXRlKGIuc3RhcnRkYXRlKTsKICAgICAgICAgICAgcmV0dXJuIGRhdGVCIC0gZGF0ZUE7IC8vIERlc2NlbmRpbmcgb3JkZXIgKG5ld2VzdCBmaXJzdCkKICAgICAgICB9KTsKCiAgICAgICAgY29uc3QgbW9zdFJlY2VudFRlcm0gPSBzb3J0ZWRUZXJtc1swXTsKICAgICAgICBjb25zb2xlLmxvZygnTW9zdCByZWNlbnQgdGVybSBmb3VuZCBmb3Igc2VjdGlvbicsIHNlY3Rpb25JZCwgJzonLCBtb3N0UmVjZW50VGVybSk7CiAgICAgICAgcmV0dXJuIG1vc3RSZWNlbnRUZXJtLnRlcm1pZDsKCiAgICB9IGNhdGNoIChlcnJvcikgewogICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIG1vc3QgcmVjZW50IHRlcm0gSUQ6JywgZXJyb3IpOwogICAgICAgIHJldHVybiBudWxsOwogICAgfQp9CgovLyBVcGRhdGUgeW91ciBnZXRVc2VyUm9sZXMgZnVuY3Rpb24gdG8gY2hlY2sgZm9yIHRva2VuIGV4cGlyYXRpb246CmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRVc2VyUm9sZXMoKSB7CiAgICB0cnkgewogICAgICAgIGNvbnN0IHRva2VuID0gZ2V0VG9rZW4oKTsKICAgICAgICBpZiAoIXRva2VuKSB7CiAgICAgICAgICAgIGhhbmRsZVRva2VuRXhwaXJhdGlvbigpOwogICAgICAgICAgICByZXR1cm4gW107CiAgICAgICAgfQoKICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9nZXQtdXNlci1yb2xlc2AsIHsKICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsCiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFjY2Vzc190b2tlbjogdG9rZW4gfSkKICAgICAgICB9KTsKICAgICAgICAKICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7CiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDQwMSB8fCByZXNwb25zZS5zdGF0dXMgPT09IDQwMykgewogICAgICAgICAgICAgICAgaGFuZGxlVG9rZW5FeHBpcmF0aW9uKCk7CiAgICAgICAgICAgICAgICByZXR1cm4gW107CiAgICAgICAgICAgIH0KICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQIGVycm9yISBzdGF0dXM6ICR7cmVzcG9uc2Uuc3RhdHVzfWApOwogICAgICAgIH0KICAgICAgICAKICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpOwogICAgICAgIAogICAgICAgIC8vIENoZWNrIGZvciB0b2tlbiBleHBpcmF0aW9uIGluIHJlc3BvbnNlIGRhdGEKICAgICAgICBpZiAoIWlzVG9rZW5WYWxpZChkYXRhKSkgewogICAgICAgICAgICBoYW5kbGVUb2tlbkV4cGlyYXRpb24oKTsKICAgICAgICAgICAgcmV0dXJuIFtdOwogICAgICAgIH0KICAgICAgICAKICAgICAgICByZXR1cm4gZGF0YTsKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgdXNlciByb2xlczonLCBlcnJvcik7CiAgICAgICAgLy8gSWYgaXQncyBhIG5ldHdvcmsgZXJyb3IsIGRvbid0IHJlZGlyZWN0IC0gbWlnaHQgYmUgdGVtcG9yYXJ5CiAgICAgICAgdGhyb3cgZXJyb3I7CiAgICB9Cn0KCmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRFdmVudHMoc2VjdGlvbmlkLCB0ZXJtaWQpIHsKICAgIHRyeSB7CiAgICAgICAgY29uc3QgdG9rZW4gPSBnZXRUb2tlbigpOwogICAgICAgIGlmICghdG9rZW4pIHsKICAgICAgICAgICAgaGFuZGxlVG9rZW5FeHBpcmF0aW9uKCk7CiAgICAgICAgICAgIHJldHVybiB7IGl0ZW1zOiBbXSB9OwogICAgICAgIH0KCiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtCQUNLRU5EX1VSTH0vZ2V0LWV2ZW50c2AsIHsKICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsCiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFjY2Vzc190b2tlbjogdG9rZW4sIHNlY3Rpb25pZCwgdGVybWlkIH0pCiAgICAgICAgfSk7CgogICAgICAgIGlmICghcmVzcG9uc2Uub2spIHsKICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxIHx8IHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAzKSB7CiAgICAgICAgICAgICAgICBoYW5kbGVUb2tlbkV4cGlyYXRpb24oKTsKICAgICAgICAgICAgICAgIHJldHVybiB7IGl0ZW1zOiBbXSB9OwogICAgICAgICAgICB9CiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCBlcnJvciEgc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c31gKTsKICAgICAgICB9CgogICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7CiAgICAgICAgCiAgICAgICAgLy8gQ2hlY2sgZm9yIHRva2VuIGV4cGlyYXRpb24gaW4gcmVzcG9uc2UgZGF0YQogICAgICAgIGlmICghaXNUb2tlblZhbGlkKGRhdGEpKSB7CiAgICAgICAgICAgIGhhbmRsZVRva2VuRXhwaXJhdGlvbigpOwogICAgICAgICAgICByZXR1cm4geyBpdGVtczogW10gfTsKICAgICAgICB9CgogICAgICAgIHJldHVybiBkYXRhOwogICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBldmVudHM6JywgZXJyb3IpOwogICAgICAgIHRocm93IGVycm9yOwogICAgfQp9CgpleHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RXZlbnRBdHRlbmRhbmNlKHNlY3Rpb25JZCwgZXZlbnRJZCwgdGVybUlkKSB7CiAgICB0cnkgewogICAgICAgIGNvbnN0IHRva2VuID0gZ2V0VG9rZW4oKTsKICAgICAgICBpZiAoIXRva2VuKSB7CiAgICAgICAgICAgIGhhbmRsZVRva2VuRXhwaXJhdGlvbigpOwogICAgICAgICAgICByZXR1cm4geyBpdGVtczogW10gfTsKICAgICAgICB9CgogICAgICAgIGNvbnNvbGUubG9nKCdBUEkgY2FsbCB3aXRoIHBhcmFtczonLCB7IHNlY3Rpb25JZCwgZXZlbnRJZCwgdGVybUlkIH0pOwoKICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9nZXQtZXZlbnQtYXR0ZW5kYW5jZWAsIHsKICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsCiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IAogICAgICAgICAgICAgICAgYWNjZXNzX3Rva2VuOiB0b2tlbiwgCiAgICAgICAgICAgICAgICBzZWN0aW9uaWQ6IHNlY3Rpb25JZCwgCiAgICAgICAgICAgICAgICBldmVudGlkOiBldmVudElkLAogICAgICAgICAgICAgICAgdGVybWlkOiB0ZXJtSWQKICAgICAgICAgICAgfSkKICAgICAgICB9KTsKCiAgICAgICAgY29uc29sZS5sb2coJ0FQSSByZXNwb25zZSBzdGF0dXM6JywgcmVzcG9uc2Uuc3RhdHVzKTsKCiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykgewogICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEgfHwgcmVzcG9uc2Uuc3RhdHVzID09PSA0MDMpIHsKICAgICAgICAgICAgICAgIGhhbmRsZVRva2VuRXhwaXJhdGlvbigpOwogICAgICAgICAgICAgICAgcmV0dXJuIHsgaXRlbXM6IFtdIH07CiAgICAgICAgICAgIH0KICAgICAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpOwogICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBUEkgZXJyb3IgcmVzcG9uc2U6JywgZXJyb3JUZXh0KTsKICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggZXZlbnQgYXR0ZW5kYW5jZTogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtlcnJvclRleHR9YCk7CiAgICAgICAgfQoKICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpOwogICAgICAgIGNvbnNvbGUubG9nKCdBUEkgcmVzcG9uc2UgZGF0YTonLCBkYXRhKTsKICAgICAgICAKICAgICAgICAvLyBDaGVjayBmb3IgdG9rZW4gZXhwaXJhdGlvbiBpbiByZXNwb25zZSBkYXRhCiAgICAgICAgaWYgKCFpc1Rva2VuVmFsaWQoZGF0YSkpIHsKICAgICAgICAgICAgaGFuZGxlVG9rZW5FeHBpcmF0aW9uKCk7CiAgICAgICAgICAgIHJldHVybiB7IGl0ZW1zOiBbXSB9OwogICAgICAgIH0KCiAgICAgICAgcmV0dXJuIGRhdGE7CiAgICB9IGNhdGNoIChlcnJvcikgewogICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIGV2ZW50IGF0dGVuZGFuY2U6JywgZXJyb3IpOwogICAgICAgIHRocm93IGVycm9yOwogICAgfQp9CgpleHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RmxleGlSZWNvcmRzKHNlY3Rpb25JZCwgYXJjaGl2ZWQgPSAnbicpIHsKICAgIHRyeSB7CiAgICAgICAgLy8gQ2hlY2sgaWYgQVBJIGFjY2VzcyBoYXMgYmVlbiBibG9ja2VkCiAgICAgICAgY2hlY2tJZkJsb2NrZWQoKTsKICAgICAgICAKICAgICAgICBjb25zdCB0b2tlbiA9IGdldFRva2VuKCk7CiAgICAgICAgaWYgKCF0b2tlbikgewogICAgICAgICAgICBoYW5kbGVUb2tlbkV4cGlyYXRpb24oKTsKICAgICAgICAgICAgcmV0dXJuIHsgaXRlbXM6IFtdIH07CiAgICAgICAgfQoKICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9nZXQtZmxleGktcmVjb3Jkc2AsIHsKICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsCiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LAogICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7CiAgICAgICAgICAgICAgICBhY2Nlc3NfdG9rZW46IHRva2VuLAogICAgICAgICAgICAgICAgc2VjdGlvbmlkOiBzZWN0aW9uSWQsCiAgICAgICAgICAgICAgICBhcmNoaXZlZDogYXJjaGl2ZWQKICAgICAgICAgICAgfSkKICAgICAgICB9KTsKCiAgICAgICAgLy8gVXNlIGVuaGFuY2VkIGVycm9yIGhhbmRsaW5nCiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGhhbmRsZUFQSVJlc3BvbnNlKHJlc3BvbnNlLCAnZ2V0RmxleGlSZWNvcmRzJyk7CiAgICAgICAgaWYgKGRhdGEgPT09IG51bGwpIHJldHVybiB7IGl0ZW1zOiBbXSB9OyAvLyBUb2tlbiBleHBpcmVkCgogICAgICAgIHJldHVybiBkYXRhOwoKICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgZmxleGkgcmVjb3JkczonLCBlcnJvcik7CiAgICAgICAgdGhyb3cgZXJyb3I7CiAgICB9Cn0KCi8vIFRlc3QgYmFja2VuZCBjb25uZWN0aXZpdHkKZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RCYWNrZW5kQ29ubmVjdGlvbigpIHsKICAgIHRyeSB7CiAgICAgICAgY29uc29sZS5sb2coJ1Rlc3RpbmcgYmFja2VuZCBjb25uZWN0aW9uIHRvOicsIEJBQ0tFTkRfVVJMKTsKICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAke0JBQ0tFTkRfVVJMfS9oZWFsdGhgLCB7CiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsCiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9CiAgICAgICAgfSk7CiAgICAgICAgCiAgICAgICAgY29uc29sZS5sb2coJ0JhY2tlbmQgY29ubmVjdGlvbiB0ZXN0IC0gU3RhdHVzOicsIHJlc3BvbnNlLnN0YXR1cyk7CiAgICAgICAgCiAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7CiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7CiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCYWNrZW5kIGNvbm5lY3Rpb24gdGVzdCAtIFJlc3BvbnNlOicsIGRhdGEpOwogICAgICAgICAgICByZXR1cm4gdHJ1ZTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgICBjb25zb2xlLmVycm9yKCdCYWNrZW5kIGNvbm5lY3Rpb24gdGVzdCBmYWlsZWQ6JywgcmVzcG9uc2Uuc3RhdHVzKTsKICAgICAgICAgICAgcmV0dXJuIGZhbHNlOwogICAgICAgIH0KICAgIH0gY2F0Y2ggKGVycm9yKSB7CiAgICAgICAgY29uc29sZS5lcnJvcignQmFja2VuZCBjb25uZWN0aW9uIHRlc3QgZXJyb3I6JywgZXJyb3IpOwogICAgICAgIHJldHVybiBmYWxzZTsKICAgIH0KfSJdfQo=
