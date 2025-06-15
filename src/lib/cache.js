// src/lib/cache.js
// This module is responsible for managing the local storage caching mechanism
// for user section data. Caching helps in reducing API calls to the backend
// and speeds up application load times by serving previously fetched data quickly.

// --- Imports ---
import { getUserRoles } from './api.js';
import { renderSectionsTable, showError } from '../ui.js'; // Assuming these are in ui.js
import { handleSectionSelect } from './handlers.js'; // Passed as a callback

// --- Constants ---
// SECTIONS_CACHE_KEY: The key used for storing and retrieving the sections cache in localStorage.
export const SECTIONS_CACHE_KEY = 'viking_sections_cache';
// SECTIONS_CACHE_EXPIRY: Defines the duration (in milliseconds) for which the cached data is considered valid.
// Currently set to 24 hours.
export const SECTIONS_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// --- Cache functions ---
// Saves the user's section data to localStorage.
export function saveSectionsToCache(sections) {
    try {
        // Construct a cache object containing:
        // - sections: The actual array of section data.
        // - timestamp: The time (in milliseconds since epoch) when the data was cached.
        // - version: A version number for the cache structure, useful for future migrations or format changes.
        const cacheData = {
            sections: sections,
            timestamp: Date.now(),
            version: '1.0' // Cache structure version
        };
        // Stringify the cache object to store it in localStorage, which only accepts strings.
        localStorage.setItem(SECTIONS_CACHE_KEY, JSON.stringify(cacheData));
        console.log(`Cached ${sections.length} sections to localStorage`);
    } catch (error) {
        // Log a warning if caching fails, e.g., due to localStorage being full or unavailable.
        console.warn('Failed to cache sections:', error);
    }
}

// Retrieves section data from the localStorage cache.
export function getSectionsFromCache() {
    try {
        // Retrieve the stringified cache data from localStorage using the defined cache key.
        const cached = localStorage.getItem(SECTIONS_CACHE_KEY);
        if (!cached) {
            // If no data is found for the key, return null indicating no cache is available.
            return null;
        }

        // Parse the JSON string back into an object.
        const cacheData = JSON.parse(cached);
        const now = Date.now();

        // Check if the cache has expired by comparing the stored timestamp
        // with the current time, against the defined cache expiry duration.
        if (now - cacheData.timestamp > SECTIONS_CACHE_EXPIRY) {
            console.log('Sections cache expired, removing...');
            // If expired, remove the stale cache item from localStorage.
            localStorage.removeItem(SECTIONS_CACHE_KEY);
            return null; // Return null as the cache is no longer valid.
        }

        // If the cache is valid and not expired, log and return the sections data.
        console.log(`Loaded ${cacheData.sections.length} sections from cache (version: ${cacheData.version || 'unknown'})`);
        return cacheData.sections;
    } catch (error) {
        // If any error occurs during retrieval or parsing (e.g., corrupted data),
        // log a warning and remove the potentially problematic cache item.
        console.warn('Failed to load sections from cache:', error);
        localStorage.removeItem(SECTIONS_CACHE_KEY); // Clean up potentially corrupted cache
        return null;
    }
}

// Removes the sections cache from localStorage.
// This can be used for manually clearing the cache, e.g., on logout or for debugging.
export function clearSectionsCache() {
    localStorage.removeItem(SECTIONS_CACHE_KEY);
    console.log('Sections cache cleared');
}

// Loads section data, attempting to retrieve it from the cache first,
// and falling back to an API call if the cache is unavailable or expired.
export async function loadSectionsFromCacheOrAPI() {
    // Note: UI updates (loading indicators, error messages) are expected to be handled by the calling function.
    try {
        // Attempt to load sections from the local cache.
        let sections = getSectionsFromCache();

        if (sections) {
            // If valid cached sections are found, return them immediately.
            return sections;
        } else {
            // If no valid cached sections are found, proceed to fetch from the API.
            console.log('No cached sections found or cache expired, loading from API...');
            sections = await getUserRoles(); // Fetch sections using the getUserRoles API call.

            if (sections && sections.length > 0) {
                // If sections are successfully fetched from the API,
                // save them to the cache for future use.
                saveSectionsToCache(sections);
                return sections; // Return the fetched sections.
            } else {
                // If the API returns no sections (or an empty array), log a warning.
                console.warn('No sections returned from API');
                return []; // Return an empty array to maintain consistent return type.
            }
        }
    } catch (error) {
        // If any error occurs during the process (cache read, API call, cache write),
        // log the error and re-throw it so the caller can handle it appropriately (e.g., display an error message).
        console.error('Failed to load sections from cache or API:', error);
        throw error; // Re-throw to allow caller to handle UI for error state
    }
}
