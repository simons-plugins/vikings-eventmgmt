// API Tests - Test all OSM API interactions
import { getUserRoles, getMostRecentTermId, getEvents, getEventAttendance } from '../src/lib/api.js';
import { getToken } from '../src/lib/auth.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Functions', () => {
    beforeEach(() => {
        fetch.mockClear();
        sessionStorage.clear();
    });

    describe('getToken', () => {
        test('should return token from sessionStorage', async () => {
            sessionStorage.setItem('access_token', 'test-token-123');
            const token = await getToken();
            expect(token).toBe('test-token-123');
        });

        test('should return null when no token exists', async () => {
            const token = await getToken();
            expect(token).toBeNull();
        });
    });

    describe('getUserRoles', () => {
        test('should fetch user roles successfully', async () => {
            const mockRoles = [
                { sectionid: '1', sectionname: '1st Guildford Scout Group' },
                { sectionid: '2', sectionname: '2nd Guildford Scout Group' }
            ];

            // Mock the new response format with numbered keys + _rateLimitInfo
            const mockResponse = {
                "0": mockRoles[0],
                "1": mockRoles[1],
                "_rateLimitInfo": {
                    "osm": { "limit": 1000, "remaining": 995 },
                    "backend": { "limit": 100, "remaining": 96 }
                }
            };

            sessionStorage.setItem('access_token', 'test-token');
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const roles = await getUserRoles();
            expect(roles).toEqual(mockRoles); // Now returns array directly
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/get-user-roles'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: expect.stringContaining('test-token')
                })
            );
        });

        test('should return empty array when API call fails', async () => {
            sessionStorage.setItem('access_token', 'test-token');
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 401
            });

            const result = await getUserRoles();
            expect(result).toEqual([]);
        });
    });

    describe('getMostRecentTermId', () => {
        test('should return most recent term ID', async () => {
            const mockTerms = {
                items: [
                    { termid: '1', name: 'Term 1', startdate: '2023-01-01' },
                    { termid: '2', name: 'Term 2', startdate: '2023-09-01' },
                    { termid: '3', name: 'Term 3', startdate: '2024-01-01' }
                ]
            };

            sessionStorage.setItem('access_token', 'test-token');
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockTerms
            });

            const termId = await getMostRecentTermId('123');
            
            // The function should return the most recent term ID
            expect(termId).toBe('3'); // Most recent term
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/get-terms'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('123')
                })
            );
            
            // Note: Update this expectation based on actual function implementation
            // expect(termId).toBe('3'); // Uncomment when function is implemented
        });

        test('should handle empty terms array', async () => {
            sessionStorage.setItem('access_token', 'test-token');
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [] })
            });

            const termId = await getMostRecentTermId('123');
            expect(termId).toBeNull();
        });
    });

    describe('getEvents', () => {
        test('should fetch events for section and term', async () => {
            const mockEvents = {
                items: [
                    { eventid: '1', name: 'Test Event 1', date: '2024-01-15' },
                    { eventid: '2', name: 'Test Event 2', date: '2024-01-22' }
                ]
            };

            sessionStorage.setItem('access_token', 'test-token');
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockEvents
            });

            const events = await getEvents('123', '456');
            expect(events).toEqual(mockEvents);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/get-events'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: expect.stringContaining('123')
                })
            );
        });
    });

    describe('getEventAttendance', () => {
        test('should fetch attendance data for event', async () => {
            const mockAttendance = {
                items: [
                    { scoutid: '1', firstname: 'John', lastname: 'Doe', attending: 'Yes' },
                    { scoutid: '2', firstname: 'Jane', lastname: 'Smith', attending: 'No' }
                ]
            };

            sessionStorage.setItem('access_token', 'test-token');
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockAttendance
            });

            const attendance = await getEventAttendance('123', '456', '789');
            expect(attendance).toEqual(mockAttendance);
        });
    });
});