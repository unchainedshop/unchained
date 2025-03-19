#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dockerCompose from 'docker-compose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define CLI commands
program
  .name('e-commerce-benchmark')
  .description('Benchmark test for Medusa, Vendure, and Unchained e-commerce platforms')
  .version('1.0.0');

// Start command
program
  .command('start')
  .description('Start the e-commerce platforms')
  .action(async () => {
    const spinner = ora('Starting Docker containers...').start();
    
    try {
      await dockerCompose.upAll({ cwd: __dirname, log: true });
      spinner.succeed('Docker containers started');
      console.log(chalk.green('\nE-commerce platforms are now running:'));
      console.log(chalk.blue(`- Unchained: http://localhost:${process.env.UNCHAINED_PORT || 3000}`));
      console.log(chalk.blue(`- Vendure: http://localhost:${process.env.VENDURE_PORT || 3001}`));
      console.log(chalk.blue(`- Medusa: http://localhost:${process.env.MEDUSA_PORT || 3002}`));
      console.log(chalk.blue(`- MailCrab: http://localhost:${process.env.MAILCRAB_PORT || 1080}`));
      console.log(chalk.yellow('\nRun `npm test` to run the benchmark tests.'));
    } catch (error) {
      spinner.fail('Failed to start Docker containers');
      console.error('Error:', error);
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop the e-commerce platforms')
  .action(async () => {
    const spinner = ora('Stopping Docker containers...').start();
    
    try {
      await dockerCompose.down({ cwd: __dirname });
      spinner.succeed('Docker containers stopped');
    } catch (error) {
      spinner.fail('Failed to stop Docker containers');
      console.error('Error:', error);
    }
  });

// Seed command
program
  .command('seed')
  .description('Seed the e-commerce platforms with test data')
  .action(async () => {
    const spinner = ora('Seeding Docker containers...').start();
    
    try {
      // The seeding is already part of the container startup process
      // This command is just a placeholder in case we need to re-seed
      spinner.succeed('Seeding is automatically done during container startup');
      console.log(chalk.yellow('If you need to re-seed, restart the containers with `npm start`'));
    } catch (error) {
      spinner.fail('Failed to seed Docker containers');
      console.error('Error:', error);
    }
  });

// Benchmark command
program
  .command('benchmark')
  .description('Run benchmark tests')
  .option('-p, --platforms <platforms>', 'Platforms to benchmark (comma-separated)', 'unchained,vendure,medusa')
  .option('-s, --scenarios <scenarios>', 'Scenarios to benchmark (comma-separated)', 'product-list,product-detail,category-tree,facet-filter')
  .option('-d, --duration <duration>', 'Duration of each benchmark in seconds', '10')
  .action(async (options) => {
    console.log(chalk.bold.blue('\n🚀 Running benchmark tests...\n'));
    
    // Import the benchmark module dynamically
    const { default: runBenchmark } = await import('./benchmark.js');
    
    // Run the benchmark with the provided options
    await runBenchmark(options);
  });

// Parse command line arguments
program.parse(); 