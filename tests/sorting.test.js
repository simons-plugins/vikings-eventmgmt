// Table Sorting Tests - Test sortable column functionality
import { sortTableData, addSortableHeaders } from '../src/ui.js';

describe('Table Sorting Functionality', () => {
    // Mock DOM for sortable headers
    beforeEach(() => {
        document.body.innerHTML = `
            <table id="test-table">
                <thead>
                    <tr>
                        <th data-sort="firstname">First Name</th>
                        <th data-sort="lastname">Last Name</th>
                        <th data-sort="totalYes">Attending</th>
                        <th data-sort="date">Date</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
    });

    describe('sortTableData', () => {
        test('should sort text fields alphabetically', () => {
            const data = [
                { firstname: 'John', lastname: 'Doe' },
                { firstname: 'Alice', lastname: 'Smith' },
                { firstname: 'Bob', lastname: 'Wilson' }
            ];

            const sorted = sortTableData(data, 'firstname', 'asc');
            expect(sorted.map(d => d.firstname)).toEqual(['Alice', 'Bob', 'John']);

            const sortedDesc = sortTableData(data, 'firstname', 'desc');
            expect(sortedDesc.map(d => d.firstname)).toEqual(['John', 'Bob', 'Alice']);
        });

        test('should sort numbers correctly', () => {
            const data = [
                { totalYes: 5 },
                { totalYes: 12 },
                { totalYes: 3 },
                { totalYes: 8 }
            ];

            const sorted = sortTableData(data, 'totalYes', 'asc');
            expect(sorted.map(d => d.totalYes)).toEqual([3, 5, 8, 12]);

            const sortedDesc = sortTableData(data, 'totalYes', 'desc');
            expect(sortedDesc.map(d => d.totalYes)).toEqual([12, 8, 5, 3]);
        });

        test('should sort dates correctly', () => {
            const data = [
                { date: '2024-01-15' },
                { date: '2024-01-10' },
                { date: '2024-01-20' },
                { date: '2024-01-12' }
            ];

            const sorted = sortTableData(data, 'date', 'asc');
            expect(sorted.map(d => d.date)).toEqual([
                '2024-01-10', '2024-01-12', '2024-01-15', '2024-01-20'
            ]);
        });

        test('should handle case-insensitive text sorting', () => {
            const data = [
                { name: 'alice' },
                { name: 'Bob' },
                { name: 'CHARLIE' },
                { name: 'diana' }
            ];

            const sorted = sortTableData(data, 'name', 'asc');
            expect(sorted.map(d => d.name)).toEqual(['alice', 'Bob', 'CHARLIE', 'diana']);
        });

        test('should handle null/undefined values', () => {
            const data = [
                { value: 5 },
                { value: null },
                { value: 3 },
                { value: undefined },
                { value: 7 }
            ];

            const sorted = sortTableData(data, 'value', 'asc');
            expect(sorted.map(d => d.value)).toEqual([0, 0, 3, 5, 7]);
        });

        test('should not mutate original array', () => {
            const data = [
                { name: 'John' },
                { name: 'Alice' },
                { name: 'Bob' }
            ];
            const original = [...data];

            sortTableData(data, 'name', 'asc');
            expect(data).toEqual(original);
        });
    });

    describe('addSortableHeaders', () => {
        test('should add click handlers to sortable headers', () => {
            const mockData = [
                { firstname: 'John', lastname: 'Doe' },
                { firstname: 'Alice', lastname: 'Smith' }
            ];
            const mockRenderFunction = jest.fn();

            addSortableHeaders('test-table', mockData, mockRenderFunction);

            const headers = document.querySelectorAll('th[data-sort]');
            headers.forEach(header => {
                expect(header.style.cursor).toBe('pointer');
                expect(header.style.userSelect).toBe('none');
                expect(header.querySelector('.sort-indicator')).toBeTruthy();
            });
        });

        test('should call render function when header is clicked', () => {
            const mockData = [
                { firstname: 'John' },
                { firstname: 'Alice' }
            ];
            const mockRenderFunction = jest.fn();

            addSortableHeaders('test-table', mockData, mockRenderFunction);

            const firstNameHeader = document.querySelector('th[data-sort="firstname"]');
            firstNameHeader.click();

            expect(mockRenderFunction).toHaveBeenCalledWith([
                { firstname: 'Alice' },
                { firstname: 'John' }
            ]);
        });

        test('should toggle sort direction on repeated clicks', () => {
            const mockData = [
                { firstname: 'John' },
                { firstname: 'Alice' },
                { firstname: 'Bob' }
            ];
            const mockRenderFunction = jest.fn();

            addSortableHeaders('test-table', mockData, mockRenderFunction);

            const firstNameHeader = document.querySelector('th[data-sort="firstname"]');
            
            // First click - ascending
            firstNameHeader.click();
            expect(mockRenderFunction).toHaveBeenLastCalledWith([
                { firstname: 'Alice' },
                { firstname: 'Bob' },
                { firstname: 'John' }
            ]);

            // Second click - descending
            firstNameHeader.click();
            expect(mockRenderFunction).toHaveBeenLastCalledWith([
                { firstname: 'John' },
                { firstname: 'Bob' },
                { firstname: 'Alice' }
            ]);
        });

        test('should update sort indicators correctly', () => {
            const mockData = [{ firstname: 'John' }];
            const mockRenderFunction = jest.fn();

            addSortableHeaders('test-table', mockData, mockRenderFunction);

            const firstNameHeader = document.querySelector('th[data-sort="firstname"]');
            const indicator = firstNameHeader.querySelector('.sort-indicator');

            // Initial state
            expect(indicator.innerHTML).toBe('⇅');

            // After first click (ascending)
            firstNameHeader.click();
            expect(indicator.innerHTML).toBe('↑');
            expect(firstNameHeader.style.backgroundColor).toBe('rgb(227, 242, 253)'); // #e3f2fd

            // After second click (descending)
            firstNameHeader.click();
            expect(indicator.innerHTML).toBe('↓');
        });

        test('should reset other headers when clicking new column', () => {
            const mockData = [{ firstname: 'John', lastname: 'Doe' }];
            const mockRenderFunction = jest.fn();

            addSortableHeaders('test-table', mockData, mockRenderFunction);

            const firstNameHeader = document.querySelector('th[data-sort="firstname"]');
            const lastNameHeader = document.querySelector('th[data-sort="lastname"]');

            // Click first name
            firstNameHeader.click();
            expect(firstNameHeader.querySelector('.sort-indicator').innerHTML).toBe('↑');

            // Click last name
            lastNameHeader.click();
            expect(firstNameHeader.querySelector('.sort-indicator').innerHTML).toBe('⇅');
            expect(lastNameHeader.querySelector('.sort-indicator').innerHTML).toBe('↑');
        });
    });

    describe('Event Count Sorting', () => {
        test('should correctly sort yes/no attendance counts', () => {
            const data = [
                { yes: 15, no: 2, yes_members: 10, yes_yls: 3, yes_leaders: 2 },
                { yes: 8, no: 5, yes_members: 5, yes_yls: 2, yes_leaders: 1 },
                { yes: 12, no: 3, yes_members: 8, yes_yls: 2, yes_leaders: 2 }
            ];

            const sortedByYes = sortTableData(data, 'yes', 'desc');
            expect(sortedByYes.map(d => d.yes)).toEqual([15, 12, 8]);

            const sortedByMembers = sortTableData(data, 'yes_members', 'asc');
            expect(sortedByMembers.map(d => d.yes_members)).toEqual([5, 8, 10]);
        });
    });
});