// backend/services/scraping/snykScraper.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs/promises');
const axios = require('axios');

class SnykScraper {
    constructor(browser) {
        this.browser = browser;
    }

    async scrapeSnyk(searchQuery, dataDir) {
        let context = null;
        let page = null;

        try {
            console.log('Starting Snyk scraping for:', searchQuery);
            
            context = await this.browser.newContext({
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            });

            page = await context.newPage();

            // Navigate to Snyk vulnerability database
            const snykVulnURL = 'https://security.snyk.io/vuln/';
            console.log(`Navigating to ${snykVulnURL}...`);
            await page.goto(snykVulnURL);

            // Wait for page to load
            await page.waitForTimeout(5000);
            
            console.log(`Searching for "${searchQuery}"...`);
            await page.waitForSelector('.input__field', { timeout: 60000 });

            // Fill in the search query
            await page.fill('.input__field', searchQuery);
            console.log('Pressing Enter to trigger the search...');
            await page.keyboard.press('Enter');

            // Wait for search results
            console.log('Waiting for search results...');
            await page.waitForSelector('.vulns-table__container table tbody tr', { timeout: 60000 });

            // Extract result links (top 6 results)
            const resultLinks = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('.vulns-table__container table tbody tr'));
                return rows.slice(0, 1).map(row => {
                    const linkElement = row.querySelector('a');
                    return linkElement ? linkElement.href : null;
                }).filter(link => link !== null);
            });

            if (resultLinks.length === 0) {
                throw new Error('No results found or unable to detect links in the results table.');
            }

            console.log(`Found ${resultLinks.length} result links.`);

            // Prepare the data structure
            const urlsData = {
                urls: resultLinks
            };

            // Prepare the final data
            const outputData = {
                metadata: {
                    scrapeDate: new Date().toISOString(),
                    sourceUrl: snykVulnURL,
                    searchQuery,
                    resultCount: resultLinks.length
                },
                data: {
                    source: 'snyk',
                    query: searchQuery,
                    results: resultLinks,
                    urlsData: urlsData
                }
            };

            // Save to JSON file
            const filename = `snyk-${Date.now()}.json`;
            const filepath = path.join(dataDir, filename);
            await fs.writeFile(filepath, JSON.stringify(outputData, null, 2));

            // Send URLs to backend crawler (keep the external API call as requested)
            try {
                console.log(`Sending URLs to http://localhost:8000/crawl ...`);
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
            console.error('Snyk scraping error:', error);
            throw error;
        } finally {
            if (page) await page.close();
            if (context) await context.close();
        }
    }
}

module.exports = SnykScraper;