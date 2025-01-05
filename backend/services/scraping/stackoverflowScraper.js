// services/scraping/stackoverflowScraper.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs/promises');

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
            await page.goto('https://stackoverflow.com/');
            console.log('Navigating to StackOverflow...');

            // Search for the query
            await page.fill('input[name="q"]', searchQuery);
            await page.press('input[name="q"]', 'Enter');

            // Wait for search results with timeout and retry logic
            let retryCount = 0;
            const maxRetries = 3;
            while (retryCount < maxRetries) {
                try {
                    await page.waitForSelector('.js-post-summaries', { timeout: 20000 });
                    break;
                } catch (error) {
                    retryCount++;
                    if (retryCount === maxRetries) throw error;
                    console.log('Retrying to wait for search results...');
                    await page.reload();
                }
            }

            // Get the first result link
            const firstLink = await page.evaluate(() => {
                const resultLink = document.querySelector('.js-post-summaries a');
                return resultLink ? resultLink.href : null;
            });

            if (!firstLink) {
                throw new Error('No StackOverflow results found');
            }

            // Navigate to the first result
            await page.goto(firstLink);
            await page.waitForSelector('.js-post-body', { timeout: 30000 });

            // Scrape answers and additional information
            const scrapedData = await page.evaluate(() => {
                const answers = Array.from(document.querySelectorAll('.js-post-body'))
                    .map(answer => answer.innerText.trim());

                const votes = Array.from(document.querySelectorAll('.js-vote-count'))
                    .map(vote => parseInt(vote.innerText.trim()) || 0);

                const acceptedAnswer = document.querySelector('.js-accepted-answer');
                
                return {
                    title: document.querySelector('h1')?.textContent.trim(),
                    question: document.querySelector('.question .js-post-body')?.innerText.trim(),
                    answers: answers.map((text, index) => ({
                        text,
                        votes: votes[index] || 0,
                        isAccepted: index === 0 && acceptedAnswer !== null
                    })),
                    tags: Array.from(document.querySelectorAll('.post-tag'))
                        .map(tag => tag.textContent.trim())
                };
            });

            // Prepare the final data
            const outputData = {
                metadata: {
                    scrapeDate: new Date().toISOString(),
                    sourceUrl: firstLink,
                    searchQuery
                },
                ...scrapedData
            };

            // Save to JSON file
            const filename = `stackoverflow-${Date.now()}.json`;
            const filepath = path.join(dataDir, filename);
            await fs.writeFile(filepath, JSON.stringify(outputData, null, 2));

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