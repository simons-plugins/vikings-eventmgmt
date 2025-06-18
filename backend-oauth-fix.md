// Updated backend OAuth callback HTML response
// Add this to your backend instead of the current HTML:

const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Success</title>
</head>
<body>
    <script>
        // Store token using the same key as frontend getToken() function
        sessionStorage.setItem('access_token', '${tokenData.access_token}');
        sessionStorage.setItem('token_type', '${tokenData.token_type || 'Bearer'}');
        
        console.log('Token stored successfully:', {
            access_token: sessionStorage.getItem('access_token') ? 'Present' : 'Missing',
            token_type: sessionStorage.getItem('token_type')
        });
        
        // Add a small delay to ensure storage is complete, then redirect
        setTimeout(() => {
            console.log('Redirecting to main app...');
            window.location.href = '${frontendUrl}/';
        }, 100);
    </script>
    <p>Authentication successful! Redirecting to application...</p>
</body>
</html>
`;`