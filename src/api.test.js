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