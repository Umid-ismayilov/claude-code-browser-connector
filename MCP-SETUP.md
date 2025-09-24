# Claude Code MCP Integration Setup

This guide explains how to integrate the Claude Code Browser Connector with Claude Code using the Model Context Protocol (MCP).

## 🚀 Quick Setup

### 1. Install the Package
```bash
npm install -g claude-code-browser-connector
```

### 2. Run Automatic Setup
```bash
claude-browser setup
```

This will automatically:
- Configure Claude Code MCP settings
- Add browser tools to Claude Code
- Create necessary configuration files

### 3. Start Browser and Connector
```bash
# Terminal 1: Start Chrome in debugging mode
claude-browser browser

# Terminal 2: Start the connector server
claude-browser start

# Terminal 3: Start Claude Code
claude-code
```

## ⚙️ Manual Setup

If automatic setup doesn't work, follow these manual steps:

### 1. Locate Claude Code Config Directory
```bash
# Default locations:
# macOS: ~/.config/claude-code/
# Linux: ~/.config/claude-code/
# Windows: %APPDATA%/claude-code/
```

### 2. Create/Edit MCP Servers Config
Create or edit `~/.config/claude-code/mcp_servers.json`:

```json
{
  "claude-code-browser": {
    "command": "node",
    "args": ["/usr/local/lib/node_modules/claude-code-browser-connector/src/claude-mcp.js"],
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

### 3. Verify Installation Path
Find the actual installation path:
```bash
npm list -g claude-code-browser-connector
```

Update the `args` path in the config file accordingly.

## 🔧 Available MCP Tools

Once configured, these tools become available in Claude Code:

### Connection & Status
- `browser_connect` - Connect to existing browser instance
- `browser_status` - Check browser connection status

### Navigation & Information
- `browser_navigate` - Navigate to any URL
- `browser_get_page_info` - Get comprehensive page information

### Monitoring
- `browser_get_console_logs` - Capture browser console logs
- `browser_get_network_logs` - Monitor network requests
- `browser_clear_logs` - Clear all captured logs

### Interaction
- `browser_click` - Click elements by CSS selector
- `browser_type` - Type text in input fields
- `browser_execute` - Execute custom JavaScript
- `browser_screenshot` - Take page screenshots

## 📋 Usage Examples in Claude Code

Once setup is complete, you can use natural language commands:

```
> Connect to browser and navigate to google.com
> Take a screenshot of the current page
> Get all console errors from the page
> Click on the search button
> Type "hello world" in the search box
> Get page performance metrics
```

## 🔍 Troubleshooting

### MCP Server Not Found
```bash
# Check if package is installed globally
npm list -g claude-code-browser-connector

# Reinstall if needed
npm uninstall -g claude-code-browser-connector
npm install -g claude-code-browser-connector
```

### Wrong Path in Config
```bash
# Find correct path
which node
npm root -g

# Update config with correct paths
claude-browser config show
```

### Claude Code Not Recognizing Tools
```bash
# Restart Claude Code after MCP setup
# Check MCP config file exists and has correct syntax
cat ~/.config/claude-code/mcp_servers.json | jq .
```

### Browser Connection Issues
```bash
# Ensure Chrome is running with debugging
curl http://localhost:9222/json/version

# Start Chrome manually if needed
claude-browser browser --port 9222
```

## ⚡ Development Setup

For development or custom configurations:

```bash
# Clone the repository
git clone https://github.com/Umid-ismayilov/claude-code-browser-connector.git
cd claude-code-browser-connector

# Install dependencies
npm install

# Link for development
npm link

# Use development MCP config
{
  "claude-code-browser-dev": {
    "command": "node",
    "args": ["./src/claude-mcp.js"],
    "cwd": "/path/to/claude-code-browser-connector",
    "env": {
      "NODE_ENV": "development"
    }
  }
}
```

## 🎯 Verification

To verify everything is working:

1. Start the browser connector:
   ```bash
   claude-browser status
   ```

2. Check MCP tools in Claude Code:
   ```
   > What browser tools do you have available?
   ```

3. Test basic functionality:
   ```
   > Connect to browser and navigate to example.com
   ```

## 📚 Additional Resources

- **Configuration**: `claude-browser config show`
- **Help**: `claude-browser --help`
- **Status**: `claude-browser status`
- **GitHub**: https://github.com/Umid-ismayilov/claude-code-browser-connector

---

*This MCP integration enables seamless browser automation directly from Claude Code conversations.*