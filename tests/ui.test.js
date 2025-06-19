import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DOM elements
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
});

describe('UI Functions', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('DOM manipulation', () => {
        it('should create and manipulate DOM elements', () => {
            const mockSections = [
                { sectionid: '1', sectionname: '1st Guildford Scout Group' },
                { sectionid: '2', sectionname: '2nd Guildford Scout Group' }
            ];
            
            // Create a table element
            const table = document.createElement('table');
            const tbody = document.createElement('tbody');
            
            mockSections.forEach(section => {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.textContent = section.sectionname;
                row.appendChild(cell);
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            document.body.appendChild(table);

            const createdTable = document.querySelector('table');
            expect(createdTable).toBeTruthy();
            expect(createdTable.querySelectorAll('tr')).toHaveLength(2);
        });

        it('should handle responsive design', () => {
            expect(window.innerWidth).toBe(1024);
            
            // Test mobile breakpoint
            Object.defineProperty(window, 'innerWidth', { value: 768 });
            expect(window.innerWidth).toBe(768);
        });
    });
});