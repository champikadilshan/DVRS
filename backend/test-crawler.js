// Create this file as backend/test-crawler.js to test the crawler connection

const axios = require('axios');

async function testCrawlerConnection() {
    console.log('Testing crawler API connection...');
    
    // Test URLs (sample from Snyk)
    const testUrls = [
        'https://security.snyk.io/vuln/SNYK-JS-LODASH-567746#CVE-2024-9143-snyk',
        'https://security.snyk.io/vuln/SNYK-JS-SEMVER-1098595#CVE-2024-9143-snyk'
    ];

    try {
        console.log('Sending test request to http://localhost:8000/crawl...');
        
        const response = await axios.post('http://localhost:8000/crawl', {
            urls: testUrls,
            metadata: {
                test: true,
                timestamp: new Date().toISOString()
            }
        }, {
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'DVRS-Test/1.0'
            },
            timeout: 30000
        });

        console.log('✓ Crawler API responded successfully!');
        console.log('Response:', response.data);
        
    } catch (error) {
        console.error('✗ Crawler API test failed:');
        console.error('Error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused - make sure crawler is running on http://localhost:8000');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('Request timed out - crawler might be busy');
        } else if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testCrawlerConnection();