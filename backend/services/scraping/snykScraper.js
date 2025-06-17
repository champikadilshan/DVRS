// // backend/services/scraping/snykScraper.js - ENHANCED DEBUG VERSION

// const { chromium } = require('playwright');
// const path = require('path');
// const fs = require('fs/promises');
// const axios = require('axios');

// class SnykScraper {
//     constructor(browser) {
//         this.browser = browser;
//     }

//     async scrapeSnyk(searchQuery, dataDir) {
//         let context = null;
//         let page = null;

//         try {
//             console.log('Starting Snyk scraping for:', searchQuery);
            
//             context = await this.browser.newContext({
//                 viewport: { width: 1920, height: 1080 },
//                 userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
//             });

//             page = await context.newPage();

//             // Navigate to Snyk vulnerability database
//             const snykVulnURL = 'https://security.snyk.io/vuln/';
//             console.log(`Navigating to ${snykVulnURL}...`);
//             await page.goto(snykVulnURL);

//             // Wait for page to load
//             await page.waitForTimeout(5000);
            
//             console.log(`Searching for "${searchQuery}"...`);
//             await page.waitForSelector('.input__field', { timeout: 60000 });

//             // Fill in the search query
//             await page.fill('.input__field', searchQuery);
//             console.log('Pressing Enter to trigger the search...');
//             await page.keyboard.press('Enter');

//             // Wait for search results
//             console.log('Waiting for search results...');
//             await page.waitForSelector('.vulns-table__container table tbody tr', { timeout: 60000 });

//             // Extract result links (top 10 results for better coverage)
//             const resultLinks = await page.evaluate(() => {
//                 const rows = Array.from(document.querySelectorAll('.vulns-table__container table tbody tr'));
//                 return rows.slice(0, 10).map(row => {
//                     const linkElement = row.querySelector('a');
//                     return linkElement ? linkElement.href : null;
//                 }).filter(link => link !== null);
//             });

//             if (resultLinks.length === 0) {
//                 throw new Error('No results found or unable to detect links in the results table.');
//             }

//             console.log(`Found ${resultLinks.length} result links for ${searchQuery}.`);
//             console.log('Sample URLs:', resultLinks.slice(0, 3));

//             // Extract CVE code from search query for tagging
//             const cveMatch = searchQuery.match(/CVE-\d{4}-\d+/i);
//             const cveCode = cveMatch ? cveMatch[0] : searchQuery;

//             // DON'T tag URLs here - let the batch processor handle tagging
//             // This ensures URLs are in their raw form for the batch processor
            
//             // Prepare the data structure with BOTH formats for compatibility
//             const urlsData = {
//                 urls: resultLinks,
//                 cve: cveCode,
//                 source: 'snyk'
//             };

//             // Prepare the final data
//             const outputData = {
//                 metadata: {
//                     scrapeDate: new Date().toISOString(),
//                     sourceUrl: snykVulnURL,
//                     searchQuery,
//                     resultCount: resultLinks.length,
//                     cveCode: cveCode
//                 },
//                 data: {
//                     source: 'snyk',
//                     query: searchQuery,
//                     cve: cveCode,
//                     results: resultLinks,  // Primary URL location
//                     urlsData: urlsData     // Secondary URL location
//                 }
//             };

//             // Save to JSON file with CVE code in filename
//             const timestamp = Date.now();
//             const filename = `snyk-${cveCode}-${timestamp}.json`;
//             const filepath = path.join(dataDir, filename);
//             await fs.writeFile(filepath, JSON.stringify(outputData, null, 2));

//             console.log(`✓ Saved Snyk results for ${cveCode} to ${filename}`);
//             console.log(`✓ URLs saved in data.results: ${resultLinks.length}`);
//             console.log(`✓ URLs saved in data.urlsData.urls: ${urlsData.urls.length}`);

//             return {
//                 success: true,
//                 data: outputData,
//                 savedAs: filename,
//                 urls: resultLinks,  // Also provide URLs at root level
//                 cve: cveCode
//             };

//         } catch (error) {
//             console.error('✗ Snyk scraping error:', error);
//             throw error;
//         } finally {
//             if (page) await page.close();
//             if (context) await context.close();
//         }
//     }
// }

// module.exports = SnykScraper;

// backend/services/scraping/snykScraper.js - SINGLE URL VERSION

// Replace your entire backend/services/scraping/snykScraper.js with this:

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

            // FIXED: Extract only the FIRST result link (1 URL per CVE)
            const firstResultLink = await page.evaluate(() => {
                const firstRow = document.querySelector('.vulns-table__container table tbody tr');
                if (firstRow) {
                    const linkElement = firstRow.querySelector('a');
                    return linkElement ? linkElement.href : null;
                }
                return null;
            });

            if (!firstResultLink) {
                throw new Error('No results found or unable to detect links in the results table.');
            }

            console.log(`Found first result link for ${searchQuery}: ${firstResultLink}`);

            // Extract CVE code from search query for tagging
            const cveMatch = searchQuery.match(/CVE-\d{4}-\d+/i);
            const cveCode = cveMatch ? cveMatch[0] : searchQuery;

            // Single URL array
            const resultUrls = [firstResultLink];
            
            // Prepare the data structure
            const urlsData = {
                urls: resultUrls,
                cve: cveCode,
                source: 'snyk'
            };

            // Prepare the final data
            const outputData = {
                metadata: {
                    scrapeDate: new Date().toISOString(),
                    sourceUrl: snykVulnURL,
                    searchQuery,
                    resultCount: 1, // Always 1 now
                    cveCode: cveCode
                },
                data: {
                    source: 'snyk',
                    query: searchQuery,
                    cve: cveCode,
                    results: resultUrls,  // Single URL array
                    urlsData: urlsData    
                }
            };

            // Save to JSON file with CVE code in filename
            const timestamp = Date.now();
            const filename = `snyk-${cveCode}-${timestamp}.json`;
            const filepath = path.join(dataDir, filename);
            await fs.writeFile(filepath, JSON.stringify(outputData, null, 2));

            console.log(`✓ Saved Snyk result for ${cveCode} to ${filename}`);
            console.log(`✓ Single URL saved: ${firstResultLink}`);

            return {
                success: true,
                data: outputData,
                savedAs: filename,
                urls: resultUrls,  // Single URL array
                cve: cveCode
            };

        } catch (error) {
            console.error('✗ Snyk scraping error:', error);
            throw error;
        } finally {
            if (page) await page.close();
            if (context) await context.close();
        }
    }
}

module.exports = SnykScraper;