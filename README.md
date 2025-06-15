# 🏕️ Viking Scouts Event Management

A web-based event management application for Scout groups that integrates with **Online Scout Manager (OSM)** to manage attendance records and flexi records.

## **📋 Project Overview**

This application provides a modern, user-friendly interface for managing Scout events and tracking attendance. It connects directly with Online Scout Manager's API to fetch real-time data while providing enhanced visualization and management capabilities.

## **🏗️ Architecture**

### **Frontend** (`/src/`)
- **Framework:** Vanilla JavaScript (ES6 modules)
- **Styling:** Bootstrap 4 + Font Awesome
- **Server:** Express HTTPS server (`https-server.js`)
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
- **Dual-view interface:**
  - **📊 Attendance Summary:** Simple table view
  - **📚 Attendance Detailed Groups:** Collapsible status groups
- **Status-based grouping** (Yes → No → Invited → Others)
- **Color-coded status badges**

### **5. Flexi Records**
- **Integration ready** for flexi record management
- **Console logging** for development/testing

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
│   ├── index.html          # Main application
│   ├── callback.html       # OAuth callback handler
│   ├── main.js            # Application logic
│   ├── api.js             # API integration layer
│   ├── ui.js              # UI rendering functions
│   ├── styles.css         # Custom styling
│   └── favicon.ico        # Application icon
├── https-server.js        # Local HTTPS server
├── package.json          # Dependencies & scripts
└── cypress/              # E2E testing
```

## **🔄 Data Flow**
1. **User logs in** → OAuth with OSM → Token stored
2. **Sections loaded** → Cached for performance
3. **User selects sections** → Events fetched for selected sections
4. **User selects events** → Attendance data retrieved
5. **Data displayed** → Tabbed interface with summary/grouped views

## **🎯 Current Status**
- ✅ **Authentication:** Working OAuth flow
- ✅ **Section Management:** Cached loading system
- ✅ **Event Management:** Multi-selection interface  
- ✅ **Attendance Views:** Dual-tab interface completed
- ✅ **Rate Limiting:** Comprehensive monitoring
- ✅ **Blocking Protection:** Multi-level security
- 🟡 **Flexi Records:** API integration ready, UI pending
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
- **Frontend:** JavaScript ES6, Bootstrap 4, Font Awesome
- **Testing:** Cypress E2E testing
- **Deployment:** Render.com
- **API:** OSM REST API integration
- **Security:** OAuth2, rate limiting, blocking detection

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

# Start local HTTPS server
npm start
# or
node https-server.js

# Open in browser
https://localhost:3000
```

### **Testing**
```bash
# Run E2E tests
npm run cypress:open

# Run tests in headless mode
npm run cypress:run
```

## **🔐 Environment Variables**
```bash
PORT=3000
USE_HTTPS=true
API_URL=https://vikings-osm-event-manager.onrender.com
FRONTEND_URL=https://vikings-eventmgmt.onrender.com
OAUTH_REDIRECT_URI=https://vikings-eventmgmt.onrender.com/callback.html
```

## **📈 Monitoring**
- **Rate limit tracking** via OSM API headers
- **Error logging** with Sentry integration
- **Performance monitoring** via browser dev tools
- **Application blocking detection** with immediate alerts

---

**Built with ❤️ for Viking Scouts** 🏕️