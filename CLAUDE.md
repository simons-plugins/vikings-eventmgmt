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
- **Camp Groups UI**: `src/ui/camp-groups.js` - Camp groups management with sign-in/out functionality

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
- User info stored in `sessionStorage.user_info` from OSM startup data
- User name displayed in header when authenticated

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
- jQuery and Bootstrap JavaScript for modal functionality
- Modular UI functions in `src/ui.js` and `src/ui/` subdirectory
- Attendance views: Summary table, grouped status views, and camp groups
- Loading states and spinners for async operations

## Camp Groups Functionality

### Overview
The camp groups feature provides comprehensive attendee management with sign-in/out tracking using OSM flexi records.

### Features
- **Attendee Organization**: Displays attendees grouped by camp assignments from "Viking Event Mgmt" flexi record
- **Interactive Cards**: Clickable attendee cards showing basic info and current sign-in/out status
- **Detailed Popups**: Modal dialogs with comprehensive attendee information and action buttons
- **Status Tracking**: Real-time sign-in/out status with color-coded visual indicators
- **Flexi Record Integration**: Updates OSM flexi records with user name and timestamp

### Technical Implementation

**Data Flow:**
1. `enrichAttendeesWithCampGroups()` fetches camp group data from OSM flexi records
2. Field mapping resolves `f_1`, `f_2`, etc. to readable field names
3. `renderCampGroupsPage()` creates collapsible group sections with attendee cards
4. Click handlers open modals with `showAttendeeDetails()`
5. Sign-in/out actions call `updateFlexiRecord()` API

**API Integration:**
- `getFlexiRecords()` - List available flexi records for section
- `getSingleFlexiRecord()` - Get detailed camp group data
- `getFlexiStructure()` - Map field IDs to readable names
- `updateFlexiRecord()` - Update sign-in/out fields with validation
- `getStartupData()` - Get current user info for sign actions

**Safety Measures:**
- Single API call per sign-in/out action to prevent rate limiting
- Field ID validation (f_1, f_2, etc.) before API calls
- 500ms delays between consecutive API calls
- Comprehensive error handling and user feedback
- Global flexi record info storage for sign actions

**Modal Functionality:**
- Bootstrap modal with jQuery fallback for compatibility
- Dynamic content based on current sign-in/out status
- Action buttons appear/disappear based on current state
- Success feedback with automatic modal closure

### Field Mapping
The system automatically maps OSM flexi record fields:
- Searches for fields containing "signed in by", "signed out by", "camp group"
- Supports both space-separated and camelCase field names
- Creates friendly names from field mapping configuration
- Stores mapping globally for sign-in/out operations

### Status Logic
- **Not Signed In**: Red indicator, "Sign In" button available
- **Signed In**: Green indicator, "Sign Out" button available  
- **Signed Out**: Yellow indicator, "Sign In" button available
- Status determined by presence of sign-out data (most recent action)