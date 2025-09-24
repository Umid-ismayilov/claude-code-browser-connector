#!/usr/bin/env node

/**
 * Post-install script for Claude Code Browser Connector
 * Runs after npm install to setup configuration
 */

import ConfigManager from '../src/config.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

class PostInstall {
  constructor() {
    this.config = new ConfigManager();
  }

  async run() {
    console.log(chalk.blue('\n🎉 Claude Code Browser Connector installed successfully!\n'));

    // Initialize configuration
    console.log(chalk.green('⚙️  Initializing configuration...'));

    const validation = this.config.validateConfig();
    if (validation.valid) {
      console.log(chalk.green('✅ Configuration is valid'));
    } else {
      console.log(chalk.yellow('⚠️  Configuration needs attention:'));
      validation.issues.forEach(issue => {
        console.log(`   • ${chalk.gray(issue)}`);
      });
    }

    // Show system information
    const system = this.config.get('system');
    console.log(chalk.blue('\n📋 System Information:'));
    console.log(`Platform: ${chalk.cyan(system.platform)}`);
    console.log(`User: ${chalk.cyan(system.username)}`);
    console.log(`Config Directory: ${chalk.cyan(system.configPath)}`);

    // Show next steps
    console.log(chalk.yellow('\n🚀 Next Steps:'));
    console.log(`1. ${chalk.green('claude-browser setup')} - Setup Claude Code integration`);
    console.log(`2. ${chalk.green('claude-browser browser')} - Start Chrome in debugging mode`);
    console.log(`3. ${chalk.green('claude-browser start')} - Start the connector server`);
    console.log(`4. ${chalk.green('claude-browser test aztv')} - Test with AZTV website`);

    console.log(chalk.yellow('\n📖 Documentation:'));
    console.log(`Config: ${chalk.green('claude-browser config show')}`);
    console.log(`Status: ${chalk.green('claude-browser status')}`);
    console.log(`Help: ${chalk.green('claude-browser --help')}`);

    console.log(chalk.blue('\n🌟 Happy automating!\n'));
  }
}

// Skip post-install in CI environments
if (process.env.CI || process.env.npm_config_production) {
  console.log('Skipping post-install in CI/production environment');
  process.exit(0);
}

// Run post-install
const postInstall = new PostInstall();
postInstall.run().catch(console.error);