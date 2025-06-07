import * as api from './api.js';

describe('getToken', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('returns null if no token is set', () => {
        expect(api.getToken()).toBeNull();
    });

    it('returns the token if set', () => {
        sessionStorage.setItem('access_token', 'abc123');
        expect(api.getToken()).toBe('abc123');
    });
});

describe('getTermsForSection', () => {
    beforeEach(() => {
        sessionStorage.setItem('access_token', 'token');
        global.fetch = jest.fn();
    });

    it('returns terms for a section on success', async () => {
        global.fetch.mockResolvedValueOnce({
            json: async () => ({ '42': [{ termid: 't1', enddate: '2024-12-31' }] })
        });
        const result = await api.getTermsForSection('42');
        expect(result).toEqual([{ termid: 't1', enddate: '2024-12-31' }]);
    });

    it('returns empty array if no token', async () => {
        sessionStorage.clear();
        const result = await api.getTermsForSection('42');
        expect(result).toEqual([]);
    });

    it('returns empty array if fetch fails', async () => {
        global.fetch.mockRejectedValueOnce('API is down');
        await expect(api.getTermsForSection('42')).rejects.toBe('API is down');
    });
});

describe('getMostRecentTermId', () => {
    beforeEach(() => {
        sessionStorage.setItem('access_token', 'token');
        global.fetch = jest.fn();
    });

    it('returns the most recent termid', async () => {
        global.fetch.mockResolvedValueOnce({
            json: async () => ({
                '42': [
                    { termid: 't1', enddate: '2024-01-01' },
                    { termid: 't2', enddate: '2024-12-31' }
                ]
            })
        });
        const result = await api.getMostRecentTermId('42');
        expect(result).toBe('t2');
    });

    it('returns null if no terms', async () => {
        global.fetch.mockResolvedValueOnce({ json: async () => ({ '42': [] }) });
        const result = await api.getMostRecentTermId('42');
        expect(result).toBeNull();
    });
});

describe('getUserRoles', () => {
    beforeEach(() => {
        sessionStorage.setItem('access_token', 'token');
        global.fetch = jest.fn();
    });

    it('returns roles on success', async () => {
        const roles = [{ sectionid: '1', sectionname: 'Beavers' }];
        global.fetch.mockResolvedValueOnce({ json: async () => roles });
        const result = await api.getUserRoles();
        expect(result).toEqual(roles);
    });

    it('throws on fetch error', async () => {
        global.fetch.mockRejectedValueOnce('API is down');
        await expect(api.getUserRoles()).rejects.toBe('API is down');
    });
});

describe('getEvents', () => {
    beforeEach(() => {
        sessionStorage.setItem('access_token', 'token');
        global.fetch = jest.fn();
    });

    it('returns events on success', async () => {
        const events = { items: [{ eventid: 'e1', name: 'Camp' }] };
        global.fetch.mockResolvedValueOnce({ json: async () => events });
        const result = await api.getEvents('section1', 'term1');
        expect(result).toEqual(events);
    });

    it('throws on fetch error', async () => {
        global.fetch.mockRejectedValueOnce('API is down');
        await expect(api.getEvents('section1', 'term1')).rejects.toBe('API is down');
    });
});

describe('getEventAttendance', () => {
    beforeEach(() => {
        sessionStorage.setItem('access_token', 'token');
        global.fetch = jest.fn();
    });

    it('returns attendance on success', async () => {
        const attendance = { items: [{ firstname: 'Alice', attending: 'Yes' }] };
        global.fetch.mockResolvedValueOnce({ json: async () => attendance });
        const result = await api.getEventAttendance('e1', 'section1', 'term1');
        expect(result).toEqual(attendance);
    });

    it('throws on fetch error', async () => {
        global.fetch.mockRejectedValueOnce('API is down');
        await expect(api.getEventAttendance('e1', 'section1', 'term1')).rejects.toBe('API is down');
    });
});