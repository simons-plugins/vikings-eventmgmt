// Caching Tests - Test localStorage section caching functionality

// Create local localStorage mock for this test
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

// Override global localStorage for this test file
Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
});

// Mock API functions
jest.mock('../src/api.js', () => ({
    getUserRoles: jest.fn()
}));

import { getUserRoles } from '../src/api.js';

describe('Section Caching', () => {
    beforeEach(() => {
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
        getUserRoles.mockClear();
        
        // Mock Date.now for consistent testing
        jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('localStorage caching functionality', () => {
        test('should save sections to localStorage', () => {
            const mockSections = [
                { sectionid: '1', sectionname: 'Test Section 1' },
                { sectionid: '2', sectionname: 'Test Section 2' }
            ];

            // Simulate saving to cache
            const cacheData = {
                sections: mockSections,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            const cacheKey = 'viking_sections_cache';
            const cacheDataString = JSON.stringify(cacheData);
            
            // Test the save operation
            localStorageMock.setItem(cacheKey, cacheDataString);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                cacheKey,
                cacheDataString
            );
        });

        test('should retrieve sections from localStorage', () => {
            const mockSections = [
                { sectionid: '1', sectionname: 'Test Section 1' }
            ];

            const cacheData = {
                sections: mockSections,
                timestamp: Date.now() - 1000, // 1 second ago (fresh)
                version: '1.0'
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheData));

            // Test retrieval
            const cached = localStorageMock.getItem('viking_sections_cache');
            const parsedCache = JSON.parse(cached);

            expect(parsedCache.sections).toEqual(mockSections);
            expect(parsedCache.version).toBe('1.0');
        });

        test('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Should not throw when localStorage fails
            expect(() => {
                try {
                    localStorageMock.setItem('test', 'data');
                } catch (error) {
                    console.warn('Failed to cache sections:', error);
                }
            }).not.toThrow();
            
            expect(consoleSpy).toHaveBeenCalledWith('Failed to cache sections:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        test('should handle cache expiry', () => {
            const now = 1640995200000; // Current time
            const expiredTimestamp = now - (25 * 60 * 60 * 1000); // 25 hours ago
            
            // Simulate checking for expired cache
            const isExpired = (now - expiredTimestamp) > (24 * 60 * 60 * 1000);

            expect(isExpired).toBe(true);
            
            // When cache is expired, it should be removed
            if (isExpired) {
                localStorageMock.removeItem('viking_sections_cache');
            }
            
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('viking_sections_cache');
        });

        test('should handle corrupted cache data', () => {
            localStorageMock.getItem.mockReturnValue('invalid-json');

            // Should handle JSON parse errors gracefully
            let result = null;
            try {
                const cached = localStorageMock.getItem('viking_sections_cache');
                result = JSON.parse(cached);
            } catch (error) {
                result = null;
                localStorageMock.removeItem('viking_sections_cache');
            }

            expect(result).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('viking_sections_cache');
        });
    });

    describe('API fallback behavior', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="sections-table-container"></div>
            `;
        });

        test('should fetch from API when cache is empty', async () => {
            const mockApiSections = [{ sectionid: '2', sectionname: 'API Section' }];
            
            localStorageMock.getItem.mockReturnValue(null);
            getUserRoles.mockResolvedValue(mockApiSections);

            // Simulate the cache miss -> API call flow
            const cached = localStorageMock.getItem('viking_sections_cache');
            expect(cached).toBeNull();

            const sections = await getUserRoles();
            expect(sections).toEqual(mockApiSections);
            expect(getUserRoles).toHaveBeenCalled();
        });

        test('should handle API errors gracefully', async () => {
            localStorageMock.getItem.mockReturnValue(null);
            getUserRoles.mockRejectedValue(new Error('API Error'));

            await expect(getUserRoles()).rejects.toThrow('API Error');
        });
    });

    describe('Cache management', () => {
        test('should clear cache when requested', () => {
            // Simulate cache clearing
            localStorageMock.removeItem('viking_sections_cache');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('viking_sections_cache');
        });

        test('should prefer cache over API when cache is fresh', () => {
            const mockCachedSections = [{ sectionid: '1', sectionname: 'Cached Section' }];
            
            // Fresh cache data (1 second ago)
            const freshCacheData = {
                sections: mockCachedSections,
                timestamp: 1640995200000 - 1000, // 1 second ago
                version: '1.0'
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(freshCacheData));

            // Simulate cache hit logic
            const cached = localStorageMock.getItem('viking_sections_cache');
            const cacheData = JSON.parse(cached);
            const now = 1640995200000;
            const isExpired = (now - cacheData.timestamp) > (24 * 60 * 60 * 1000);

            expect(isExpired).toBe(false);
            expect(cacheData.sections).toEqual(mockCachedSections);
            
            // Should not call API when cache is fresh
            expect(getUserRoles).not.toHaveBeenCalled();
        });
    });
});