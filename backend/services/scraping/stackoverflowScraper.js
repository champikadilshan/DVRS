// backend/services/scraping/stackoverflowScraper.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs/promises');
const axios = require('axios');

class StackOverflowScraper {
    constructor(browser) {
        this.browser = browser;
    }

    async scrapeStackOverflow(searchQuery, dataDir) {
        let context = null;
        let page = null;

        try {
            console.log('Starting StackOverflow scraping for:', searchQuery);
            
            context = await this.browser.newContext({
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            });

            page = await context.newPage();

            // Navigate to Stack Overflow
            const stackOverflowURL = 'https://stackoverflow.com/';
            console.log(`Navigating to ${stackOverflowURL}...`);
            await page.goto(stackOverflowURL);

            // Search for the query
            console.log(`Searching for "${searchQuery}"...`);
            await page.fill('input[name="q"]', searchQuery);
            await page.press('input[name="q"]', 'Enter');

            // Wait for CAPTCHA if any
            console.log('Please complete any human verification if prompted.');
            await page.waitForTimeout(10000);

            // Wait for search results
            console.log('Waiting for search results...');
            await page.waitForFunction(() => {
                const container = document.querySelector('.js-post-summaries');
                return container && container.children.length > 0;
            }, { timeout: 60000 });

            // Extract first link only
            const firstLink = await page.evaluate(() => {
                const resultLink = document.querySelector('.js-post-summaries a');
                return resultLink ? resultLink.href : null;
            });

            if (!firstLink) {
                throw new Error('No StackOverflow results found');
            }

            console.log(`Found result: ${firstLink}`);

            // Prepare the data structure for external API
            const urlsData = {
                urls: [firstLink]
            };

            // Prepare the final data
            const outputData = {
                metadata: {
                    scrapeDate: new Date().toISOString(),
                    sourceUrl: stackOverflowURL,
                    searchQuery
                },
                data: {
                    source: 'stackoverflow',
                    query: searchQuery,
                    firstLink: firstLink,
                    urlsData: urlsData
                }
            };

            // Save to JSON file
            const filename = `stackoverflow-${Date.now()}.json`;
            const filepath = path.join(dataDir, filename);
            await fs.writeFile(filepath, JSON.stringify(outputData, null, 2));

            // Send to external crawler API (keep the external API call as requested)
            try {
                console.log(`Sending data to http://localhost:8000/crawl...`);
                const response = await axios.post('http://localhost:8000/crawl', urlsData, {
                    headers: { 
                        'Content-Type': 'application/json' 
                    },
                    timeout: 10000 // 10 second timeout
                });

                console.log('External crawler response:', response.data);
                
                // Add crawler response to our data
                outputData.crawlerResponse = response.data;
                
                // Re-save with crawler response
                await fs.writeFile(filepath, JSON.stringify(outputData, null, 2));
                
            } catch (crawlerError) {
                console.warn('External crawler request failed:', crawlerError.message);
                // Continue without failing the entire scraping process
                outputData.crawlerError = crawlerError.message;
                await fs.writeFile(filepath, JSON.stringify(outputData, null, 2));
            }

            return {
                success: true,
                data: outputData,
                savedAs: filename
            };

        } catch (error) {
            console.error('StackOverflow scraping error:', error);
            throw error;
        } finally {
            if (page) await page.close();
            if (context) await context.close();
        }
    }
}

module.exports = StackOverflowScraper;