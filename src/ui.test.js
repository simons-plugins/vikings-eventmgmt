import '@testing-library/jest-dom';
import {
  showError,
  showSpinner,
  hideSpinner,
} from './ui.js';

describe('UI helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="error-message" style="display:none"></div>
      <div id="spinner" style="display:none"></div>
    `;
  });

  test('showError displays error message', () => {
    showError('Something went wrong!');
    const el = document.getElementById('error-message');
    expect(el).toBeVisible();
    expect(el).toHaveTextContent('Something went wrong!');
  });

  test('showSpinner shows spinner', () => {
    showSpinner();
    expect(document.getElementById('spinner')).toBeVisible();
  });

  test('hideSpinner hides spinner', () => {
    showSpinner();
    hideSpinner();
    expect(document.getElementById('spinner')).not.toBeVisible();
  });
});