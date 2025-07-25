import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testBackendConnection } from '../src/lib/api.js';

global.fetch = vi.fn();

// Mock auth functions
vi.mock('../src/lib/auth.js', () => ({
    getToken: vi.fn(() => 'mock-token'),
    handleTokenExpiration: vi.fn(),
    isTokenValid: vi.fn(() => true)
}));

describe('API Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear any stored blocked status
        global.sessionStorage?.removeItem?.('osm_blocked');
    });

    describe('testBackendConnection', () => {
        it('should return true for successful connection', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => 'Backend healthy'
            });

            const result = await testBackendConnection();
            
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://vikings-osm-event-manager.onrender.com/health',
                expect.objectContaining({
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });

        it('should return false for failed connection', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await testBackendConnection();
            
            expect(result).toBe(false);
        });

        it('should handle network errors', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await testBackendConnection();
            
            expect(result).toBe(false);
        });
    });

});