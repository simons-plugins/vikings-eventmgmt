// API Tests - Test all OSM API interactions
import { getUserRoles, getMostRecentTermId, getEvents, getEventAttendance } from '../src/lib/api';

global.fetch = jest.fn(); // Use Jest's built-in mock for fetch

describe('API Functions', () => {
    beforeEach(() => {
        fetch.mockClear(); // Clear mock calls before each test
    });

    describe('getUserRoles', () => {
        it('should fetch user roles successfully', async () => {
            const mockRoles = [
                { sectionid: '123', sectionname: 'Test Section' },
                { sectionid: '456', sectionname: 'Another Section' }
            ];
            fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    json: () => Promise.resolve({
                        0: mockRoles[0],
                        1: mockRoles[1]
                    })
                })
            );

            const roles = await getUserRoles();
            expect(roles).toEqual(mockRoles);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/get-user-roles'),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Authorization': expect.stringContaining('Bearer'),
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('should return empty array when API call fails', async () => {
            fetch.mockImplementationOnce(() => Promise.reject(new Error('API error')));

            const roles = await getUserRoles();
            expect(roles).toEqual([]);
        });
    });

    describe('getMostRecentTermId', () => {
        it('should return most recent term ID', async () => {
            const mockTerms = {
                123: [
                    { termid: '1', enddate: '2023-01-01' },
                    { termid: '2', enddate: '2023-06-01' },
                    { termid: '3', enddate: '2023-12-01' }
                ]
            };
            fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    json: () => Promise.resolve(mockTerms)
                })
            );

            const termId = await getMostRecentTermId('123');
            expect(termId).toBe('3');
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/get-terms'),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Authorization': expect.stringContaining('Bearer'),
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('should handle empty terms array', async () => {
            const mockTerms = { 123: [] };
            fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    json: () => Promise.resolve(mockTerms)
                })
            );

            const termId = await getMostRecentTermId('123');
            expect(termId).toBeNull();
        });
    });

    describe('getEvents', () => {
        it('should fetch events for section and term', async () => {
            const mockEvents = [
                { eventid: '1', name: 'Event 1' },
                { eventid: '2', name: 'Event 2' }
            ];
            fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    json: () => Promise.resolve(mockEvents)
                })
            );

            const events = await getEvents('123', '456');
            expect(events).toEqual(mockEvents);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/get-events?sectionid=123&termid=456'),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Authorization': expect.stringContaining('Bearer'),
                        'Content-Type': 'application/json'
                    })
                })
            );
        });
    });

    describe('getEventAttendance', () => {
        it('should fetch attendance data for event', async () => {
            const mockAttendance = [
                { scoutid: '1', name: 'Scout 1' },
                { scoutid: '2', name: 'Scout 2' }
            ];
            fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    json: () => Promise.resolve(mockAttendance)
                })
            );

            const attendance = await getEventAttendance('123', '456', '789');
            expect(attendance).toEqual(mockAttendance);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/get-event-attendance?sectionid=123&termid=456&eventid=789'),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Authorization': expect.stringContaining('Bearer'),
                        'Content-Type': 'application/json'
                    })
                })
            );
        });
    });
});