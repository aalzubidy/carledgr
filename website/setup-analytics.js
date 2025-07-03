#!/usr/bin/env node

/**
 * Google Analytics Setup Script for CarLedgr Website
 * 
 * This script updates all HTML files and the config.json with your Google Analytics Measurement ID
 * 
 * Usage: node setup-analytics.js YOUR_MEASUREMENT_ID
 * Example: node setup-analytics.js G-ABC123XYZ
 */

const fs = require('fs');
const path = require('path');

const MEASUREMENT_ID_PLACEHOLDER = 'MEASUREMENT_ID_PLACEHOLDER';

function updateFile(filePath, measurementId) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Replace all instances of the placeholder
        content = content.replace(new RegExp(MEASUREMENT_ID_PLACEHOLDER, 'g'), measurementId);
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
            return true;
        } else {
            console.log(`ℹ️  No changes needed: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        return false;
    }
}

function updateConfigJson(configPath, measurementId) {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        if (!config.analytics) {
            config.analytics = {};
        }
        
        if (!config.analytics.googleAnalytics) {
            config.analytics.googleAnalytics = {};
        }
        
        config.analytics.googleAnalytics.measurementId = measurementId;
        config.analytics.googleAnalytics.enabled = true;
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(`✅ Updated config.json with measurement ID: ${measurementId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error updating config.json:`, error.message);
        return false;
    }
}

function validateMeasurementId(measurementId) {
    // Google Analytics 4 measurement IDs start with "G-"
    const regex = /^G-[A-Z0-9]{10}$/;
    return regex.test(measurementId);
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length !== 1) {
        console.error('❌ Usage: node setup-analytics.js YOUR_MEASUREMENT_ID');
        console.error('   Example: node setup-analytics.js G-ABC123XYZ');
        process.exit(1);
    }
    
    const measurementId = args[0].trim();
    
    if (!validateMeasurementId(measurementId)) {
        console.error('❌ Invalid measurement ID format. Should be like: G-ABC123XYZ');
        process.exit(1);
    }
    
    console.log(`🚀 Setting up Google Analytics with measurement ID: ${measurementId}`);
    console.log('');
    
    // Files to update
    const filesToUpdate = [
        'index.html',
        'success.html',
        'cancel.html',
        'config.json'
    ];
    
    let totalUpdated = 0;
    
    filesToUpdate.forEach(file => {
        const filePath = path.join(__dirname, file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${file}`);
            return;
        }
        
        if (file === 'config.json') {
            if (updateConfigJson(filePath, measurementId)) {
                totalUpdated++;
            }
        } else {
            if (updateFile(filePath, measurementId)) {
                totalUpdated++;
            }
        }
    });
    
    console.log('');
    console.log(`✅ Setup complete! Updated ${totalUpdated} files.`);
    console.log('');
    console.log('📊 Next steps:');
    console.log('1. Verify your Google Analytics property is set up correctly');
    console.log('2. Deploy your website with the updated files');
    console.log('3. Test the tracking by visiting your website and checking Real-time reports in GA');
    console.log('');
    console.log('🔍 What will be tracked:');
    console.log('   • Page views and user sessions');
    console.log('   • Demo button clicks (conversions)');
    console.log('   • Pricing plan interactions');
    console.log('   • Language changes');
    console.log('   • Form submissions and checkout events');
    console.log('   • Section engagement (how far users scroll)');
    console.log('   • Mobile menu usage');
    console.log('   • Successful purchases (success page)');
    console.log('   • Checkout abandonment (cancel page)');
    console.log('');
    console.log('📈 Check your analytics at: https://analytics.google.com');
}

if (require.main === module) {
    main();
}

module.exports = { updateFile, updateConfigJson, validateMeasurementId }; 