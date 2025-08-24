#!/usr/bin/env node

/**
 * Script to help set up environment variables for Netlify deployment
 * This script reads your .env.local file and outputs the variables in a format
 * that can be easily copied to Netlify's environment variable settings
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(process.cwd(), '.env.local');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('❌ .env.local file not found!');
    console.log('Please create a .env.local file with your environment variables.');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const envVars = {};

  lines.forEach((line, index) => {
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      return;
    }

    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      console.warn(`⚠️  Line ${index + 1}: Invalid format - ${line}`);
      return;
    }

    const key = line.substring(0, equalIndex).trim();
    const value = line.substring(equalIndex + 1).trim();

    // Remove quotes if present
    const cleanValue = value.replace(/^["']|["']$/g, '');
    envVars[key] = cleanValue;
  });

  return envVars;
}

function main() {
  console.log('🚀 G-Bax Netlify Environment Setup\n');

  const envVars = parseEnvFile(ENV_FILE);
  
  // Required variables for Netlify deployment
  const requiredVars = [
    'NEXT_PUBLIC_HONEYCOMB_ADMIN_PRIVATE_KEY',
    'NEXT_PUBLIC_HONEYCOMB_PROJECT_ADDRESS',
    'NEXT_PUBLIC_HONEYCOMB_PROFILES_TREE_ADDRESS',
    'NEXT_PUBLIC_HONEYCOMB_RPC_URL',
    'NEXT_PUBLIC_HONEYCOMB_ENVIRONMENT'
  ];

  console.log('📋 Environment Variables for Netlify:\n');
  console.log('Copy these to your Netlify site settings > Environment variables:\n');

  let missingVars = [];

  requiredVars.forEach(varName => {
    if (envVars[varName]) {
      console.log(`${varName}=${envVars[varName]}`);
    } else {
      console.log(`${varName}=❌ MISSING`);
      missingVars.push(varName);
    }
  });

  // Show optional variables
  console.log('\n📋 Optional Variables:\n');
  
  const optionalVars = [
    'NEXT_PUBLIC_SOLANA_NETWORK',
    'NEXT_PUBLIC_HONEYCOMB_API_KEY',
    'NEXT_PUBLIC_BACKEND_URL'
  ];

  optionalVars.forEach(varName => {
    if (envVars[varName]) {
      console.log(`${varName}=${envVars[varName]}`);
    } else {
      console.log(`${varName}=not set`);
    }
  });

  if (missingVars.length > 0) {
    console.log('\n❌ Missing Required Variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\nPlease add these to your .env.local file before deploying.');
    process.exit(1);
  }

  console.log('\n✅ All required environment variables are present!');
  console.log('\n📝 Next Steps:');
  console.log('1. Copy the variables above to Netlify dashboard');
  console.log('2. Push your code to trigger a deployment');
  console.log('3. Check the deployment logs for any issues');
  console.log('\n🔗 Netlify Dashboard: https://app.netlify.com/');
}

if (require.main === module) {
  main();
}
