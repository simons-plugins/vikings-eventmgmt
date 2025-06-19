# Searching for `/get-user-roles` in the codebase

Let's find all files that reference this endpoint:

## Client-side Files to Check:
- `/src/callback.html`
- `/public/callback.html`
- `/src/lib/api.js`
- `/src/lib/auth.js`
- `/src/js/auth.js`
- `/src/js/api.js`
- `/src/main.js`
- Any JavaScript file that handles the authentication flow

## Server-side Files to Check:
- `/server.js`
- `/app.js`
- `/index.js`
- `/api/index.js`
- `/api/server.js`
- `/api/routes.js`
- `/routes/auth.js`
- Any Express route definitions

## Search Terms:
- `get-user-roles`
- `getUserRoles`
- `fetch('/get-user-roles'`
- `app.get('/get-user-roles'`
- `app.post('/get-user-roles'`