// To create a new version:

// 1. Update package.json version (manually or with npm version)
npm version patch    // 1.0.0 -> 1.0.1 (bug fixes)
npm version minor    // 1.0.0 -> 1.1.0 (new features)  
npm version major    // 1.0.0 -> 2.0.0 (breaking changes)

// 2. Commit your changes first
git add .
git commit -m "Fix event/term ID parameters in getEventAttendance"

// 3. Tag the version
git tag v1.0.1
git push origin v1.0.1

// 4. Push to main
git push origin main

// Or do it all at once with:
npm version patch -m "Fix event/term ID parameters in getEventAttendance"
git push --follow-tags