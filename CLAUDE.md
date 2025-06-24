# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
- `npm run dev` - Start Vite dev server (port 3000, HTTPS enabled)
- `npm run start` - Start serve on production build (port 3000)
- `npm run serve` - Preview production build on port 3000

### Build & Preview
- `npm run build` - Build for production using Vite
- `npm run preview` - Preview production build

### Testing
- `npm test` - Run Vitest tests
- `npm run test:ui` - Run Vitest with UI
- `npm run test:run` - Run tests once without watch mode
- `npm run test:coverage` - Run Jest with coverage
- `npm run cypress:open` - Open Cypress E2E testing UI
- `npm run cypress:run` - Run Cypress tests headlessly
- `npm run test:e2e` - Run E2E tests against dev server
- `npm run test:e2e:open` - Open E2E tests against dev server

### Code Quality
- `npm run lint` - Run ESLint on src/ directory
- `npm run lint:fix` - Run ESLint with auto-fix

## Project Architecture

### Frontend Architecture
This is a vanilla JavaScript ES6 application with modular architecture:

- **Entry Point**: `src/main.js` - App initialization, auth checking, section loading
- **Authentication**: `src/lib/auth.js` - OAuth flow with Online Scout Manager (OSM), token management
- **API Layer**: `src/lib/api.js` - All HTTP requests to backend, rate limiting, error handling
- **Caching**: `src/lib/cache.js` - Sections data caching with 24-hour expiry
- **Event Handlers**: `src/lib/handlers.js` - Section/event selection handlers
- **UI Components**: `src/ui.js` - Main UI rendering functions
- **Attendance UI**: `src/ui/attendance.js` - Attendance-specific UI components

### Backend Integration
- **Backend URL**: `https://vikings-osm-event-manager.onrender.com`
- **Purpose**: Proxy/middleware for OSM API calls
- **Handles**: OAuth token exchange, API rate limiting, data formatting

### Authentication Flow
1. OAuth2 with Online Scout Manager (OSM)
2. Backend handles token exchange via `/oauth/callback`
3. Token stored in `sessionStorage.access_token`
4. All API calls include `Authorization: Bearer {token}` header

### Key Data Structures
- **Sections**: User's accessible Scout sections with permissions
- **Terms**: Time periods for Scout activities (current/past terms)
- **Events**: Activities within sections and terms
- **Attendance**: Member attendance records for events
- **Flexi Records**: Custom data fields in OSM

### Rate Limiting & Error Handling
- OSM API has strict rate limits - monitor via `_rateLimitInfo` in responses
- Multi-level blocking detection prevents API access suspension
- Enhanced error handling with user-friendly messages
- Automatic token validation and refresh

### Testing Strategy
- **Unit Tests**: Vitest for JavaScript modules (`tests/*.test.js`)
- **E2E Tests**: Cypress for full application flows (`cypress/e2e/*.cy.js`)
- **Test Environment**: jsdom for DOM simulation
- **Setup**: `tests/setup.js` for global test configuration

### Build System
- **Bundler**: Vite with ES6 modules
- **Entry Points**: `src/index.html` and `src/auth-success.html`
- **Output**: `dist/` directory
- **HTTPS**: Enabled for development (required for OSM OAuth)
- **Source Maps**: Generated for production debugging

### File Organization
```
src/
├── lib/           # Core business logic modules
├── ui/            # UI component modules  
├── styles/        # CSS modules
├── dev/           # Development utilities
├── index.html     # Main application
└── auth-success.html  # OAuth callback handler
```

## Development Notes

### OSM API Integration
- All API calls go through backend proxy to handle rate limits
- Backend provides rate limit info in `_rateLimitInfo` response field
- Check `sessionStorage.osm_blocked` for API blocking status

### Authentication State
- Check `sessionStorage.access_token` for login status
- Use `isAuthenticated()` from `src/lib/auth.js`
- Token validation happens on app load via `getUserRoles()` API call

### Caching Strategy
- Sections cached in `localStorage.viking_sections_cache` (24h expiry)
- Clear cache via `clearSectionsCache()` function
- Cache includes timestamp and sections data

### Error Handling Patterns
- API errors thrown as Error objects with descriptive messages
- UI shows user-friendly error messages via `showError()` function
- Console logging provides detailed technical information
- Blocked API access triggers immediate app suspension

### UI Architecture
- Bootstrap 4 for styling with custom CSS in `src/styles/`
- Modular UI functions in `src/ui.js` and `src/ui/` subdirectory
- Attendance views: Summary table and grouped status views
- Loading states and spinners for async operations