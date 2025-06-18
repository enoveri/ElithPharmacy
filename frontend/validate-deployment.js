#!/usr/bin/env node

// Deployment validation script
import fs from 'fs';
import path from 'path';

console.log('🚀 Elith Pharmacy - Deployment Validation');
console.log('==========================================\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('package.json'),
    fix: 'Ensure package.json is in the root directory'
  },
  {
    name: 'Environment template exists',
    check: () => fs.existsSync('.env.example'),
    fix: 'Create .env.example with required variables'
  },
  {
    name: 'Vercel config exists',
    check: () => fs.existsSync('vercel.json'),
    fix: 'Create vercel.json with proper configuration'
  },
  {
    name: 'Build directory exists',
    check: () => fs.existsSync('dist'),
    fix: 'Run npm run build to create dist directory'
  },
  {
    name: 'Build files exist',
    check: () => fs.existsSync('dist/index.html'),
    fix: 'Rebuild the project: npm run build'
  },
  {
    name: 'Git ignore configured',
    check: () => {
      if (!fs.existsSync('.gitignore')) return false;
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      return gitignore.includes('node_modules') && gitignore.includes('dist');
    },
    fix: 'Update .gitignore to exclude node_modules and dist'
  },
  {
    name: 'Database setup SQL exists',
    check: () => fs.existsSync('database-setup.sql'),
    fix: 'Create database-setup.sql with table schemas'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   💡 Fix: ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n==========================================');

if (allPassed) {
  console.log('🎉 All checks passed! Ready for deployment to Vercel.');
  console.log('\nNext steps:');
  console.log('1. Set up environment variables in Vercel');
  console.log('2. Create Supabase database tables');
  console.log('3. Deploy to Vercel');
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
}

// Additional environment check
if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('\n✅ Environment variables are configured');
} else {
  console.log('\n❌ Environment variables missing');
  console.log('   💡 Create .env.local with Supabase credentials');
}
