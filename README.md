# 🏕️ Viking Scouts Event Management

A web-based event management application for Scout groups that integrates with **Online Scout Manager (OSM)** to manage attendance records and flexi records.

## **📋 Project Overview**

This application provides a modern, user-friendly interface for managing Scout events and tracking attendance. It connects directly with Online Scout Manager's API to fetch real-time data while providing enhanced visualization and management capabilities.

## **🏗️ Architecture**

### **Frontend** (`/src/`)
- **Framework:** Vanilla JavaScript (ES6 modules)
- **Styling:** Bootstrap 4 + Font Awesome + jQuery
- **Build Tool:** Vite for development and production builds
- **Server:** Vite dev server with HTTPS support
- **Deployment:** Render.com

### **Backend**
- **URL:** `https://vikings-osm-event-manager.onrender.com`
- **Purpose:** Proxy/middleware for OSM API calls
- **Handles:** OAuth token exchange, API rate limiting, data formatting

## **🔑 Key Features**

### **1. Authentication**
- **OAuth2 flow** with Online Scout Manager
- **Secure token handling** via sessionStorage
- **Automatic token validation** and refresh

### **2. Section Management**
- **Cached section data** (24-hour expiry)
- **Multi-section selection** support
- **Real-time section loading**

### **3. Event Management**
- **Event listing** by section and term
- **Multi-event selection**
- **Date-based event filtering**

### **4. Attendance Tracking**
- **Triple-view interface:**
  - **📊 Attendance Summary:** Simple table view
  - **📚 Attendance Detailed Groups:** Collapsible status groups
  - **🏕️ Camp Groups:** Sign-in/out management with flexi records
- **Status-based grouping** (Yes → No → Invited → Others)
- **Color-coded status badges**

### **5. Camp Groups Management**
- **Attendee organization** by camp groups from OSM flexi records
- **Interactive attendee cards** with clickable popup modals
- **Real-time sign-in/out tracking** with status indicators
- **OSM flexi record integration** for data persistence
- **Dynamic action buttons** based on current sign-in/out state
- **User name and timestamp recording** for all sign actions

### **6. Flexi Records Integration**
- **Enhanced field mapping** from OSM flexi record structure
- **Automatic field resolution** (f_1, f_2, etc. to readable names)
- **Safe API validation** with field ID format checking
- **Rate limiting protection** with single API call approach

## **🛡️ Security & Monitoring**

### **Rate Limiting**
- **OSM API rate limit monitoring** via headers
- **Usage percentage tracking**
- **Automatic warnings** at 90%+ usage

### **Blocking Protection**
- **Multi-level blocking detection:**
  - Authentication callback
  - Application startup
  - API function calls
  - UI interactions
- **Immediate application suspension** when blocked
- **Admin recovery options**

### **Error Handling**
- **Enhanced API error detection**
- **HTML vs JSON response validation**
- **User-friendly error messages**
- **Detailed technical logging**

## **📁 File Structure**
```
vikings-eventmgmt/
├── src/
│   ├── lib/                    # Core business logic modules
│   │   ├── auth.js            # OAuth flow and token management
│   │   ├── api.js             # HTTP requests and rate limiting
│   │   ├── cache.js           # Data caching with expiry
│   │   ├── handlers.js        # Event handlers
│   │   └── page-router.js     # Page navigation system
│   ├── pages/                  # Page initialization modules
│   │   ├── sections-page.js   # Section selection page
│   │   ├── events-page.js     # Event selection page
│   │   └── attendance-page.js # Attendance views page
│   ├── ui/                     # UI component modules
│   │   ├── attendance.js      # Attendance table components
│   │   └── camp-groups.js     # Camp groups with sign-in/out
│   ├── styles/                 # CSS modules
│   ├── index.html             # Main application
│   ├── auth-success.html      # OAuth callback handler
│   ├── main.js               # Application entry point
│   ├── ui.js                 # Main UI functions
│   └── favicon.ico           # Application icon
├── package.json              # Dependencies & scripts
├── vite.config.js           # Vite build configuration
├── cypress/                 # E2E testing
├── tests/                   # Unit tests
├── CLAUDE.md               # Development guidance
└── README.md
```

## **🔄 Data Flow**
1. **User logs in** → OAuth with OSM → Token stored → User info displayed
2. **Sections loaded** → Cached for performance
3. **User selects sections** → Events fetched for selected sections
4. **User selects events** → Attendance data retrieved
5. **Data displayed** → Triple-tab interface (summary/grouped/camp groups)
6. **Camp Groups** → Flexi records fetched → Field mapping resolved
7. **Sign-in/out actions** → Flexi records updated → Status refreshed

## **🎯 Current Status**
- ✅ **Authentication:** Working OAuth flow with user info display
- ✅ **Section Management:** Cached loading system
- ✅ **Event Management:** Multi-selection interface  
- ✅ **Attendance Views:** Triple-tab interface completed
- ✅ **Camp Groups:** Complete sign-in/out functionality with modals
- ✅ **Flexi Records:** Full integration with field mapping and validation
- ✅ **Rate Limiting:** Comprehensive monitoring with safety measures
- ✅ **Blocking Protection:** Multi-level security
- ✅ **Error Handling:** Enhanced detection & recovery

