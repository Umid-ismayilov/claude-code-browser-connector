# Claude Code Browser Connector

[![npm version](https://badge.fury.io/js/claude-code-browser-connector.svg)](https://www.npmjs.com/package/claude-code-browser-connector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)

Professional Puppeteer-based browser connector for Claude Code with configurable settings and comprehensive monitoring. Enables Claude Code to control existing browser instances, monitor network traffic, capture console logs, and perform advanced browser automation tasks.

## 🚀 Features

### Browser Automation
- **Remote Browser Control**: Connect to existing Chrome/Chromium instances
- **Page Navigation**: Navigate to URLs and interact with pages
- **Element Interaction**: Click, type, scroll, and manipulate page elements
- **JavaScript Execution**: Run custom JavaScript in browser context
- **Screenshot Capture**: Take full page or viewport screenshots

### Real-time Monitoring
- **Console Logs**: Capture all browser console messages (log, warn, error)
- **Network Traffic**: Monitor HTTP/HTTPS requests and responses
- **Error Tracking**: Track JavaScript errors and unhandled promise rejections
- **Performance Metrics**: Collect page load and performance data

### Claude Code Integration
- **MCP Protocol**: Full Model Context Protocol support
- **10+ Browser Tools**: Comprehensive set of browser automation tools
- **Real-time Updates**: WebSocket-based live monitoring
- **JSON-RPC 2.0**: Standard protocol for tool communication

### Configuration Management
- **User-specific Config**: Personalized settings and preferences
- **Test Sites**: Pre-configured test sites (Demo sites, Google, GitHub)
- **Cross-platform**: Works on macOS, Linux, and Windows
- **Flexible Ports**: Configurable HTTP and WebSocket ports

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g claude-code-browser-connector
```

### Local Installation

```bash
npm install claude-code-browser-connector
```

### From Source

```bash
git clone https://github.com/Umid-ismayilov/claude-code-browser-connector.git
cd claude-code-browser-connector
npm install
npm install -g .
```

## 🎯 Quick Start

### 1. Install and Setup

```bash
# Install globally
npm install -g claude-code-browser-connector

# Setup Claude Code integration
claude-browser setup

# Check configuration
claude-browser config show
```

### 2. Start Browser in Debugging Mode

```bash
# Start Chrome with remote debugging
claude-browser browser

# Or manually:
google-chrome --remote-debugging-port=9222
```

### 3. Start Connector Server

```bash
# Start with default settings
claude-browser start

# Start with custom ports
claude-browser start 3005 --ws-port 3006
```

### 4. Use with Claude Code

```bash
# Start Claude Code
claude-code

# Use browser tools
> Navigate to https://example.com and get console logs
> Take a screenshot of the current page
> Click on the search button with selector "#search-btn"
```

## 🛠️ CLI Commands

### Server Management

```bash
# Start server
claude-browser start [port] [options]
  --ws-port      WebSocket port (default: 3002)
  --browser-port Browser debugging port (default: 9222)
  --verbose      Enable verbose logging

# Check status
claude-browser status

# Stop server
claude-browser stop
```

### Browser Control

```bash
# Start Chrome in debugging mode
claude-browser browser [options]
  --port         Debugging port (default: 9222)
  --user-data-dir Custom user data directory

# Test browser functionality
claude-browser test [site]
  demo          Test demo websites
  google        Test Google.com
  all           Test all sites
```

### Configuration Management

```bash
# Show current configuration
claude-browser config show

# Edit configuration
claude-browser config edit --key server.port --value 3005

# Validate configuration
claude-browser config validate

# Reset to defaults
claude-browser config reset
```

## ⚙️ Configuration

Configuration is stored in `~/.config/claude-code-browser-connector/config.json`

### Default Configuration

```json
{
  "server": {
    "port": 3001,
    "wsPort": 3002,
    "host": "localhost"
  },
  "browser": {
    "debuggingPorts": [9222, 9223, 9224],
    "defaultHost": "localhost",
    "userDataDir": "/tmp/claude-code-chrome"
  },
  "testSites": {
    "demo": {
      "url": "https://example.com/",
      "expectedTitle": "Example Domain"
    }
  },
  "user": {
    "name": "User",
    "preferences": {
      "autoStart": true,
      "showNotifications": true
    }
  }
}
```

### Customizing Configuration

```bash
# Set server port
claude-browser config edit --key server.port --value 3005

# Add custom test site
claude-browser config edit --key customTestSites.mysite --value '{"url":"https://example.com","timeout":15000}'

# Set user preferences
claude-browser config edit --key user.preferences.autoStart --value false
```

### Adding Custom Test Sites

Users can add their own test sites to the configuration:

```javascript
// Example custom test site configuration
{
  "customTestSites": {
    "mycompany": {
      "url": "https://mycompany.com",
      "expectedTitle": "My Company - Home",
      "timeout": 20000,
      "expectedElements": ["#header", ".main-content"],
      "addedAt": "2025-01-24T10:30:00Z"
    }
  }
}
```

## 🧪 Testing

### Built-in Tests

```bash
# Test all functionality
claude-browser test all

# Test specific site
claude-browser test demo

# Test with custom timeout
claude-browser test demo --timeout 30000
```

### Website Testing

The connector includes support for various website testing scenarios:

```bash
# Test different websites
claude-browser test demo    # Test demo websites
claude-browser test google  # Test Google functionality
```

This will automatically:
- Navigate to specified websites
- Test page functionality
- Capture console logs and errors
- Monitor network traffic

### Custom Site Testing

Add your own sites for testing:

```bash
# Add a test site
claude-browser config edit --key customTestSites.github --value '{"url":"https://github.com","expectedTitle":"GitHub","timeout":10000}'

# Test the custom site
claude-browser test github
```

## 🔧 Claude Code MCP Tools

When integrated with Claude Code, these tools become available:

### Connection & Status
- `browser_connect` - Connect to browser instance
- `browser_status` - Check connection status

### Navigation & Information
- `browser_navigate` - Navigate to URL
- `browser_get_page_info` - Get comprehensive page information

### Monitoring
- `browser_get_console_logs` - Get browser console logs
- `browser_get_network_logs` - Get network request logs
- `browser_clear_logs` - Clear all captured logs

### Interaction
- `browser_click` - Click elements by selector
- `browser_type` - Type text in input fields
- `browser_execute` - Execute JavaScript code
- `browser_screenshot` - Take page screenshots

### Example Usage in Claude Code

```
> Connect to browser on port 9222
> Navigate to https://example.com and monitor console logs
> Take a screenshot of the current page
> Get all network requests made by the page
> Click on the login button with selector "#login-btn"
```

## 🏗️ API Reference

### HTTP API Endpoints

The server exposes a REST API on port 3001:

```bash
# Status and info
GET    /api/status           # Server and browser status
GET    /api/page-info        # Current page information

# Navigation
POST   /api/navigate         # Navigate to URL
POST   /api/connect          # Connect to browser

# Interaction
POST   /api/click            # Click element
POST   /api/type             # Type in input
POST   /api/execute          # Execute JavaScript

# Monitoring
GET    /api/console-logs     # Get console logs
GET    /api/network-logs     # Get network logs
POST   /api/clear-logs       # Clear all logs

# Utilities
GET    /api/screenshot       # Take screenshot
```

### WebSocket API

Real-time updates on port 3002:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3002');

// Listen for events
ws.on('message', (data) => {
  const event = JSON.parse(data);

  switch(event.type) {
    case 'console':
      console.log('Console log:', event.log);
      break;
    case 'network':
      console.log('Network request:', event.request);
      break;
    case 'navigation':
      console.log('Page navigated to:', event.url);
      break;
  }
});
```

## 🔍 Troubleshooting

### Browser Connection Issues

```bash
# Check if Chrome is running with debugging
curl http://localhost:9222/json/version

# Start Chrome manually
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Check available ports
claude-browser config validate
```

### Server Issues

```bash
# Check server status
claude-browser status

# View configuration
claude-browser config show

# Reset configuration
claude-browser config reset
```

### Permission Issues

```bash
# Fix config directory permissions
chmod 755 ~/.config/claude-code-browser-connector

# Clean logs
claude-browser clean
```

### Common Solutions

1. **Port already in use**: Change ports in configuration
2. **Chrome not found**: Update Chrome path in config
3. **MCP not working**: Re-run `claude-browser setup`
4. **Tests failing**: Check network connectivity and timeouts

## 📁 Project Structure

```
claude-code-browser-connector/
├── bin/
│   └── cli.js              # Global CLI interface
├── src/
│   ├── index.js            # Main server entry point
│   ├── claude-mcp.js       # MCP protocol implementation
│   └── config.js           # Configuration management
├── config/
│   └── default.json        # Default configuration
├── scripts/
│   ├── setup.js            # Claude Code integration
│   ├── config-cli.js       # Configuration CLI
│   └── post-install.js     # Post-installation setup
└── test/
    ├── runner.js           # Test runner
    ├── website-test.js     # Website specific tests
    └── config-test.js      # Configuration tests
```

## 🔒 Security Considerations

- Browser debugging port is only accessible locally by default
- User data directories are isolated
- No sensitive data is logged or transmitted
- Configuration files have restricted permissions
- CORS is configurable for API access

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

### Development Setup

```bash
git clone https://github.com/Umid-ismayilov/claude-code-browser-connector.git
cd claude-code-browser-connector
npm install
npm run dev
```

## 📝 Changelog

### v1.0.0 (2025-01-24)
- Initial release with full NPM package structure
- Configurable settings and user preferences
- Website testing and monitoring
- Comprehensive CLI interface
- Cross-platform support
- Claude Code MCP integration

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/Umid-ismayilov/claude-code-browser-connector/issues)
- **Documentation**: Run `claude-browser --help`
- **Configuration**: Run `claude-browser config show`

---

**Made with ❤️ for the Claude Code community**

*This package enables seamless browser automation and monitoring for Claude Code users worldwide.*