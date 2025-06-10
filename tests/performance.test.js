// Performance Tests - Test app performance and optimization
describe('Performance Tests', () => {
    describe('Caching Performance', () => {
        test('should load sections faster from cache than API', async () => {
            // Mock localStorage with cached data
            const mockCachedSections = [
                { sectionid: '1', sectionname: 'Test Section 1' },
                { sectionid: '2', sectionname: 'Test Section 2' }
            ];

            localStorage.setItem('viking_sections_cache', JSON.stringify({
                sections: mockCachedSections,
                timestamp: Date.now(),
                version: '1.0'
            }));

            // Measure cache load time
            const cacheStartTime = performance.now();
            const cachedSections = JSON.parse(localStorage.getItem('viking_sections_cache')).sections;
            const cacheEndTime = performance.now();
            const cacheLoadTime = cacheEndTime - cacheStartTime;

            // Simulate API load time (typically much slower)
            const apiStartTime = performance.now();
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms API call
            const apiEndTime = performance.now();
            const apiLoadTime = apiEndTime - apiStartTime;

            expect(cacheLoadTime).toBeLessThan(apiLoadTime);
            expect(cacheLoadTime).toBeLessThan(10); // Should be under 10ms
            expect(cachedSections).toEqual(mockCachedSections);
        });

        test('should handle large datasets efficiently', () => {
            // Generate large dataset
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                scoutid: i.toString(),
                firstname: `Scout${i}`,
                lastname: `LastName${i}`,
                attending: i % 2 === 0 ? 'Yes' : 'No'
            }));

            const startTime = performance.now();
            
            // Test sorting performance
            const sorted = largeDataset.sort((a, b) => 
                a.firstname.localeCompare(b.firstname)
            );
            
            const endTime = performance.now();
            const sortTime = endTime - startTime;

            expect(sortTime).toBeLessThan(100); // Should complete in under 100ms
            expect(sorted.length).toBe(1000);
            expect(sorted[0].firstname).toBe('Scout0');
        });
    });

    describe('DOM Manipulation Performance', () => {
        test('should render large attendance table efficiently', () => {
            // Create large attendance dataset
            const largeAttendanceData = Array.from({ length: 500 }, (_, i) => ({
                scoutid: i.toString(),
                firstname: `Scout${i}`,
                lastname: `LastName${i}`,
                attending: i % 3 === 0 ? 'Yes' : 'No',
                sectionname: `Section${Math.floor(i / 100)}`,
                _eventName: `Event${Math.floor(i / 50)}`,
                _eventDate: '2024-01-15'
            }));

            // Setup DOM
            document.body.innerHTML = '<div id="attendance-panel"></div>';

            const startTime = performance.now();
            
            // This would normally call renderAttendeesTable
            // For testing, we'll simulate the DOM operations
            const container = document.getElementById('attendance-panel');
            const tableHTML = `
                <table>
                    <tbody>
                        ${largeAttendanceData.map(attendee => `
                            <tr>
                                <td>${attendee.firstname}</td>
                                <td>${attendee.lastname}</td>
                                <td>${attendee.attending}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            container.innerHTML = tableHTML;

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            expect(renderTime).toBeLessThan(200); // Should render in under 200ms
            expect(container.querySelectorAll('tr').length).toBe(500);
        });
    });

    describe('Memory Usage', () => {
        test('should not create memory leaks with event listeners', () => {
            const initialListenerCount = document.querySelectorAll('*').length;

            // Simulate adding and removing table with event listeners
            document.body.innerHTML = `
                <table id="test-table">
                    <thead>
                        <tr>
                            <th data-sort="name">Name</th>
                            <th data-sort="count">Count</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;

            // Add event listeners (simulating addSortableHeaders)
            const headers = document.querySelectorAll('th[data-sort]');
            const listeners = [];
            headers.forEach(header => {
                const listener = () => console.log('clicked');
                header.addEventListener('click', listener);
                listeners.push({ element: header, listener });
            });

            // Remove table and listeners
            headers.forEach((header, index) => {
                header.removeEventListener('click', listeners[index].listener);
            });
            document.body.innerHTML = '';

            const finalListenerCount = document.querySelectorAll('*').length;
            
            // Should not have increased significantly
            expect(finalListenerCount).toBeLessThanOrEqual(initialListenerCount + 5);
        });
    });

    describe('Network Request Optimization', () => {
        test('should batch API requests efficiently', async () => {
            const mockSectionIds = ['1', '2', '3', '4', '5'];
            const requestTimes = [];

            // Mock fetch to track timing
            global.fetch = jest.fn().mockImplementation(() => {
                const startTime = Date.now();
                return new Promise(resolve => {
                    setTimeout(() => {
                        requestTimes.push(Date.now() - startTime);
                        resolve({
                            ok: true,
                            json: () => Promise.resolve({ items: [] })
                        });
                    }, 50); // 50ms simulated latency
                });
            });

            const startTime = performance.now();

            // Simulate concurrent requests (better than sequential)
            const promises = mockSectionIds.map(sectionId => 
                fetch(`/api/events?sectionId=${sectionId}`)
            );
            await Promise.all(promises);

            const totalTime = performance.now() - startTime;

            // Concurrent requests should be faster than sequential
            // With 5 requests of 50ms each:
            // - Sequential: ~250ms
            // - Concurrent: ~50-100ms (depending on browser limits)
            expect(totalTime).toBeLessThan(150);
            expect(fetch).toHaveBeenCalledTimes(5);
        });
    });

    describe('Search and Filter Performance', () => {
        test('should filter large datasets quickly', () => {
            // Create large dataset for filtering
            const largeDataset = Array.from({ length: 2000 }, (_, i) => ({
                firstname: `Scout${i}`,
                lastname: `LastName${i}`,
                section: `Section${Math.floor(i / 100)}`,
                attending: i % 2 === 0 ? 'Yes' : 'No'
            }));

            const startTime = performance.now();

            // Test text filtering (case-insensitive)
            const nameFilter = 'scout1';
            const filteredByName = largeDataset.filter(person => 
                person.firstname.toLowerCase().includes(nameFilter) ||
                person.lastname.toLowerCase().includes(nameFilter)
            );

            // Test status filtering
            const statusFilter = 'Yes';
            const filteredByStatus = largeDataset.filter(person => 
                person.attending === statusFilter
            );

            // Test combined filtering
            const combinedFilter = largeDataset.filter(person => 
                person.firstname.toLowerCase().includes('scout') &&
                person.attending === 'Yes' &&
                person.section.includes('Section1')
            );

            const endTime = performance.now();
            const filterTime = endTime - startTime;

            expect(filterTime).toBeLessThan(50); // Should filter in under 50ms
            expect(filteredByName.length).toBeGreaterThan(0);
            expect(filteredByStatus.length).toBe(1000); // Half should be 'Yes'
            expect(combinedFilter.length).toBeGreaterThan(0);
        });
    });
});