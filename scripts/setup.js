#!/usr/bin/env node

/**
 * Setup script for Claude Code Puppeteer Browser Connector
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

class SetupManager {
  constructor() {
    this.configDir = process.env.HOME + '/.config/claude-code';
    this.mcpConfigFile = this.configDir + '/mcp_servers.json';
  }

  async run() {
    console.log('🔧 Claude Code Puppeteer Browser Connector Setup');
    console.log('='.repeat(50));

    try {
      await this.checkNodeVersion();
      await this.installDependencies();
      await this.setupMCPConfig();
      await this.testConnection();
      await this.showUsageInstructions();

      console.log('\n✅ Setup tamamlandı! İndi Claude Code ilə browser control edə bilərsiniz.');
    } catch (error) {
      console.error('❌ Setup xətası:', error.message);
      process.exit(1);
    }
  }

  async checkNodeVersion() {
    console.log('🔍 Node.js versiyası yoxlanılır...');

    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();
      const majorVersion = parseInt(version.substring(1).split('.')[0]);

      if (majorVersion < 16) {
        throw new Error(`Node.js 16+ tələb olunur. Sizin versiyançz: ${version}`);
      }

      console.log(`✅ Node.js versiyası: ${version}`);
    } catch (error) {
      throw new Error('Node.js tapılmadı. Yükləyin: https://nodejs.org');
    }
  }

  async installDependencies() {
    console.log('📦 Dependencies yüklənir...');

    try {
      const { stdout, stderr } = await execAsync('npm install', { cwd: __dirname });
      console.log('✅ Dependencies yükləndi');
    } catch (error) {
      throw new Error(`Dependencies yükləmə xətası: ${error.message}`);
    }
  }

  async setupMCPConfig() {
    console.log('⚙️  Claude Code MCP konfiqurasiyası...');

    // Create config directory if not exists
    try {
      await execAsync(`mkdir -p "${this.configDir}"`);
    } catch (error) {
      // Directory might already exist
    }

    // MCP server config
    const mcpConfig = {
      'claude-code-browser': {
        command: 'node',
        args: [join(__dirname, 'claude-mcp.js')],
        env: {
          NODE_ENV: 'production'
        }
      }
    };

    let existingConfig = {};

    // Read existing config if it exists
    if (existsSync(this.mcpConfigFile)) {
      try {
        const configContent = readFileSync(this.mcpConfigFile, 'utf8');
        existingConfig = JSON.parse(configContent);
        console.log('📄 Mövcud MCP konfiqurasiyası tapıldı');
      } catch (error) {
        console.log('⚠️  Mövcud konfiqurasiya oxunmadı, yenisi yaradılacaq');
      }
    }

    // Merge configs
    const finalConfig = { ...existingConfig, ...mcpConfig };

    // Write config
    writeFileSync(this.mcpConfigFile, JSON.stringify(finalConfig, null, 2));
    console.log(`✅ MCP konfiqurasiyası yazıldı: ${this.mcpConfigFile}`);
  }

  async testConnection() {
    console.log('🔍 Browser debugging port yoxlanılır...');

    try {
      // Test common debugging ports
      const ports = [9222, 9223, 9224];
      let foundPort = null;

      for (const port of ports) {
        try {
          const { stdout } = await execAsync(`curl -s http://localhost:${port}/json/version`);
          const response = JSON.parse(stdout);
          if (response.Browser) {
            foundPort = port;
            console.log(`✅ Browser tapıldı: ${response.Browser} (port ${port})`);
            break;
          }
        } catch (error) {
          // Port is not responding
        }
      }

      if (!foundPort) {
        console.log('⚠️  Aktiv browser debugging port tapılmadı');
        console.log('   Browser-i debugging mode-da başladin:');
        console.log('   google-chrome --remote-debugging-port=9222');
        console.log('   və ya macOS üçün:');
        console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
      }
    } catch (error) {
      console.log('⚠️  Browser connection test edilə bilmədi:', error.message);
    }
  }

  async showUsageInstructions() {
    console.log('\n📋 İSTİFADƏ TƏLİMATLARI');
    console.log('='.repeat(25));

    console.log('\n1️⃣ Browser-i debugging mode-da başladın:');
    console.log('   google-chrome --remote-debugging-port=9222');
    console.log('   və ya:');
    console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');

    console.log('\n2️⃣ Puppeteer server-i başladın:');
    console.log(`   cd ${__dirname}`);
    console.log('   npm start');

    console.log('\n3️⃣ Claude Code-u başladın:');
    console.log('   claude-code');

    console.log('\n4️⃣ Claude Code-da browser tools istifadə edin:');
    console.log('   > Connect to browser and navigate to google.com');
    console.log('   > Get console logs from the current page');
    console.log('   > Take a screenshot of the page');

    console.log('\n🔧 MÖVCUD BROWSER TOOLS:');
    const tools = [
      'browser_connect - Connect to existing browser',
      'browser_navigate - Navigate to URL',
      'browser_get_page_info - Get page details',
      'browser_get_console_logs - Get console logs',
      'browser_get_network_logs - Get network requests',
      'browser_click - Click on elements',
      'browser_type - Type in inputs',
      'browser_execute - Run JavaScript',
      'browser_screenshot - Take screenshots',
      'browser_status - Check connection status'
    ];

    tools.forEach(tool => console.log(`   • ${tool}`));

    console.log('\n🌐 API ENDPOINTS (server running):');
    console.log('   • http://localhost:3001/api/status');
    console.log('   • http://localhost:3001/api/page-info');
    console.log('   • WebSocket: ws://localhost:3002');

    console.log('\n🆘 TROUBLESHOOTING:');
    console.log('   • Browser debugging port açıq deyilsə: browser restart');
    console.log('   • MCP connection problem: claude-code restart');
    console.log('   • Dependencies issue: npm install --force');

    console.log('\n📂 FILES CREATED:');
    console.log(`   • MCP Config: ${this.mcpConfigFile}`);
    console.log(`   • Server: ${join(__dirname, 'server.js')}`);
    console.log(`   • MCP Bridge: ${join(__dirname, 'claude-mcp.js')}`);
  }
}

// Run setup
const setup = new SetupManager();
setup.run().catch(console.error);