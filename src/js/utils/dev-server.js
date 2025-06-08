/**
 * Development Server Helper
 * Simple HTTP server for local development to handle ES6 modules
 */

export class DevServer {
    static getServerCommand() {
        const commands = {
            python3: 'python3 -m http.server 8000',
            python: 'python -m http.server 8000',
            node: 'npx http-server -p 8000 -c-1',
            php: 'php -S localhost:8000'
        };
        
        console.log(`
🚀 Development Server Options:

Choose one of these commands to run a local server:

1. Python 3: ${commands.python3}
2. Python 2: ${commands.python}  
3. Node.js: ${commands.node}
4. PHP: ${commands.php}

Then open: http://localhost:8000

💡 ES6 modules require a server (not file://) to work properly.
        `);
        
        return commands;
    }
    
    static checkModuleSupport() {
        const isSupported = 'noModule' in HTMLScriptElement.prototype;
        console.log(`ES6 Module Support: ${isSupported ? '✅ Supported' : '❌ Not Supported'}`);
        return isSupported;
    }
}