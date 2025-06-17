// backend/services/scraping/snykScraper.js - ENHANCED VERSION
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

            // Extract result links (top 10 results for better coverage)
            const resultLinks = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('.vulns-table__container table tbody tr'));
                return rows.slice(0, 10).map(row => {
                    const linkElement = row.querySelector('a');
                    return linkElement ? linkElement.href : null;
                }).filter(link => link !== null);
            });

            if (resultLinks.length === 0) {
                throw new Error('No results found or unable to detect links in the results table.');
            }

            console.log(`Found ${resultLinks.length} result links for ${searchQuery}.`);

            // Extract CVE code from search query for tagging
            const cveMatch = searchQuery.match(/CVE-\d{4}-\d+/i);
            const cveCode = cveMatch ? cveMatch[0] : searchQuery;

            // Tag URLs with CVE code
            const taggedUrls = resultLinks.map(url => `${url}#${cveCode}`);

            // Prepare the data structure
            const urlsData = {
                urls: taggedUrls,
                cve: cveCode,
                source: 'snyk'
            };

            // Prepare the final data
            const outputData = {
                metadata: {
                    scrapeDate: new Date().toISOString(),
                    sourceUrl: snykVulnURL,
                    searchQuery,
                    resultCount: resultLinks.length,
                    cveCode: cveCode
                },
                data: {
                    source: 'snyk',
                    query: searchQuery,
                    cve: cveCode,
                    results: taggedUrls,
                    urlsData: urlsData
                }
            };

            // Save to JSON file with CVE code in filename
            const timestamp = Date.now();
            const filename = `snyk-${cveCode}-${timestamp}.json`;
            const filepath = path.join(dataDir, filename);
            await fs.writeFile(filepath, JSON.stringify(outputData, null, 2));

            console.log(`Saved Snyk results for ${cveCode} to ${filename}`);

            return {
                success: true,
                data: outputData,
                savedAs: filename,
                urls: taggedUrls,
                cve: cveCode
            };

        } catch (error) {
            console.error('Snyk scraping error:', error);
            throw error;
        } finally {
            if (page) await page.close();
            if (context) await context.close();
        }
    }

    // New method for batch CVE processing
    async scrapeMultipleCVEs(cveList, dataDir) {
        const results = [];
        const allUrls = [];

        for (let i = 0; i < cveList.length; i++) {
            const cve = cveList[i];
            console.log(`Processing CVE ${i + 1}/${cveList.length}: ${cve}`);
            
            try {
                const result = await this.scrapeSnyk(cve, dataDir);
                results.push(result);
                allUrls.push(...result.urls);
                
                // Add delay between requests to avoid rate limiting
                if (i < cveList.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } catch (error) {
                console.error(`Failed to scrape CVE ${cve}:`, error);
                results.push({
                    success: false,
                    cve: cve,
                    error: error.message
                });
            }
        }

        // Create batch summary file
        const batchData = {
            metadata: {
                batchDate: new Date().toISOString(),
                totalCVEs: cveList.length,
                successfulCVEs: results.filter(r => r.success).length,
                failedCVEs: results.filter(r => !r.success).length
            },
            data: {
                source: 'snyk',
                cves: cveList,
                results: results,
                allUrls: allUrls,
                urlsData: { urls: allUrls }
            }
        };

        const batchFilename = `snyk-batch-${Date.now()}.json`;
        const batchFilepath = path.join(dataDir, batchFilename);
        await fs.writeFile(batchFilepath, JSON.stringify(batchData, null, 2));

        return {
            success: true,
            data: batchData,
            savedAs: batchFilename,
            allUrls: allUrls,
            results: results
        };
    }
}

module.exports = SnykScraper;