#!/usr/bin/env node

/**
 * Claude Code Browser Connector CLI
 * Global command-line interface
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const logo = `
${chalk.blue('  ╔═══════════════════════════════════╗')}
${chalk.blue('  ║')} ${chalk.yellow('Claude Code Browser Connector')} ${chalk.blue('║')}
${chalk.blue('  ║')} ${chalk.gray('Professional Browser Automation')} ${chalk.blue('║')}
${chalk.blue('  ╚═══════════════════════════════════╝')}
`;

yargs(hideBin(process.argv))
  .scriptName('claude-browser')
  .usage(logo + '\n\n$0 <command> [options]')

  .command(
    'start [port]',
    'Start the browser connector server',
    (yargs) => {
      return yargs
        .positional('port', {
          describe: 'HTTP server port',
          type: 'number',
          default: 3001
        })
        .option('ws-port', {
          describe: 'WebSocket server port',
          type: 'number',
          default: 3002
        })
        .option('browser-port', {
          describe: 'Browser debugging port',
          type: 'number',
          default: 9222
        })
        .option('config', {
          describe: 'Path to config file',
          type: 'string'
        })
        .option('verbose', {
          describe: 'Enable verbose logging',
          type: 'boolean',
          alias: 'v'
        });
    },
    (argv) => {
      console.log(logo);
      console.log(chalk.green('🚀 Starting browser connector server...'));

      const env = {
        ...process.env,
        SERVER_PORT: argv.port,
        WS_PORT: argv.wsPort,
        BROWSER_PORT: argv.browserPort,
        VERBOSE: argv.verbose
      };

      if (argv.config) env.CONFIG_PATH = argv.config;

      const child = spawn('node', [path.join(rootDir, 'src', 'index.js')], {
        stdio: 'inherit',
        env
      });

      child.on('close', (code) => {
        console.log(chalk.yellow(`\n🛑 Server stopped with code ${code}`));
      });
    }
  )

  .command(
    'test [site]',
    'Run tests on a specific site',
    (yargs) => {
      return yargs
        .positional('site', {
          describe: 'Site to test (aztv, demo, google, or custom URL)',
          type: 'string',
          default: 'all'
        })
        .option('timeout', {
          describe: 'Test timeout in milliseconds',
          type: 'number',
          default: 30000
        });
    },
    (argv) => {
      console.log(chalk.blue('🧪 Running tests...'));

      const env = {
        ...process.env,
        TEST_SITE: argv.site,
        TEST_TIMEOUT: argv.timeout
      };

      spawn('node', [path.join(rootDir, 'test', 'runner.js')], {
        stdio: 'inherit',
        env
      });
    }
  )

  .command(
    'config [action]',
    'Manage configuration',
    (yargs) => {
      return yargs
        .positional('action', {
          describe: 'Configuration action',
          choices: ['show', 'edit', 'reset', 'validate'],
          default: 'show'
        })
        .option('key', {
          describe: 'Configuration key to modify',
          type: 'string'
        })
        .option('value', {
          describe: 'Configuration value to set',
          type: 'string'
        });
    },
    (argv) => {
      const env = {
        ...process.env,
        CONFIG_ACTION: argv.action,
        CONFIG_KEY: argv.key,
        CONFIG_VALUE: argv.value
      };

      spawn('node', [path.join(rootDir, 'scripts', 'config-cli.js')], {
        stdio: 'inherit',
        env
      });
    }
  )

  .command(
    'setup',
    'Setup Claude Code integration',
    () => {},
    () => {
      console.log(chalk.green('⚙️  Setting up Claude Code integration...'));

      spawn('node', [path.join(rootDir, 'scripts', 'setup.js')], {
        stdio: 'inherit'
      });
    }
  )

  .command(
    'browser',
    'Start browser in debugging mode',
    (yargs) => {
      return yargs
        .option('port', {
          describe: 'Debugging port',
          type: 'number',
          default: 9222
        })
        .option('user-data-dir', {
          describe: 'Chrome user data directory',
          type: 'string'
        });
    },
    (argv) => {
      console.log(chalk.blue('🌐 Starting Chrome in debugging mode...'));

      const env = {
        ...process.env,
        DEBUG_PORT: argv.port,
        USER_DATA_DIR: argv.userDataDir
      };

      // Start Chrome directly with debugging flags
      const platform = process.platform;
      let chromePath;

      if (platform === 'darwin') {
        chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      } else if (platform === 'linux') {
        chromePath = 'google-chrome';
      } else if (platform === 'win32') {
        chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      }

      const chromeArgs = [
        `--remote-debugging-port=${argv.port}`,
        '--remote-debugging-address=0.0.0.0',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-hang-monitor',
        '--disable-sync',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ];

      if (argv.userDataDir) {
        chromeArgs.push(`--user-data-dir="${argv.userDataDir}"`);
      } else {
        chromeArgs.push(`--user-data-dir="/tmp/claude-code-chrome"`);
      }

      console.log(chalk.blue(`🌐 Starting Chrome: ${chromePath}`));
      console.log(chalk.gray(`🔌 Debug Port: ${argv.port}`));

      spawn(chromePath, chromeArgs, {
        stdio: 'inherit',
        env: process.env,
        detached: true
      });
    }
  )

  .command(
    'status',
    'Check server and browser status',
    () => {},
    async () => {
      console.log(chalk.blue('📊 Checking status...'));

      try {
        const response = await fetch('http://localhost:3001/api/status');
        const status = await response.json();

        console.log('\n' + chalk.green('✅ Server Status:'));
        console.log(`Connected: ${status.connected ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`Browser: ${status.browser ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`Page: ${status.page ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`URL: ${chalk.cyan(status.url || 'None')}`);
        console.log(`Network Logs: ${chalk.yellow(status.networkLogs)}`);
        console.log(`Console Logs: ${chalk.yellow(status.consoleLogs)}`);
      } catch (error) {
        console.log(chalk.red('❌ Server not running or not responding'));
        console.log(chalk.gray('Run: claude-browser start'));
      }
    }
  )

  .command(
    'stop',
    'Stop the browser connector server',
    () => {},
    () => {
      console.log(chalk.yellow('🛑 Stopping server...'));

      // Try to stop gracefully
      spawn('pkill', ['-f', 'claude-code-browser-connector'], {
        stdio: 'inherit'
      });
    }
  )

  .option('help', {
    alias: 'h',
    describe: 'Show help'
  })
  .option('version', {
    alias: 'V',
    describe: 'Show version number'
  })

  .example('$0 start', 'Start server with default settings')
  .example('$0 start 3005 --ws-port 3006', 'Start with custom ports')
  .example('$0 test aztv', 'Test AZTV website')
  .example('$0 config show', 'Show current configuration')
  .example('$0 browser --port 9223', 'Start Chrome on port 9223')
  .example('$0 status', 'Check if server is running')

  .help()
  .version('1.0.0')
  .demandCommand(1, 'You need to specify a command')
  .strict()
  .argv;