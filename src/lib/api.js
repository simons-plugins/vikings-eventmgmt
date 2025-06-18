// src/lib/api.js
// This module is the central handler for all HTTP requests to the backend API.
// It abstracts data fetching logic, including token management, error handling,
// and rate limit monitoring, providing a consistent interface for API interactions.

// Imports from auth.js
import { getToken, isTokenValid, handleTokenExpiration } from './auth.js';

// Always use production backend - simplifies configuration and avoids local setup issues
const BACKEND_URL = 'https://vikings-osm-event-manager.onrender.com';

console.log('Using Backend URL:', BACKEND_URL);

// Checks a sessionStorage flag ('osm_blocked') to see if OSM API access
// has been previously identified as blocked. Throws an error if blocked.
function checkIfBlocked() {
    if (sessionStorage.getItem('osm_blocked') === 'true') {
        throw new Error('OSM API access has been blocked. Please contact the system administrator.');
    }
}

// Removes the 'osm_blocked' flag from sessionStorage.
// This is intended for administrative use to re-enable API access after a block.
export function clearBlockedStatus() {
    sessionStorage.removeItem('osm_blocked');
    console.log('OSM blocked status cleared');
}

// Enhanced rate limit monitoring for backend-provided rate limit info
function logRateLimitInfo(responseData, apiName) {
    if (responseData && responseData._rateLimitInfo) {
        const info = responseData._rateLimitInfo;
        
        // Log OSM rate limit info
        if (info.osm) {
            const osm = info.osm;
            const percentUsed = osm.limit > 0 ? ((osm.limit - osm.remaining) / osm.limit * 100).toFixed(1) : 0;
            
            console.group(`🔄 ${apiName} Rate Limit Status`);
            console.log(`📊 OSM API:`, {
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
            
            console.log(`🖥️ Backend API:`, {
                remaining: `${backend.remaining}/${backend.limit}`,
                percentUsed: `${backendPercentUsed}%`,
                window: backend.window || 'per minute'
            });
        }
        
        console.groupEnd();
    } else {
        console.log(`📊 ${apiName}: No rate limit info available`);
    }
}

// Enhanced API response handler with new rate limit monitoring
async function handleAPIResponseWithRateLimit(response, apiName) {
    // Handle rate limiting (HTTP 429 Too Many Requests).
    // This can be triggered by either the OSM API or the backend itself.
    if (response.status === 429) {
        const errorData = await response.json().catch(() => ({})); // Attempt to parse error details
        
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
            // General backend rate limiting message.
            console.warn(`🚫 ${apiName} rate limited. Backend managing request flow.`);
            throw new Error('Rate limited. The backend is managing request flow to prevent blocking.');
        }
    }
    
    // Handle authentication errors (HTTP 401 Unauthorized, HTTP 403 Forbidden).
    // Triggers token expiration handling.
    if (response.status === 401 || response.status === 403) {
        console.warn(`🔐 Authentication error on ${apiName}: ${response.status}`);
        handleTokenExpiration(); // Clear token and prompt for login
        return null;
    }
    
    // Handle other non-successful HTTP responses.
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Attempt to parse error details
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`; // Extract error message
        
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
    
    // If the response is OK, attempt to parse it as JSON.
    try {
        const data = await response.json();
        
        // Log rate limit information included in the response.
        logRateLimitInfo(data, apiName);
        
        // Validate the token if present in the response data (some endpoints might return it).
        if (!isTokenValid(data)) {
            console.warn(`🔐 Token invalid in ${apiName} response`);
            handleTokenExpiration(); // Clear token and prompt for login
            return null;
        }
        
        return data; // Return the parsed data
    } catch (jsonError) {
        // Handle cases where JSON parsing fails.
        console.error(`❌ ${apiName} returned invalid JSON`);
        throw new Error(`${apiName} returned invalid response`);
    }
}

// Optional rate limit status checker.
// Fetches current rate limit status from the backend.
// Returns an object with rate limit details (osm and backend) or null on failure.
export async function checkRateLimitStatus() {
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

// Fetches all terms for all sections the user has access to.
// Returns an object where keys are section IDs and values are arrays of term objects.
// Expected term object structure: { termid: string, name: string, startdate: string, enddate: string, ... }
export async function getTerms() {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return {};
        }

        const response = await fetch(`${BACKEND_URL}/get-terms`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await handleAPIResponseWithRateLimit(response, 'getTerms');
        return data || {};

    } catch (error) {
        console.error('Error fetching terms:', error);
        throw error;
    }
}

// Fetches the most recent term ID for a given section.
// sectionId: The ID of the section.
// Returns the termid (string) of the most recent term, or null if not found or on error.
export async function getMostRecentTermId(sectionId) {
    try {
        const terms = await getTerms(); // Fetch all terms for all sections
        if (!terms || !terms[sectionId]) {
            console.warn(`No terms found for section ${sectionId}`);
            return null;
        }

        // Find the most recent term by end date
        const mostRecentTerm = terms[sectionId].reduce((latest, term) => {
            const termEndDate = new Date(term.enddate);
            const latestEndDate = latest ? new Date(latest.enddate) : new Date(0);
            return termEndDate > latestEndDate ? term : latest;
        }, null);

        if (!mostRecentTerm) {
            console.warn(`No valid term found for section ${sectionId}`);
            return null;
        }

        console.log(`Most recent term found for section ${sectionId}:`, mostRecentTerm);
        return mostRecentTerm.termid; // Return only the termid

    } catch (error) {
        console.error(`Error fetching most recent term ID for section ${sectionId}:`, error);
        throw error;
    }
}

// Fetches the roles (sections) associated with the current authenticated user.
// Returns an array of section objects.
// Expected section object structure: { sectionid: string, sectionname: string, groupname: string, ... }
export async function getUserRoles() {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return [];
        }

        const response = await fetch(`${BACKEND_URL}/get-user-roles`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await handleAPIResponseWithRateLimit(response, 'getUserRoles');

        // Handle case where data might be null/undefined
        if (!Array.isArray(data)) {
            return [];
        }

        // Filter out adults section and extract only section details
        const sections = data
            .filter(item => item.section !== 'adults') // Exclude adults section
            .map(item => ({
                sectionid: item.sectionid,
                sectionname: item.sectionname,
                section: item.section,
                isDefault: item.isDefault === "1",
                permissions: item.permissions
            }));

        return sections;

    } catch (error) {
        console.error('Error fetching user roles:', error);
        return [];
    }
}

// Fetches events for a specific section and term.
// sectionid: The ID of the section.
// termid: The ID of the term.
// Returns an object, typically { items: [...] }, where items is an array of event objects.
// Expected event object structure: { eventid: string, name: string, startdate: string, ... }
export async function getEvents(sectionId, termId) {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return [];
        }

        const response = await fetch(`${BACKEND_URL}/get-events?sectionid=${sectionId}&termid=${termId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await handleAPIResponseWithRateLimit(response, 'getEvents');
        return data || [];

    } catch (error) {
        console.error(`Error fetching events for section ${sectionId} and term ${termId}:`, error);
        throw error;
    }
}

// Fetches attendance data for a specific event.
// sectionId: The ID of the section.
// eventId: The ID of the event.
// termId: The ID of the term.
// Returns an object, typically { items: [...] }, where items is an array of attendance records.
// Expected attendance record structure: { memberid: string, firstname: string, lastname: string, attended: boolean, ... }
export async function getEventAttendance(sectionId, termId, eventId) {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return [];
        }

        const response = await fetch(`${BACKEND_URL}/get-event-attendance?sectionid=${sectionId}&termid=${termId}&eventid=${eventId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await handleAPIResponseWithRateLimit(response, 'getEventAttendance');

        if (!data || data.length === 0) {
            console.warn(`No attendance data returned for section ${sectionId}, term ${termId}, and event ${eventId}`);
        }

        return data || [];
        
    } catch (error) {
        console.error(`Error fetching event attendance for section ${sectionId}, term ${termId}, and event ${eventId}:`, error);
        throw error;
    }
}

// Fetches flexi-records for a section.
// sectionId: The ID of the section.
// archived: (Optional) 'y' to fetch archived records, 'n' for current (defaults to 'n').
// Returns an object with structure: { identifier: "extraid", label: "name", items: [...] }
// Expected item structure: { extraid: string, name: string }
export async function getFlexiRecords(sectionId, archived = 'n') {
    try {
        // Check if API access has been blocked
        checkIfBlocked();
        
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return { identifier: null, label: null, items: [] };
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
        
        // Handle the response format with _rateLimitInfo
        if (data && data._rateLimitInfo) {
            const { _rateLimitInfo, ...flexiData } = data;
            return flexiData || { identifier: null, label: null, items: [] };
        }
        
        return data || { identifier: null, label: null, items: [] };

    } catch (error) {
        console.error('Error fetching flexi records:', error);
        throw error;
    }
}

// Fetches a single flexi-attendance record by ID.
// flexirecordid: The ID of the flexi record to fetch.
// sectionid: The ID of the section.
// termid: The ID of the term.
// Returns the flexi record object if found, null otherwise.
// Expected flexi record structure: { record_id: string, member_id: string, date_given: string, ... }
export async function getSingleFlexiRecord(flexirecordid, sectionid, termid) {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return { identifier: null, items: [] };
        }

        const response = await fetch(`${BACKEND_URL}/get-single-flexi-record?flexirecordid=${flexirecordid}&sectionid=${sectionid}&termid=${termid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: token })
        });
        
        const data = await handleAPIResponseWithRateLimit(response, 'getSingleFlexiRecord');
        
        // Handle the response format with _rateLimitInfo
        if (data && data._rateLimitInfo) {
            const { _rateLimitInfo, ...flexiData } = data;
            return flexiData || { identifier: null, items: [] };
        }
        
        return data || { identifier: null, items: [] };
        
    } catch (error) {
        console.error('Error fetching single flexi record:', error);
        throw error;
    }
}

