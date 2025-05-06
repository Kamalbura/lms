// LMS Vercel Deployment Script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to execute commands and log output
function runCommand(command) {
  console.log(`\n🔧 Running: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return error.stderr;
  }
}

// Check if vercel CLI is installed
function checkVercelCli() {
  try {
    execSync('vercel --version', { encoding: 'utf8' });
    return true;
  } catch (e) {
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log('\n=== LMS VERCEL DEPLOYMENT SCRIPT ===');
  console.log('This script will help you deploy your LMS application to Vercel');

  // Check Vercel CLI installation
  if (!checkVercelCli()) {
    console.log('❌ Vercel CLI not found. Installing...');
    runCommand('npm install -g vercel');
  }
  
  console.log('✅ Vercel CLI is installed');

  // Ensure all environment variables are set
  console.log('\n📝 Checking environment variables...');
  console.log('The following environment variables are needed for deployment:');
  console.log('- MONGO_URI: MongoDB connection string');
  console.log('- JWT_SECRET: Secret for JWT authentication');
  console.log('- CLOUDINARY_CLOUD_NAME: Cloudinary cloud name');
  console.log('- CLOUDINARY_API_KEY: Cloudinary API key');
  console.log('- CLOUDINARY_API_SECRET: Cloudinary API secret');
  
  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  const isReady = await question('\nDo you have all these values ready? (y/n): ');
  
  if (isReady.toLowerCase() !== 'y') {
    console.log('\n⚠️ Please prepare all environment variables before deploying.');
    console.log('You can find most of these values in your .env.vercel file.');
    rl.close();
    return;
  }
  
  // Login to Vercel if needed
  console.log('\n🔑 Checking Vercel login status...');
  const loginOutput = runCommand('vercel whoami || echo "Not logged in"');
  
  if (loginOutput.includes('Not logged in')) {
    console.log('Please log in to Vercel:');
    runCommand('vercel login');
  }

  // Ask if this is the first deployment or an update
  const deployType = await question('\nIs this a first-time deployment or an update? (first/update): ');
  
  if (deployType.toLowerCase() === 'first') {
    // First-time deployment
    console.log('\n🚀 Setting up a new project on Vercel...');
    console.log('You will be prompted to enter environment variables during setup.');
    console.log('When asked if you want to link to existing project, select "N" to create a new one.');
    
    runCommand('vercel');
    
    console.log('\n🔧 Deploying production build...');
    runCommand('vercel --prod');
  } else {
    // Update existing deployment
    console.log('\n🔄 Updating existing Vercel deployment...');
    runCommand('vercel --prod');
  }
  
  console.log('\n✅ Deployment complete!');
  console.log('\n📋 Post-deployment checklist:');
  console.log('1. Visit the deployed URL to ensure the homepage loads');
  console.log('2. Test user authentication (login/register)');
  console.log('3. Test API endpoints like /api/health');
  console.log('4. Check course viewing and enrollment functionality');
  console.log('5. Test assessment features');
  
  rl.close();
}

deploy().catch(console.error);