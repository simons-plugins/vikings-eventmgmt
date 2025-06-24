import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Sorting Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should sort attendees by name correctly', () => {
        const attendees = [
            { firstname: 'Charlie', lastname: 'Smith' },
            { firstname: 'Alice', lastname: 'Brown' },
            { firstname: 'Bob', lastname: 'Johnson' }
        ];
        
        const sorted = attendees.sort((a, b) => {
            const nameComparison = a.firstname.localeCompare(b.firstname);
            if (nameComparison !== 0) return nameComparison;
            return a.lastname.localeCompare(b.lastname);
        });
        
        expect(sorted[0].firstname).toBe('Alice');
        expect(sorted[1].firstname).toBe('Bob');
        expect(sorted[2].firstname).toBe('Charlie');
    });

    it('should sort camp groups with Unassigned last', () => {
        const groups = ['Group A', 'Unassigned', 'Group B', 'Group C'];
        
        const sorted = groups.sort((a, b) => {
            if (a === 'Unassigned') return 1;
            if (b === 'Unassigned') return -1;
            return a.localeCompare(b);
        });
        
        expect(sorted).toEqual(['Group A', 'Group B', 'Group C', 'Unassigned']);
    });

    it('should sort by attendance status with priority', () => {
        const statuses = ['Maybe', 'Yes', 'Unknown', 'No', 'Invited'];
        const statusPriority = { 'Yes': 1, 'No': 2, 'Invited': 3 };
        
        const sorted = statuses.sort((a, b) => {
            const pA = statusPriority[a] || 999;
            const pB = statusPriority[b] || 999;
            if (pA !== pB) return pA - pB;
            return a.localeCompare(b);
        });
        
        expect(sorted[0]).toBe('Yes');
        expect(sorted[1]).toBe('No');
        expect(sorted[2]).toBe('Invited');
    });
});