// Tests the connectivity to the backend server.
// Makes a GET request to the /health endpoint.
// Returns true if the backend responds with HTTP 200, false otherwise.
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

// Fetches flexi-attendance records for a specific section and term.
// sectionid: The ID of the section.
// termid: The ID of the term.
// Returns an object, typically { items: [...] }, where items is an array of flexi-record objects.
// Expected flexi-record structure: { record_id: string, member_id: string, date_given: string, ... }

// Fetches camp group data for attendees by finding "Viking Event Mgmt" flexi record
// and joining the camp group fields (f_1, f_2, etc.) to attendee data by scoutid
export async function enrichAttendeesWithCampGroups(attendees, selectedSectionIds) {
    try {
        const enrichedAttendees = [...attendees]; // Clone to avoid mutation
        
        // Process each selected section
        for (const sectionId of selectedSectionIds) {
            // Get the most recent term for this section
            const termId = await getMostRecentTermId(sectionId);
            if (!termId) {
                console.warn(`No term found for section ${sectionId}`);
                continue;
            }
            
            // Get flexi records list for this section
            const flexiRecords = await getFlexiRecords(sectionId);
            if (!flexiRecords || !flexiRecords.items) {
                console.warn(`No flexi records found for section ${sectionId}`);
                continue;
            }
            
            // Find "Viking Event Mgmt" record
            const vikingEventRecord = flexiRecords.items.find(item => 
                item.name === "Viking Event Mgmt"
            );
            
            if (!vikingEventRecord) {
                console.warn(`"Viking Event Mgmt" record not found for section ${sectionId}`);
                continue;
            }
            
            console.log(`Found Viking Event Mgmt record: ${vikingEventRecord.extraid} for section ${sectionId}`);
            
            // Get flexi structure to map field names
            const flexiStructure = await getFlexiStructure(vikingEventRecord.extraid, sectionId);
            const fieldMapping = {};
            
            if (flexiStructure) {
                // Method 1: Extract from config (JSON string)
                if (flexiStructure.config) {
                    try {
                        const configData = JSON.parse(flexiStructure.config);
                        configData.forEach(field => {
                            if (field.id && field.name) {
                                fieldMapping[field.id] = field.name;
                            }
                        });
                    } catch (error) {
                        console.warn('Could not parse flexi config:', error);
                    }
                }
                
                // Method 2: Extract from structure (fallback or additional mapping)
                if (flexiStructure.structure) {
                    flexiStructure.structure.forEach(section => {
                        if (section.rows) {
                            section.rows.forEach(row => {
                                if (row.field && row.field.startsWith('f_') && row.name) {
                                    fieldMapping[row.field] = row.name;
                                }
                            });
                        }
                    });
                }
                
                console.log('Field mapping extracted:', fieldMapping);
            }
            
            // Get detailed camp group data using the extraid as flexirecordid
            const campGroupData = await getSingleFlexiRecord(
                vikingEventRecord.extraid, 
                sectionId, 
                termId
            );
            
            if (!campGroupData || !campGroupData.items) {
                console.warn(`No camp group data found for section ${sectionId}`);
                continue;
            }
            
            // Create lookup map of scoutid -> camp group fields
            const campGroupLookup = {};
            
            // Find which field contains the camp group data
            const campGroupField = Object.keys(fieldMapping).find(fieldId => 
                fieldMapping[fieldId].toLowerCase().includes('campgroup') || 
                fieldMapping[fieldId].toLowerCase().includes('camp group')
            );
            
            campGroupData.items.forEach(scout => {
                const scoutCampData = {
                    // Base scout info
                    patrol: scout.patrol || '',
                    age: scout.age || ''
                };
                
                // Add all field values (both raw and mapped names)
                ['f_1', 'f_2', 'f_3', 'f_4', 'f_5'].forEach(fieldId => {
                    // Add raw field
                    scoutCampData[fieldId] = scout[fieldId] || '';
                    
                    // Add friendly mapped name if available
                    if (fieldMapping[fieldId]) {
                        const friendlyName = fieldMapping[fieldId];
                        scoutCampData[friendlyName] = scout[fieldId] || '';
                        
                        // Set campGroup convenience field if this is the camp group field
                        if (fieldId === campGroupField) {
                            scoutCampData.campGroup = scout[fieldId] || 'Unassigned';
                        }
                    }
                });
                
                // If no camp group field was found, set default
                if (!campGroupField) {
                    scoutCampData.campGroup = 'Unassigned';
                }
                
                campGroupLookup[scout.scoutid] = scoutCampData;
            });
            
            // Enrich attendees with camp group data
            enrichedAttendees.forEach(attendee => {
                if (campGroupLookup[attendee.scoutid]) {
                    Object.assign(attendee, campGroupLookup[attendee.scoutid]);
                    console.log(`Enriched ${attendee.firstname} ${attendee.lastname} with camp group: ${attendee.campGroup}`);
                }
            });
        }
        
        return enrichedAttendees;
        
    } catch (error) {
        console.error('Error enriching attendees with camp groups:', error);
        return attendees; // Return original data if enrichment fails
    }
}

