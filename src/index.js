#!/usr/bin/env node

import puppeteer from 'puppeteer-core';
import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PuppeteerBrowserConnector {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isConnected = false;
    this.port = process.env.PORT || 3001;
    this.wsPort = process.env.WS_PORT || 3002;

    // Event listeners for real-time monitoring
    this.eventListeners = new Set();
    this.networkLogs = [];
    this.consoleLogs = [];

    this.init();
  }

  async init() {
    console.log('🚀 Claude Code Puppeteer Browser Connector başlayır...');

    // Express server
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    this.setupRoutes();
    this.setupWebSocket();

    // HTTP Server başlat
    this.httpServer = this.app.listen(this.port, () => {
      console.log(`📡 HTTP Server: http://localhost:${this.port}`);
    });

    // WebSocket Server başlat
    this.wss = new WebSocketServer({ port: this.wsPort });
    console.log(`🔌 WebSocket Server: ws://localhost:${this.wsPort}`);

    this.setupWebSocketHandlers();

    // Existing browser-ə qoşulmağa çalış
    await this.tryConnectToExistingBrowser();

    console.log('✅ Server hazırdır!');
    console.log('📋 İstifadə üçün:');
    console.log(`   1. Browser-i debugging mode-da başladın: google-chrome --remote-debugging-port=9222`);
    console.log(`   2. API: http://localhost:${this.port}/api/status`);
    console.log(`   3. WebSocket: ws://localhost:${this.wsPort}`);
  }

  setupRoutes() {
    // Status endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({
        connected: this.isConnected,
        browser: !!this.browser,
        page: !!this.page,
        url: this.page?.url() || null,
        networkLogs: this.networkLogs.length,
        consoleLogs: this.consoleLogs.length
      });
    });

    // Connect to existing browser
    this.app.post('/api/connect', async (req, res) => {
      try {
        const { port = 9222, host = 'localhost' } = req.body;
        await this.connectToBrowser(host, port);
        res.json({ success: true, message: 'Browser-ə qoşuldu' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Navigate to URL
    this.app.post('/api/navigate', async (req, res) => {
      try {
        const { url } = req.body;
        if (!this.page) throw new Error('Browser bağlı deyil');

        await this.page.goto(url, { waitUntil: 'networkidle0' });
        res.json({ success: true, url: this.page.url() });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get page info
    this.app.get('/api/page-info', async (req, res) => {
      try {
        if (!this.page) throw new Error('Browser bağlı deyil');

        const info = await this.page.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          userAgent: navigator.userAgent,
          cookies: document.cookie,
          localStorage: Object.keys(localStorage).reduce((acc, key) => {
            acc[key] = localStorage.getItem(key);
            return acc;
          }, {}),
          errors: window.__claudeCodeErrors__ || []
        }));

        res.json(info);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get console logs
    this.app.get('/api/console-logs', (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      res.json({
        logs: this.consoleLogs.slice(-limit),
        total: this.consoleLogs.length
      });
    });

    // Get network logs
    this.app.get('/api/network-logs', (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      res.json({
        logs: this.networkLogs.slice(-limit),
        total: this.networkLogs.length
      });
    });

    // Clear logs
    this.app.post('/api/clear-logs', (req, res) => {
      this.consoleLogs = [];
      this.networkLogs = [];
      res.json({ success: true, message: 'Loglar təmizləndi' });
    });

    // Execute script
    this.app.post('/api/execute', async (req, res) => {
      try {
        const { script } = req.body;
        if (!this.page) throw new Error('Browser bağlı deyil');

        const result = await this.page.evaluate(script);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Click element
    this.app.post('/api/click', async (req, res) => {
      try {
        const { selector } = req.body;
        if (!this.page) throw new Error('Browser bağlı deyil');

        await this.page.click(selector);
        res.json({ success: true, message: `Clicked: ${selector}` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Type in input
    this.app.post('/api/type', async (req, res) => {
      try {
        const { selector, text } = req.body;
        if (!this.page) throw new Error('Browser bağlı deyil');

        await this.page.type(selector, text);
        res.json({ success: true, message: `Typed in: ${selector}` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Screenshot
    this.app.get('/api/screenshot', async (req, res) => {
      try {
        if (!this.page) throw new Error('Browser bağlı deyil');

        const screenshot = await this.page.screenshot({
          encoding: 'base64',
          fullPage: req.query.fullPage === 'true'
        });

        res.json({
          success: true,
          screenshot: `data:image/png;base64,${screenshot}`
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  setupWebSocket() {
    // Real-time updates üçün WebSocket
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws) => {
      console.log('🔌 WebSocket client qoşuldu');

      // Add to listeners
      this.eventListeners.add(ws);

      // Send initial status
      ws.send(JSON.stringify({
        type: 'status',
        connected: this.isConnected,
        url: this.page?.url() || null
      }));

      ws.on('close', () => {
        console.log('❌ WebSocket client ayrıldı');
        this.eventListeners.delete(ws);
      });

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });
    });
  }

  async handleWebSocketMessage(ws, data) {
    const { type, ...params } = data;

    switch (type) {
      case 'navigate':
        if (this.page) {
          await this.page.goto(params.url);
          this.broadcastToClients({
            type: 'navigation',
            url: this.page.url()
          });
        }
        break;

      case 'execute':
        if (this.page) {
          const result = await this.page.evaluate(params.script);
          ws.send(JSON.stringify({
            type: 'execution_result',
            result
          }));
        }
        break;
    }
  }

  async tryConnectToExistingBrowser() {
    try {
      console.log('🔍 Mövcud browser axtarılır...');

      // Default debugging ports
      const ports = [9222, 9223, 9224];

      for (const port of ports) {
        try {
          await this.connectToBrowser('localhost', port);
          console.log(`✅ Browser tapıldı: port ${port}`);
          return;
        } catch (error) {
          console.log(`❌ Port ${port} boşdur`);
        }
      }

      console.log('⚠️  Aktiv browser tapılmadı. Browser-i debugging mode-da başladın:');
      console.log('   google-chrome --remote-debugging-port=9222');
      console.log('   or: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
    } catch (error) {
      console.error('Xəta:', error.message);
    }
  }

  async connectToBrowser(host = 'localhost', port = 9222) {
    try {
      console.log(`🔌 Browser-ə qoşulur: ${host}:${port}`);

      // Puppeteer ilə existing browser-ə qoşul
      this.browser = await puppeteer.connect({
        browserURL: `http://${host}:${port}`,
        defaultViewport: null
      });

      const pages = await this.browser.pages();
      this.page = pages[0] || await this.browser.newPage();

      // Event listeners qur
      await this.setupPageEventListeners();

      this.isConnected = true;

      console.log('✅ Browser-ə qoşuldu!');
      console.log(`📄 Aktiv səhifə: ${this.page.url()}`);

      // WebSocket clients-ə bildir
      this.broadcastToClients({
        type: 'connected',
        url: this.page.url()
      });

      return true;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Browser-ə qoşulma xətası: ${error.message}`);
    }
  }

  async setupPageEventListeners() {
    if (!this.page) return;

    // Console events
    this.page.on('console', (msg) => {
      const logEntry = {
        timestamp: Date.now(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };

      this.consoleLogs.push(logEntry);

      // Keep only last 1000 logs
      if (this.consoleLogs.length > 1000) {
        this.consoleLogs = this.consoleLogs.slice(-800);
      }

      // Broadcast to WebSocket clients
      this.broadcastToClients({
        type: 'console',
        log: logEntry
      });

      console.log(`🔍 Console [${msg.type()}]: ${msg.text()}`);
    });

    // Page errors
    this.page.on('pageerror', (error) => {
      const errorEntry = {
        timestamp: Date.now(),
        type: 'pageerror',
        message: error.message,
        stack: error.stack
      };

      this.consoleLogs.push(errorEntry);

      this.broadcastToClients({
        type: 'error',
        error: errorEntry
      });

      console.log(`❌ Səhifə Xətası: ${error.message}`);
    });

    // Request/Response monitoring
    this.page.on('request', (request) => {
      const logEntry = {
        timestamp: Date.now(),
        type: 'request',
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        postData: request.postData()
      };

      this.networkLogs.push(logEntry);
    });

    this.page.on('response', (response) => {
      const logEntry = {
        timestamp: Date.now(),
        type: 'response',
        status: response.status(),
        statusText: response.statusText(),
        url: response.url(),
        headers: response.headers()
      };

      this.networkLogs.push(logEntry);

      // Keep only last 1000 network logs
      if (this.networkLogs.length > 1000) {
        this.networkLogs = this.networkLogs.slice(-800);
      }
    });

    // Navigation events
    this.page.on('framenavigated', (frame) => {
      if (frame === this.page.mainFrame()) {
        console.log(`🔄 Naviqasiya: ${frame.url()}`);

        this.broadcastToClients({
          type: 'navigation',
          url: frame.url()
        });
      }
    });

    // Inject error tracking script
    await this.page.evaluateOnNewDocument(() => {
      window.__claudeCodeErrors__ = [];

      window.addEventListener('error', (event) => {
        window.__claudeCodeErrors__.push({
          timestamp: Date.now(),
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        window.__claudeCodeErrors__.push({
          timestamp: Date.now(),
          type: 'unhandledrejection',
          reason: event.reason?.toString(),
          stack: event.reason?.stack
        });
      });
    });
  }

  broadcastToClients(message) {
    const data = JSON.stringify(message);

    this.eventListeners.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  async shutdown() {
    console.log('🛑 Server bağlanır...');

    if (this.browser) {
      await this.browser.disconnect();
    }

    if (this.httpServer) {
      this.httpServer.close();
    }

    if (this.wss) {
      this.wss.close();
    }

    console.log('✅ Server bağlandı');
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('🛑 Shutdown signal alındı...');
  if (global.connectorServer) {
    await global.connectorServer.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Terminate signal alındı...');
  if (global.connectorServer) {
    await global.connectorServer.shutdown();
  }
  process.exit(0);
});

// Start server
const connectorServer = new PuppeteerBrowserConnector();
global.connectorServer = connectorServer;