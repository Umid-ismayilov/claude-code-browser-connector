#!/usr/bin/env node

/**
 * Configuration CLI Tool
 * Manage user configuration from command line
 */

import ConfigManager from '../src/config.js';
import chalk from 'chalk';

class ConfigCLI {
  constructor() {
    this.config = new ConfigManager();
    this.action = process.env.CONFIG_ACTION || 'show';
    this.key = process.env.CONFIG_KEY;
    this.value = process.env.CONFIG_VALUE;
  }

  async run() {
    console.log(chalk.blue('⚙️  Configuration Manager\n'));

    switch (this.action) {
      case 'show':
        this.showConfig();
        break;
      case 'edit':
        this.editConfig();
        break;
      case 'reset':
        this.resetConfig();
        break;
      case 'validate':
        this.validateConfig();
        break;
      default:
        console.log(chalk.red(`Unknown action: ${this.action}`));
        this.showHelp();
    }
  }

  showConfig() {
    const exported = this.config.exportConfig();

    console.log(chalk.green('📋 Current Configuration:'));
    console.log(chalk.gray('=' .repeat(40)));

    // System Info
    const system = this.config.get('system');
    if (system) {
      console.log(chalk.yellow('\n🖥️  System Information:'));
      console.log(`Platform: ${chalk.cyan(system.platform)}`);
      console.log(`Username: ${chalk.cyan(system.username)}`);
      console.log(`Node Version: ${chalk.cyan(system.nodeVersion)}`);
      console.log(`Config Path: ${chalk.cyan(system.configPath)}`);
    }

    // Server Config
    console.log(chalk.yellow('\n🌐 Server Configuration:'));
    console.log(`HTTP Port: ${chalk.cyan(this.config.get('server.port'))}`);
    console.log(`WebSocket Port: ${chalk.cyan(this.config.get('server.wsPort'))}`);
    console.log(`Host: ${chalk.cyan(this.config.get('server.host'))}`);

    // Browser Config
    console.log(chalk.yellow('\n🌍 Browser Configuration:'));
    const debugPorts = this.config.get('browser.debuggingPorts');
    console.log(`Debugging Ports: ${chalk.cyan(debugPorts?.join(', '))}`);
    console.log(`User Data Dir: ${chalk.cyan(this.config.get('browser.userDataDir'))}`);

    // Test Sites
    const testSites = this.config.getTestSites();
    console.log(chalk.yellow('\n🧪 Test Sites:'));
    Object.entries(testSites).forEach(([name, site]) => {
      console.log(`${chalk.green(name)}: ${chalk.cyan(site.url)}`);
    });

    // Paths
    console.log(chalk.yellow('\n📁 File Paths:'));
    console.log(`Config Directory: ${chalk.cyan(exported.paths.configDir)}`);
    console.log(`User Config: ${chalk.cyan(exported.paths.userConfigFile)}`);
    console.log(`Default Config: ${chalk.cyan(exported.paths.defaultConfigFile)}`);
  }

  editConfig() {
    if (!this.key) {
      console.log(chalk.red('❌ No configuration key provided'));
      console.log(chalk.gray('Usage: claude-browser config edit --key server.port --value 3005'));
      return;
    }

    if (!this.value) {
      console.log(chalk.red('❌ No configuration value provided'));
      return;
    }

    // Try to parse value as JSON, otherwise use as string
    let parsedValue = this.value;
    try {
      parsedValue = JSON.parse(this.value);
    } catch (e) {
      // Keep as string
    }

    this.config.set(this.key, parsedValue);
    console.log(chalk.green(`✅ Configuration updated: ${this.key} = ${JSON.stringify(parsedValue)}`));
  }

  resetConfig() {
    console.log(chalk.yellow('⚠️  This will reset all user configuration to defaults.'));
    console.log(chalk.gray('Press Ctrl+C to cancel, or wait 5 seconds to continue...'));

    setTimeout(() => {
      this.config.reset();
      console.log(chalk.green('✅ Configuration reset to defaults'));
    }, 5000);
  }

  validateConfig() {
    const validation = this.config.validateConfig();

    console.log(chalk.blue('🔍 Configuration Validation:'));
    console.log(chalk.gray('=' .repeat(30)));

    if (validation.valid) {
      console.log(chalk.green('✅ Configuration is valid!'));
    } else {
      console.log(chalk.red('❌ Configuration has issues:'));
      validation.issues.forEach(issue => {
        console.log(`  • ${chalk.yellow(issue)}`);
      });
    }

    // Check Chrome installation
    const platform = process.platform;
    const chromePath = this.config.get(`paths.chromePath.${platform}`);

    console.log(chalk.blue('\n🌍 Browser Check:'));
    console.log(`Chrome Path: ${chalk.cyan(chromePath)}`);

    // Check if debugging ports are available
    console.log(chalk.blue('\n🔌 Port Availability:'));
    const ports = this.config.get('browser.debuggingPorts') || [9222];
    ports.forEach(async (port) => {
      try {
        const response = await fetch(`http://localhost:${port}/json/version`);
        const data = await response.json();
        console.log(`Port ${port}: ${chalk.green('✓ Active')} - ${chalk.gray(data.Browser)}`);
      } catch (error) {
        console.log(`Port ${port}: ${chalk.red('✗ Inactive')}`);
      }
    });
  }

  showHelp() {
    console.log(chalk.blue('📖 Configuration Help:'));
    console.log(chalk.gray('Actions:'));
    console.log(`  ${chalk.green('show')}     - Display current configuration`);
    console.log(`  ${chalk.green('edit')}     - Modify configuration value`);
    console.log(`  ${chalk.green('reset')}    - Reset to default configuration`);
    console.log(`  ${chalk.green('validate')} - Validate configuration`);

    console.log(chalk.gray('\nExamples:'));
    console.log(`  claude-browser config show`);
    console.log(`  claude-browser config edit --key server.port --value 3005`);
    console.log(`  claude-browser config validate`);
    console.log(`  claude-browser config reset`);

    console.log(chalk.gray('\nCommon Configuration Keys:'));
    console.log(`  server.port              - HTTP server port`);
    console.log(`  server.wsPort           - WebSocket server port`);
    console.log(`  browser.debuggingPorts  - Browser debugging ports`);
    console.log(`  browser.userDataDir     - Chrome user data directory`);
    console.log(`  logging.level           - Log level (info, debug, warn, error)`);
    console.log(`  user.preferences.*      - User preferences`);
  }
}

// Run CLI
const cli = new ConfigCLI();
cli.run().catch(console.error);