// Fetches flexi record structure and field mappings for a given extraid and sectionid.
// extraid: The ID of the flexi record.
// sectionid: The ID of the section.
// Returns the flexi record structure object if found, null otherwise.
// Expected flexi record structure: { fields: { fieldname: { type: string, label: string, ... }, ... }, ... }
export async function getFlexiStructure(extraid, sectionid) {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return null;
        }

        const response = await fetch(`${BACKEND_URL}/get-flexi-structure?extraid=${extraid}&sectionid=${sectionid}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            }
        });
        
        const data = await handleAPIResponseWithRateLimit(response, 'getFlexiStructure');
        return data || null;
        
    } catch (error) {
        console.error('Error fetching flexi structure:', error);
        throw error;
    }
}

// Fetches section configuration for a given section ID.
// sectionId: The ID of the section for which to fetch configuration.
// Returns the section configuration object if found, null otherwise.
// Expected configuration object structure: { /* configuration fields */ }
export async function getSectionConfig(sectionId) {
    try {
        const token = getToken();
        if (!token) {
            handleTokenExpiration();
            return null;
        }

        const response = await fetch(`${BACKEND_URL}/get-section-config?sectionid=${sectionId}&access_token=${token}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await handleAPIResponseWithRateLimit(response, 'getSectionConfig');
        return data || null;

    } catch (error) {
        console.error('Error fetching section config:', error);
        throw error;
    }
}
