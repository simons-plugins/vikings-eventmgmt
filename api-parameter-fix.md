// Fix for getEventAttendance parameter swap
// In the getEventAttendance function, change the URL construction to:
const url = `${API_BASE_URL}/get-event-attendance?sectionid=${sectionid}&termid=${eventid}&eventid=${termid}`;

// The parameters were swapped - eventid should go to termid parameter and vice versa