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
        it('should fetch user roles successfully and include all sections', async () => {
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

            // Mock the fetch response with object format (like real API)
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    "0": {
                        "sectionid": "11107",
                        "sectionname": "Adults",
                        "section": "adults",
                        "isDefault": "0",
                        "permissions": { "badge": 20, "member": 20 }
                    },
                    "1": {
                        "sectionid": "63813", 
                        "sectionname": "Monday Squirrels",
                        "section": "earlyyears",
                        "isDefault": "0",
                        "permissions": { "badge": 0, "member": 10 }
                    },
                    "2": {
                        "sectionid": "49097",
                        "sectionname": "Thursday Beavers", 
                        "section": "beavers",
                        "isDefault": "1",
                        "permissions": { "badge": 20, "member": 20 }
                    }
                })
            });

            const expectedSections = [
                {
                    sectionid: "11107",
                    sectionname: "Adults",
                    section: "adults", 
                    isDefault: false,
                    permissions: { badge: 20, member: 20 }
                },
                {
                    sectionid: "63813",
                    sectionname: "Monday Squirrels",
                    section: "earlyyears",
                    isDefault: false,
                    permissions: { badge: 0, member: 10 }
                },
                {
                    sectionid: "49097",
                    sectionname: "Thursday Beavers",
                    section: "beavers",
                    isDefault: true,
                    permissions: { badge: 20, member: 20 }
                }
            ];
            
            const roles = await getUserRoles();
            expect(roles).toEqual(expectedSections);
            expect(roles).toHaveLength(3); // Now includes all sections including adults
            expect(roles[0]).toHaveProperty('sectionname', 'Adults');
            expect(roles[1]).toHaveProperty('sectionname', 'Monday Squirrels');
            expect(roles[2]).toHaveProperty('sectionname', 'Thursday Beavers');
            expect(roles[2].isDefault).toBe(true); // Thursday Beavers is the default section
        });

        it('should return empty array when API call fails', async () => {
            fetch.mockImplementationOnce(() => Promise.reject(new Error('API error')));

            const roles = await getUserRoles();
            expect(roles).toEqual([]);
        });
    });
});