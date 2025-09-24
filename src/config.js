#!/usr/bin/env node

/**
 * Configuration Manager for Claude Code Browser Connector
 * Handles user-specific configurations and defaults
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'claude-code-browser-connector');
    this.userConfigFile = path.join(this.configDir, 'config.json');
    this.defaultConfigFile = path.join(__dirname, '..', 'config', 'default.json');

    this.defaultConfig = null;
    this.userConfig = null;
    this.mergedConfig = null;

    this.init();
  }

  init() {
    // Ensure config directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
      console.log(`📁 Config directory created: ${this.configDir}`);
    }

    // Load default configuration
    this.loadDefaultConfig();

    // Load or create user configuration
    this.loadUserConfig();

    // Merge configurations
    this.mergeConfigs();
  }

  loadDefaultConfig() {
    try {
      const defaultConfigContent = fs.readFileSync(this.defaultConfigFile, 'utf8');
      this.defaultConfig = JSON.parse(defaultConfigContent);

      // Replace paths with actual system values
      this.defaultConfig.paths.configDir = this.configDir;
      this.defaultConfig.paths.logsDir = path.join(os.homedir(), '.local', 'share', 'claude-code-browser-connector', 'logs');

      // Ensure logs directory exists
      if (!fs.existsSync(this.defaultConfig.paths.logsDir)) {
        fs.mkdirSync(this.defaultConfig.paths.logsDir, { recursive: true });
      }

    } catch (error) {
      console.error('❌ Error loading default config:', error.message);
      this.defaultConfig = this.getMinimalConfig();
    }
  }

  loadUserConfig() {
    if (fs.existsSync(this.userConfigFile)) {
      try {
        const userConfigContent = fs.readFileSync(this.userConfigFile, 'utf8');
        this.userConfig = JSON.parse(userConfigContent);
        console.log('✅ User configuration loaded');
      } catch (error) {
        console.error('❌ Error loading user config:', error.message);
        this.userConfig = {};
      }
    } else {
      // Create initial user config with system-specific values
      this.userConfig = this.createInitialUserConfig();
      this.saveUserConfig();
      console.log('✅ Initial user configuration created');
    }
  }

  createInitialUserConfig() {
    const systemInfo = this.getSystemInfo();

    return {
      system: systemInfo,
      server: {
        port: 3001,
        wsPort: 3002
      },
      browser: {
        debuggingPorts: [9222, 9223, 9224],
        userDataDir: path.join(os.tmpdir(), 'claude-code-chrome-' + systemInfo.username)
      },
      user: {
        name: systemInfo.username,
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      customTestSites: {
        // Users can add their own test sites here
      },
      preferences: {
        autoStart: true,
        showNotifications: true,
        logLevel: "info"
      }
    };
  }

  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      username: os.userInfo().username,
      homeDir: os.homedir(),
      nodeVersion: process.version,
      configPath: this.configDir
    };
  }

  mergeConfigs() {
    this.mergedConfig = this.deepMerge(this.defaultConfig, this.userConfig || {});

    // Update user config timestamp
    if (this.mergedConfig.user) {
      this.mergedConfig.user.lastAccessed = new Date().toISOString();
    }
  }

  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  get(key) {
    if (!key) return this.mergedConfig;

    const keys = key.split('.');
    let value = this.mergedConfig;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let current = this.userConfig;

    // Navigate to the parent of the target key
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    // Set the final value
    current[keys[keys.length - 1]] = value;

    // Update timestamp
    if (this.userConfig.user) {
      this.userConfig.user.lastUpdated = new Date().toISOString();
    }

    // Save to file
    this.saveUserConfig();

    // Re-merge configs
    this.mergeConfigs();

    console.log(`✅ Configuration updated: ${key}`);
  }

  addTestSite(name, siteConfig) {
    if (!this.userConfig.customTestSites) {
      this.userConfig.customTestSites = {};
    }

    this.userConfig.customTestSites[name] = {
      ...siteConfig,
      addedAt: new Date().toISOString()
    };

    this.saveUserConfig();
    this.mergeConfigs();

    console.log(`✅ Test site added: ${name}`);
  }

  getTestSites() {
    const defaultSites = this.get('testSites') || {};
    const customSites = this.get('customTestSites') || {};

    return { ...defaultSites, ...customSites };
  }

  saveUserConfig() {
    try {
      fs.writeFileSync(this.userConfigFile, JSON.stringify(this.userConfig, null, 2));
    } catch (error) {
      console.error('❌ Error saving user config:', error.message);
    }
  }

  getMinimalConfig() {
    return {
      server: { port: 3001, wsPort: 3002, host: "localhost" },
      browser: { debuggingPorts: [9222], defaultHost: "localhost" },
      logging: { level: "info", maxConsoleLogs: 1000, maxNetworkLogs: 1000 },
      features: { autoConnectOnStart: true, enableScreenshots: true },
      paths: {
        chromePath: {
          darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          linux: "google-chrome",
          win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        }
      }
    };
  }

  exportConfig() {
    return {
      default: this.defaultConfig,
      user: this.userConfig,
      merged: this.mergedConfig,
      paths: {
        configDir: this.configDir,
        userConfigFile: this.userConfigFile,
        defaultConfigFile: this.defaultConfigFile
      }
    };
  }

  validateConfig() {
    const issues = [];
    const config = this.mergedConfig;

    // Check required fields
    if (!config.server?.port) issues.push('server.port is required');
    if (!config.browser?.debuggingPorts?.length) issues.push('browser.debuggingPorts is required');

    // Check Chrome path exists
    const platform = os.platform();
    const chromePath = config.paths?.chromePath?.[platform];
    if (chromePath && !fs.existsSync(chromePath)) {
      issues.push(`Chrome not found at: ${chromePath}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  reset() {
    if (fs.existsSync(this.userConfigFile)) {
      fs.unlinkSync(this.userConfigFile);
      console.log('🗑️  User configuration reset');
    }

    this.init();
  }
}

export default ConfigManager;