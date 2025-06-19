import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Sorting Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should sort data correctly', () => {
        const data = [{ name: 'B' }, { name: 'A' }, { name: 'C' }];
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        
        expect(sorted[0].name).toBe('A');
        expect(sorted[1].name).toBe('B');
        expect(sorted[2].name).toBe('C');
    });
});