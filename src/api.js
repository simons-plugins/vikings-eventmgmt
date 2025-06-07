const BACKEND_URL = 'https://vikings-osm-event-manager.onrender.com';

export function getToken() {
    return sessionStorage.getItem('access_token'); // <-- changed
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
    const terms = await getTermsForSection(sectionId);
    if (!terms.length) return null;
    terms.sort((a, b) => new Date(b.enddate) - new Date(a.enddate));
    return terms[0].termid;
}

export async function getUserRoles() {
    const token = getToken();
    const response = await fetch(`${BACKEND_URL}/get-user-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token })
    });
    return response.json();
}

export async function getEvents(sectionid, termid) {
    const token = getToken();
    const resp = await fetch(`${BACKEND_URL}/get-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token, sectionid, termid })
    });
    return resp.json();
}

export async function getEventAttendance(sectionId, eventId, termId) {
    const token = getToken();
    if (!token) throw new Error('No access token');

    console.log('API call with params:', { sectionId, eventId, termId });

    const response = await fetch(`${BACKEND_URL}/get-event-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            access_token: token, 
            sectionid: sectionId, 
            eventid: eventId,
            termid: termId  // Add the missing termid parameter
        })
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch event attendance: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    return data;
}