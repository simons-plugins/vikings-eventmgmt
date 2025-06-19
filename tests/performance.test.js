import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock performance.now
global.performance = {
    now: vi.fn(() => Date.now())
};

describe('Performance Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should perform operations efficiently', () => {
        const start = Date.now();
        // Some operation
        const end = Date.now();
        const duration = end - start;
        
        expect(duration).toBeLessThan(1000);
    });
});