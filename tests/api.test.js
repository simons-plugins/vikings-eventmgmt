import { getUserRoles, getMostRecentTermId, getEvents, getEventAttendance } from '../src/lib/api.js';

global.fetch = jest.fn();

describe('API Functions', () => {
    beforeEach(() => {
        fetch.mockClear();
        
        // Mock sessionStorage properly
        Object.defineProperty(window, 'sessionStorage', {
            value: {
                getItem: jest.fn(() => 'test-token'),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn()
            },
            writable: true
        });
    });

    describe('getUserRoles', () => {
        it('should fetch user roles successfully and filter out adults', async () => {
            // Mock the actual API response structure (including adults section)
            const mockApiResponse = [
                {
                    "sectionid": "11107",
                    "sectionname": "Adults", 
                    "section": "adults",
                    "isDefault": "0",
                    "permissions": { "badge": 20, "member": 20 }
                },
                {
                    "sectionid": "63813",
                    "sectionname": "Monday Squirrels",
                    "section": "earlyyears", 
                    "isDefault": "0",
                    "permissions": { "badge": 0, "member": 10 }
                },
                {
                    "sectionid": "49097",
                    "sectionname": "Thursday Beavers",
                    "section": "beavers",
                    "isDefault": "1", 
                    "permissions": { "badge": 20, "member": 20 }
                }
            ];

            // Expected result after filtering and parsing (adults section excluded)
            const expectedSections = [
                {
                    sectionid: "63813",
                    sectionname: "Monday Squirrels", 
                    section: "earlyyears",
                    isDefault: false,
                    permissions: { "badge": 0, "member": 10 }
                },
                {
                    sectionid: "49097", 
                    sectionname: "Thursday Beavers",
                    section: "beavers",
                    isDefault: true,
                    permissions: { "badge": 20, "member": 20 }
                }
            ];
            
            // Mock fetch to return the full API response
            fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Map([
                        ['x-backend-ratelimit-remaining', '98'],
                        ['x-backend-ratelimit-limit', '100']
                    ]),
                    json: () => Promise.resolve(mockApiResponse)
                })
            );

            const roles = await getUserRoles();
            expect(roles).toEqual(expectedSections);
            expect(roles).toHaveLength(2); // Adults section should be filtered out
            expect(roles[0]).toHaveProperty('sectionname', 'Monday Squirrels');
            expect(roles[1]).toHaveProperty('sectionname', 'Thursday Beavers');
            expect(roles[1].isDefault).toBe(true);
        });

        it('should return empty array when API call fails', async () => {
            fetch.mockImplementationOnce(() => Promise.reject(new Error('API error')));

            const roles = await getUserRoles();
            expect(roles).toEqual([]);
        });
    });
});