## **🚀 Deployment**

### Multi-Environment Setup

#### Production Deployment (Render.com)
- **Service Name**: `vikings-eventmgmt`
- **Branch**: `main`
- **URL**: `https://vikings-eventmgmt.onrender.com`

#### Development Deployment (Render.com)
- **Service Name**: `vikings-eventmgmt-dev` 
- **Branch**: `develop` (or your development branch)
- **URL**: `https://vikings-eventmgmt-dev.onrender.com`

### OAuth Configuration

The application uses dynamic callback URLs that automatically adapt to the deployment environment.

**Required OSM OAuth App Settings:**
Add these callback URLs in your OSM Developer Settings:
```
https://vikings-eventmgmt.onrender.com/callback.html        (production)
https://vikings-eventmgmt-dev.onrender.com/callback.html    (development)  
http://localhost:3000/callback.html                         (local development)
```

**How it works:**
- The app automatically detects the current domain using `window.location.origin`
- No environment variables needed for callback URL configuration
- Same backend can be used for both production and development environments

### Deployment Workflow

```bash
# Development workflow
git checkout develop
git commit -m "Add new feature"
git push origin develop
# → Auto-deploys to vikings-eventmgmt-dev.onrender.com

# Production workflow  
git checkout main
git merge develop
git push origin main
# → Auto-deploys to vikings-eventmgmt.onrender.com
```

### Local Development

```bash
# Clone repository
git clone [repository-url]
cd vikings-eventmgmt

# Install dependencies
npm install

# Create environment file for HTTPS (optional)
echo "USE_HTTPS=true" > .env

# Start local server
node https-server.js
# → Runs at https://localhost:3000 (or http://localhost:3000)
```

## **🔧 Technologies Used**
- **Frontend:** JavaScript ES6, Bootstrap 4, Font Awesome, jQuery
- **Build Tool:** Vite with ES6 modules and HTTPS support
- **Testing:** Vitest (unit tests), Cypress (E2E testing)
- **Deployment:** Render.com
- **API:** OSM REST API integration with proxy backend
- **Security:** OAuth2, rate limiting, blocking detection, field validation

## **💻 Development Setup**

### **Prerequisites**
- Node.js 18+
- HTTPS certificates for local development
- OSM API credentials

### **Installation**
```bash
# Clone the repository
git clone https://github.com/simons-plugins/vikings-eventmgmt.git
cd vikings-eventmgmt

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Open in browser (usually auto-opens)
https://localhost:3001
```

### **Testing**
```bash
# Run unit tests
npm test
npm run test:ui          # Run with UI
npm run test:coverage    # With coverage

# Run E2E tests
npm run cypress:open     # Interactive mode
npm run cypress:run      # Headless mode
npm run test:e2e         # E2E against dev server
```

## **🔐 Environment Variables**
```bash
PORT=3000
USE_HTTPS=true
API_URL=https://vikings-osm-event-manager.onrender.com
FRONTEND_URL=https://vikings-eventmgmt.onrender.com
OAUTH_REDIRECT_URI=https://vikings-eventmgmt.onrender.com/callback.html
```

## **🏕️ Camp Groups Feature**

The camp groups functionality provides comprehensive attendee management with real-time sign-in/out tracking:

### **Key Features**
- **Smart Organization**: Automatically groups attendees by camp assignments from OSM "Viking Event Mgmt" flexi record
- **Interactive Interface**: Clickable attendee cards with hover effects and status indicators
- **Modal Popups**: Detailed attendee information with dynamic action buttons
- **Real-time Updates**: Sign-in/out actions update OSM flexi records with user name and timestamp
- **Status Tracking**: Visual indicators (Not Signed In → Signed In → Signed Out)

### **Technical Implementation**
- **Field Mapping**: Automatically resolves OSM field IDs (f_1, f_2, etc.) to readable names
- **API Safety**: Single API call per action with validation to prevent rate limiting
- **User Context**: Records current user name and timestamp for all sign actions
- **Modal Framework**: Bootstrap modals with jQuery and vanilla JavaScript fallback
- **Error Handling**: Comprehensive validation and user-friendly error messages

### **Usage Flow**
1. Navigate to **Camp Groups** tab in attendance view
2. View attendees organized by camp group assignments
3. Click any attendee card to open detailed popup
4. Use **Sign In** or **Sign Out** buttons to update status
5. Status updates are immediately reflected in OSM flexi records

## **📈 Monitoring**
- **Rate limit tracking** via OSM API headers
- **Error logging** with Sentry integration (backend)
- **Performance monitoring** via browser dev tools
- **Application blocking detection** with immediate alerts
- **Structured logging** for flexi record operations

---

**Built with ❤️ for Viking Scouts** 🏕️