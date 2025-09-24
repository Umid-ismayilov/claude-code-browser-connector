#!/usr/bin/env node

/**
 * Claude Code MCP Server for Browser Control
 * Bu server Claude Code ilə browser connector arasında körpü rolunu oynayır
 */

import http from 'http';

class ClaudeCodeMCPServer {
  constructor() {
    this.connectorUrl = 'http://localhost:3001';
    this.tools = {
      browser_connect: {
        name: 'browser_connect',
        description: 'Connect to existing browser instance with remote debugging',
        parameters: {
          type: 'object',
          properties: {
            port: { type: 'number', default: 9222, description: 'Remote debugging port' },
            host: { type: 'string', default: 'localhost', description: 'Browser host' }
          }
        }
      },

      browser_navigate: {
        name: 'browser_navigate',
        description: 'Navigate to a URL',
        parameters: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to navigate to' }
          },
          required: ['url']
        }
      },

      browser_get_page_info: {
        name: 'browser_get_page_info',
        description: 'Get current page information including title, URL, and errors',
        parameters: { type: 'object', properties: {} }
      },

      browser_get_console_logs: {
        name: 'browser_get_console_logs',
        description: 'Get console logs from the browser',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 50, description: 'Maximum number of logs to return' }
          }
        }
      },

      browser_get_network_logs: {
        name: 'browser_get_network_logs',
        description: 'Get network request/response logs',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 50, description: 'Maximum number of logs to return' }
          }
        }
      },

      browser_clear_logs: {
        name: 'browser_clear_logs',
        description: 'Clear all console and network logs',
        parameters: { type: 'object', properties: {} }
      },

      browser_click: {
        name: 'browser_click',
        description: 'Click on an element using CSS selector',
        parameters: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector for the element' }
          },
          required: ['selector']
        }
      },

      browser_type: {
        name: 'browser_type',
        description: 'Type text into an input element',
        parameters: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector for the input element' },
            text: { type: 'string', description: 'Text to type' }
          },
          required: ['selector', 'text']
        }
      },

      browser_execute: {
        name: 'browser_execute',
        description: 'Execute JavaScript code in the browser',
        parameters: {
          type: 'object',
          properties: {
            script: { type: 'string', description: 'JavaScript code to execute' }
          },
          required: ['script']
        }
      },

      browser_screenshot: {
        name: 'browser_screenshot',
        description: 'Take a screenshot of the current page',
        parameters: {
          type: 'object',
          properties: {
            fullPage: { type: 'boolean', default: false, description: 'Capture full page or just viewport' }
          }
        }
      },

      browser_status: {
        name: 'browser_status',
        description: 'Get browser connection status and basic info',
        parameters: { type: 'object', properties: {} }
      }
    };

    this.init();
  }

  init() {
    console.log('🚀 Claude Code MCP Browser Server başlayır...');

    // MCP Server protokolu üçün JSON-RPC 2.0
    process.stdin.on('data', (data) => {
      try {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            const message = JSON.parse(line);
            this.handleMessage(message);
          }
        });
      } catch (error) {
        console.error('Mesaj parse xətası:', error);
      }
    });

    // İlk olaraq tools-ları göndər
    this.sendMessage({
      jsonrpc: '2.0',
      method: 'notifications/tools/list_changed',
      params: {
        tools: Object.values(this.tools)
      }
    });

    console.log('✅ MCP Server hazırdır!');
  }

  async handleMessage(message) {
    const { method, params, id } = message;

    try {
      switch (method) {
        case 'initialize':
          this.sendResponse(id, {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'claude-code-browser-mcp',
              version: '1.0.0'
            }
          });
          break;

        case 'tools/list':
          this.sendResponse(id, {
            tools: Object.values(this.tools)
          });
          break;

        case 'tools/call':
          await this.handleToolCall(id, params.name, params.arguments);
          break;

        default:
          this.sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      console.error('Mesaj handle xətası:', error);
      this.sendError(id, -32603, error.message);
    }
  }

  async handleToolCall(id, toolName, args = {}) {
    try {
      let result;

      switch (toolName) {
        case 'browser_connect':
          result = await this.makeRequest('/api/connect', 'POST', {
            port: args.port || 9222,
            host: args.host || 'localhost'
          });
          break;

        case 'browser_navigate':
          result = await this.makeRequest('/api/navigate', 'POST', {
            url: args.url
          });
          break;

        case 'browser_get_page_info':
          result = await this.makeRequest('/api/page-info', 'GET');
          break;

        case 'browser_get_console_logs':
          const consoleRes = await this.makeRequest(`/api/console-logs?limit=${args.limit || 50}`, 'GET');
          result = {
            success: true,
            logs: consoleRes.logs,
            formatted: this.formatConsoleLogs(consoleRes.logs)
          };
          break;

        case 'browser_get_network_logs':
          const networkRes = await this.makeRequest(`/api/network-logs?limit=${args.limit || 50}`, 'GET');
          result = {
            success: true,
            logs: networkRes.logs,
            formatted: this.formatNetworkLogs(networkRes.logs)
          };
          break;

        case 'browser_clear_logs':
          result = await this.makeRequest('/api/clear-logs', 'POST');
          break;

        case 'browser_click':
          result = await this.makeRequest('/api/click', 'POST', {
            selector: args.selector
          });
          break;

        case 'browser_type':
          result = await this.makeRequest('/api/type', 'POST', {
            selector: args.selector,
            text: args.text
          });
          break;

        case 'browser_execute':
          result = await this.makeRequest('/api/execute', 'POST', {
            script: args.script
          });
          break;

        case 'browser_screenshot':
          const screenshotRes = await this.makeRequest(`/api/screenshot?fullPage=${args.fullPage || false}`, 'GET');
          result = {
            success: true,
            screenshot: screenshotRes.screenshot,
            message: 'Screenshot alındı'
          };
          break;

        case 'browser_status':
          result = await this.makeRequest('/api/status', 'GET');
          break;

        default:
          throw new Error(`Bilinməyən tool: ${toolName}`);
      }

      this.sendResponse(id, {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }
        ]
      });

    } catch (error) {
      console.error(`Tool call xətası [${toolName}]:`, error);
      this.sendError(id, -32603, error.message);
    }
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Response parse xətası: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request xətası: ${error.message}`));
      });

      if (body && method !== 'GET') {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  formatConsoleLogs(logs) {
    if (!logs || logs.length === 0) return 'Console logları yoxdur';

    return logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      return `[${time}] ${log.type.toUpperCase()}: ${log.text}`;
    }).join('\n');
  }

  formatNetworkLogs(logs) {
    if (!logs || logs.length === 0) return 'Network logları yoxdur';

    const requests = {};

    logs.forEach(log => {
      if (!requests[log.url]) requests[log.url] = {};
      requests[log.url][log.type] = log;
    });

    return Object.entries(requests).map(([url, data]) => {
      const req = data.request;
      const res = data.response;

      if (req && res) {
        return `${req.method} ${url} → ${res.status} ${res.statusText}`;
      } else if (req) {
        return `${req.method} ${url} → PENDING`;
      } else {
        return `RESPONSE ${url} → ${res?.status || 'UNKNOWN'}`;
      }
    }).join('\n');
  }

  sendMessage(message) {
    console.log(JSON.stringify(message));
  }

  sendResponse(id, result) {
    this.sendMessage({
      jsonrpc: '2.0',
      id: id,
      result: result
    });
  }

  sendError(id, code, message) {
    this.sendMessage({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: code,
        message: message
      }
    });
  }
}

// Start MCP Server
new ClaudeCodeMCPServer();