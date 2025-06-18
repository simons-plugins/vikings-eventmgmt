// To integrate camp groups functionality, find where renderTabbedAttendanceView is called
// and add this code right after it:

// After: renderTabbedAttendanceView(attendees);
// Add:
try {
    await loadAndDisplayCampGroups(attendees, eventId);
} catch (error) {
    console.error('Failed to load camp groups:', error);
}

// The complete pattern should be:
// const attendees = await getEventAttendance(selectedSectionId, selectedTermId, eventId);
// if (attendees && attendees.length > 0) {
//     renderTabbedAttendanceView(attendees);
//     
//     // Load camp groups data
//     try {
//         await loadAndDisplayCampGroups(attendees, eventId);
//     } catch (error) {
//         console.error('Failed to load camp groups:', error);
//     }
// }