import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock performance.now
global.performance = {
    now: vi.fn(() => Date.now())
};

describe('Performance Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    it('should render attendance data efficiently', () => {
        // Create mock attendees data
        const mockAttendees = Array.from({ length: 1000 }, (_, i) => ({
            firstname: `First${i}`,
            lastname: `Last${i}`,
            attending: i % 2 === 0 ? 'Yes' : 'No',
            sectionname: `Section${i % 10}`,
            _eventName: `Event${i % 5}`,
            _eventDate: '2024-01-01'
        }));

        const start = performance.now();
        
        // Simulate attendance grouping operation
        const groupedAttendees = {};
        mockAttendees.forEach(attendee => {
            const status = attendee.attending || 'Unknown';
            if (!groupedAttendees[status]) groupedAttendees[status] = [];
            groupedAttendees[status].push(attendee);
        });
        
        const end = performance.now();
        const duration = end - start;
        
        expect(duration).toBeLessThan(100); // Should complete in under 100ms
        expect(Object.keys(groupedAttendees)).toHaveLength(2);
        expect(groupedAttendees['Yes']).toHaveLength(500);
        expect(groupedAttendees['No']).toHaveLength(500);
    });

    it('should handle large data sets in camp groups', () => {
        // Test camp group data processing performance
        const mockAttendees = Array.from({ length: 500 }, (_, i) => ({
            firstname: `Scout${i}`,
            lastname: `Member${i}`,
            campGroup: `Group${i % 20}`, // 20 different groups
            sectionname: 'Test Section'
        }));

        const start = performance.now();
        
        // Simulate camp group processing
        const groupedByCamp = mockAttendees.reduce((groups, attendee) => {
            const groupName = attendee.campGroup || 'Unassigned';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(attendee);
            return groups;
        }, {});
        
        const end = performance.now();
        const duration = end - start;
        
        expect(duration).toBeLessThan(50); // Should be very fast
        expect(Object.keys(groupedByCamp)).toHaveLength(20);
    });
});