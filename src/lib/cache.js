// Module for caching functionalities.
// Will include functions and constants moved from main.js.

// --- Imports ---
import { getUserRoles } from './api.js';
import { renderSectionsTable, showError } from '../ui.js'; // Assuming these are in ui.js
import { handleSectionSelect } from './handlers.js'; // Passed as a callback

// --- Constants ---
export const SECTIONS_CACHE_KEY = 'viking_sections_cache';
export const SECTIONS_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// --- Cache functions ---
export function saveSectionsToCache(sections) {
    try {
        const cacheData = {
            sections: sections,
            timestamp: Date.now(),
            version: '1.0'
        };
        localStorage.setItem(SECTIONS_CACHE_KEY, JSON.stringify(cacheData));
        console.log(`Cached ${sections.length} sections to localStorage`);
    } catch (error) {
        console.warn('Failed to cache sections:', error);
    }
}

export function getSectionsFromCache() {
    try {
        const cached = localStorage.getItem(SECTIONS_CACHE_KEY);
        if (!cached) return null;

        const cacheData = JSON.parse(cached);
        const now = Date.now();

        if (now - cacheData.timestamp > SECTIONS_CACHE_EXPIRY) {
            console.log('Sections cache expired, removing...');
            localStorage.removeItem(SECTIONS_CACHE_KEY);
            return null;
        }

        console.log(`Loaded ${cacheData.sections.length} sections from cache`);
        return cacheData.sections;
    } catch (error) {
        console.warn('Failed to load sections from cache:', error);
        localStorage.removeItem(SECTIONS_CACHE_KEY);
        return null;
    }
}

export function clearSectionsCache() {
    localStorage.removeItem(SECTIONS_CACHE_KEY);
    console.log('Sections cache cleared');
}

export async function loadSectionsFromCacheOrAPI() {
    // The UI part (showing loading, errors) will be handled by the caller in main.js or ui.js
    try {
        let sections = getSectionsFromCache();

        if (sections) {
            return sections;
        } else {
            console.log('No cached sections found, loading from API...');
            sections = await getUserRoles(); // from api.js

            if (sections && sections.length > 0) {
                saveSectionsToCache(sections);
                return sections;
            } else {
                // throw new Error('No sections returned from API'); // Or return null/empty array
                console.warn('No sections returned from API');
                return []; // Return empty array for consistency
            }
        }
    } catch (error) {
        console.error('Failed to load sections:', error);
        // Re-throw the error so the caller can decide on UI update (e.g., showError)
        throw error;
    }
}
