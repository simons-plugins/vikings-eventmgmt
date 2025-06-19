import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Caching Tests', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('localStorage functionality', () => {
        it('should store and retrieve data', () => {
            const testData = { test: 'data' };
            const testKey = 'test-key';
            
            // Store data
            localStorage.setItem(testKey, JSON.stringify(testData));
            
            // Retrieve data
            const retrieved = localStorage.getItem(testKey);
            expect(retrieved).toBeTruthy();
            expect(JSON.parse(retrieved)).toEqual(testData);
        });

        it('should return null for non-existent keys', () => {
            const result = localStorage.getItem('non-existent-key');
            expect(result).toBeNull();
        });

        it('should clear storage', () => {
            localStorage.setItem('key1', 'value1');
            localStorage.setItem('key2', 'value2');
            
            localStorage.clear();
            
            expect(localStorage.getItem('key1')).toBeNull();
            expect(localStorage.getItem('key2')).toBeNull();
        });
    });
});