const express = require('express');

const cors = require('cors');

const { chromium } = require('playwright');

const { execSync } = require('child_process');

const fs = require('fs/promises');

const path = require('path');

const Tesseract = require('tesseract.js');

const aiAnalysisRoutes = require('./routes/aiAnalysis');



const app = express();

app.use(cors());

app.use(express.json());



let browser = null;



const StackOverflowScraper = require('./services/scraping/stackoverflowScraper');

const SnykScraper = require('./services/scraping/snykScraper');

let stackoverflowScraper = null;

let snykScraper = null;

async function ensureDataDirectory() {

  const dataDir = path.join(__dirname, 'data');

  const screenshotsDir = path.join(dataDir, 'screenshots');

  await fs.mkdir(dataDir, { recursive: true });

  await fs.mkdir(screenshotsDir, { recursive: true });

  return { dataDir, screenshotsDir };

}



async function ensureBrowserInstalled() {
    try {
        if (!browser) {
            browser = await chromium.launch({
                headless: false,
                slowMo: 50,
                args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
            });
            // Initialize scrapers with the browser instance
            stackoverflowScraper = new StackOverflowScraper(browser);
            snykScraper = new SnykScraper(browser); // Add this line
        }
    } catch (error) {
        if (error.message.includes("Executable doesn't exist")) {
            console.log('Installing browsers...');
            try {
                execSync('npx playwright install chromium', { stdio: 'inherit' });
                browser = await chromium.launch({
                    headless: false,
                    slowMo: 50,
                    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
                });
                // Initialize scrapers after browser installation
                stackoverflowScraper = new StackOverflowScraper(browser);
                snykScraper = new SnykScraper(browser); // Add this line
            } catch (installError) {
                throw new Error(`Failed to install browser: ${installError.message}`);
            }
        } else {
            throw error;
        }
    }
    return browser;
}




async function delay(ms) {

  return new Promise(resolve => setTimeout(resolve, ms));

}





async function performOCR(imagePath) {

  try {

      const result = await Tesseract.recognize(

          imagePath,

          'eng',

          { logger: m => console.log(m) }

      );

      return result.data.text;

  } catch (error) {

      console.error('OCR Error:', error);

      return null;

  }

}







async function saveToJson(data, cveId) {

  try {

      const { dataDir } = await ensureDataDirectory();

      const filename = `${cveId}-${Date.now()}.json`;

      const filepath = path.join(dataDir, filename);

      await fs.writeFile(filepath, JSON.stringify(data, null, 2));

      console.log(`Data saved to ${filepath}`);

      return filename;

  } catch (error) {

      console.error('Error saving data:', error);

      throw error;

  }

}



app.post('/api/scrape', async (req, res) => {

  const { url } = req.body;



  if (!url) {

      return res.status(400).json({ error: 'URL is required' });

  }



  let context = null;

  let page = null;



  try {

      console.log('Ensuring browser is installed...');

      const browser = await ensureBrowserInstalled();



      console.log('Creating browser context...');

      context = await browser.newContext({

          viewport: { width: 1920, height: 1080 },

          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

          extraHTTPHeaders: {

              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',

              'Accept-Language': 'en-US,en;q=0.9',

              'Cache-Control': 'no-cache',

              'Pragma': 'no-cache',

          }

      });



      console.log('Creating new page...');

      page = await context.newPage();



      // Navigate directly to the URL

      console.log('Navigating to URL:', url);

      await page.goto(url, { 

          waitUntil: 'networkidle',

          timeout: 30000 

      });



      // Wait for content to load and stabilize

      await delay(3000);



      // Extract CVE ID from URL

      const cveId = url.split('/').pop() || 'unknown-cve';



      // Get directories

      const { screenshotsDir } = await ensureDataDirectory();

      const screenshotPath = path.join(screenshotsDir, `${cveId}-${Date.now()}.png`);



      // Take full page screenshot

      await page.screenshot({

          path: screenshotPath,

          fullPage: true

      });



      // Try direct scraping first

      let scrapedData = await page.evaluate(() => {

          const getTextContent = (selector) => {

              const element = document.querySelector(selector);

              return element ? element.textContent.trim() : null;

          };



          const getMultipleTexts = (selector) => {

              return Array.from(document.querySelectorAll(selector))

                  .map(el => el.textContent.trim())

                  .filter(text => text.length > 0);

          };



          return {

              metadata: {

                  scrapeDate: new Date().toISOString(),

                  sourceUrl: window.location.href,

                  lastUpdated: new Date().toISOString()

              },

              title: getTextContent('.vuln-detail-title, h1, #vulnTitleHeader'),

              description: getTextContent('.vuln-description, #vulnDetailTableView-description'),

              severity: getTextContent('.severityDetail'),

              cvssScore: getTextContent('.cvss3-score, .cvss2-score'),

              cvssVector: getTextContent('.cvss3-calculator-scorecard, .cvss2-calculator-scorecard'),

              references: Array.from(document.querySelectorAll('#vulnHyperlinksPanel table tbody tr')).map(row => {

                  const cells = row.querySelectorAll('td');

                  return {

                      source: cells[0]?.querySelector('a')?.href || cells[0]?.textContent.trim(),

                      description: cells[1]?.textContent.trim(),

                      tags: cells[2]?.textContent.trim()

                  };

              }).filter(ref => ref.source),

              affectedSoftware: Array.from(document.querySelectorAll('.vulnerable-software-item')).map(item => {

                  return {

                      name: item.textContent.trim(),

                      version: item.querySelector('.version')?.textContent.trim()

                  };

              }),

              publishDate: getTextContent('#publishDateRow td'),

              lastModified: getTextContent('#lastModifiedDateRow td'),

              weaknesses: getMultipleTexts('#weaknessEnumerationTableView tbody tr td:first-child')

          };

      });



      // If direct scraping failed, perform OCR

      if (!scrapedData.title || scrapedData.title.includes('unauthorized frame window')) {

          console.log('Direct scraping failed, attempting OCR...');

          const ocrText = await performOCR(screenshotPath);

          

          // Parse OCR text to extract information

          scrapedData = {

              ...scrapedData,

              metadata: {

                  ...scrapedData.metadata,

                  ocrProcessed: true

              },

              rawOcrText: ocrText,

              // Add basic parsing of OCR text here

              // This is a simple example - you might want to add more sophisticated parsing

              title: ocrText.split('\n')[0],

              description: ocrText.substring(0, 500) // First 500 characters as description

          };

      }



      // Save both data and screenshot

      const savedFilename = await saveToJson(scrapedData, cveId);

      console.log('Saved scraping results to:', savedFilename);



      // Add delay before closing

      await delay(1000);



      res.json({

        success: true,

        data: {

          ...scrapedData,

          savedAs: savedFilename,  // Make sure this is included

          screenshotPath: path.relative(__dirname, screenshotPath)

        },

        message: 'Scraping completed and data saved successfully'

      });



  } catch (error) {

    console.error('Scraping error:', error);

    res.status(500).json({

      error: 'Failed to scrape vulnerability details',

      message: error.message

    });

  } finally {

    if (page) await page.close();

    if (context) await context.close();

  }

});



// Add new endpoint for StackOverflow scraping

app.post('/api/scrape/stackoverflow', async (req, res) => {

    const { query } = req.body;



    if (!query) {

        return res.status(400).json({ error: 'Search query is required' });

    }



    try {

        await ensureBrowserInstalled();

        const { dataDir } = await ensureDataDirectory();

        

        const result = await stackoverflowScraper.scrapeStackOverflow(query, dataDir);

        

        res.json({

            success: true,

            data: result.data,

            savedAs: result.savedAs

        });

    } catch (error) {

        console.error('StackOverflow scraping error:', error);

        res.status(500).json({

            error: 'Failed to scrape StackOverflow',

            message: error.message

        });

    }

});


// Add new endpoint for Snyk scraping (add this after the StackOverflow endpoint)
app.post('/api/scrape/snyk', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        await ensureBrowserInstalled();
        const { dataDir } = await ensureDataDirectory();
        
        const result = await snykScraper.scrapeSnyk(query, dataDir);
        
        res.json({
            success: true,
            data: result.data,
            savedAs: result.savedAs
        });
    } catch (error) {
        console.error('Snyk scraping error:', error);
        res.status(500).json({
            error: 'Failed to scrape Snyk',
            message: error.message
        });
    }
});


// Endpoint to get all saved vulnerability data

app.get('/api/vulnerabilities', async (req, res) => {

    try {

        const dataDir = await ensureDataDirectory();

        const files = await fs.readdir(dataDir);

        const vulnerabilities = [];



        for (const file of files) {

            if (file.endsWith('.json')) {

                const content = await fs.readFile(path.join(dataDir, file), 'utf-8');

                vulnerabilities.push(JSON.parse(content));

            }

        }



        res.json(vulnerabilities);

    } catch (error) {

        res.status(500).json({

            error: 'Failed to retrieve vulnerabilities',

            message: error.message

        });

    }

});



app.get('/api/vulnerability/:cveId', async (req, res) => {

    try {

        const dataDir = await ensureDataDirectory();

        const files = await fs.readdir(dataDir);

        const cveFile = files.find(f => f.startsWith(req.params.cveId));

        

        if (!cveFile) {

            return res.status(404).json({ error: 'CVE data not found' });

        }



        const data = await fs.readFile(path.join(dataDir, cveFile), 'utf-8');

        res.json(JSON.parse(data));

    } catch (error) {

        res.status(500).json({

            error: 'Failed to retrieve vulnerability data',

            message: error.message

        });

    }

});



// Modify your existing cleanup endpoint to handle both scrapers

// Update the cleanup endpoint to handle all scrapers
app.post('/api/cleanup', async (req, res) => {
    try {
        if (browser) {
            stackoverflowScraper = null;
            snykScraper = null; // Add this line
            await browser.close();
            browser = null;
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NEW: Batch scraping endpoint for multiple CVEs
app.post('/api/scrape/batch', async (req, res) => {
    const { cveList, sources } = req.body;

    if (!cveList || !Array.isArray(cveList) || cveList.length === 0) {
        return res.status(400).json({ error: 'CVE list is required and must be a non-empty array' });
    }

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
        return res.status(400).json({ error: 'Sources list is required and must be a non-empty array' });
    }

    console.log(`Starting batch scraping for ${cveList.length} CVEs with sources:`, sources);

    try {
        await ensureBrowserInstalled();
        const { dataDir } = await ensureDataDirectory();
        
        const allUrls = [];
        const results = [];
        let successCount = 0;
        let errorCount = 0;

        // Process each CVE
        for (let i = 0; i < cveList.length; i++) {
            const cve = cveList[i];
            console.log(`Processing CVE ${i + 1}/${cveList.length}: ${cve}`);

            const cveResult = {
                cve: cve,
                sources: {},
                urls: [],
                success: false
            };

            // Process each source for this CVE
            for (const source of sources) {
                try {
                    let scrapeResult;

                    switch (source) {
                        case 'snyk':
                            scrapeResult = await snykScraper.scrapeSnyk(cve, dataDir);
                            break;
                        case 'stackoverflow':
                            scrapeResult = await stackoverflowScraper.scrapeStackOverflow(`${cve} vulnerability`, dataDir);
                            break;
                        default:
                            console.warn(`Unsupported source: ${source}`);
                            continue;
                    }

                    if (scrapeResult && scrapeResult.success) {
                        cveResult.sources[source] = {
                            success: true,
                            savedAs: scrapeResult.savedAs,
                            urlCount: scrapeResult.data?.results?.length || 0
                        };

                        // Collect URLs with CVE and source tags
                        if (scrapeResult.data?.results) {
                            const taggedUrls = scrapeResult.data.results.map(url => `${url}#${cve}-${source}`);
                            cveResult.urls.push(...taggedUrls);
                            allUrls.push(...taggedUrls);
                        } else if (scrapeResult.data?.firstLink) {
                            const taggedUrl = `${scrapeResult.data.firstLink}#${cve}-${source}`;
                            cveResult.urls.push(taggedUrl);
                            allUrls.push(taggedUrl);
                        }
                    } else {
                        cveResult.sources[source] = {
                            success: false,
                            error: 'No results returned'
                        };
                    }

                } catch (sourceError) {
                    console.error(`Error scraping ${source} for ${cve}:`, sourceError);
                    cveResult.sources[source] = {
                        success: false,
                        error: sourceError.message
                    };
                }

                // Add delay between source requests
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            cveResult.success = cveResult.urls.length > 0;
            if (cveResult.success) {
                successCount++;
            } else {
                errorCount++;
            }

            results.push(cveResult);

            // Add delay between CVEs
            if (i < cveList.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        console.log(`Batch scraping completed. ${successCount} successful, ${errorCount} failed. Total URLs: ${allUrls.length}`);

        // Save batch summary
        const batchSummary = {
            metadata: {
                batchDate: new Date().toISOString(),
                totalCVEs: cveList.length,
                successfulCVEs: successCount,
                failedCVEs: errorCount,
                sources: sources,
                totalUrls: allUrls.length
            },
            data: {
                cveList: cveList,
                sources: sources,
                results: results,
                allUrls: allUrls
            }
        };

        const batchFilename = `batch-scraping-${Date.now()}.json`;
        const batchFilepath = path.join(dataDir, batchFilename);
        await fs.writeFile(batchFilepath, JSON.stringify(batchSummary, null, 2));

        // Send all URLs to external crawler if we have any
        let crawlerResult = null;
        if (allUrls.length > 0) {
            try {
                console.log(`Sending ${allUrls.length} URLs to external crawler...`);
                const crawlerResponse = await axios.post('http://localhost:8000/crawl', {
                    urls: allUrls
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });

                crawlerResult = crawlerResponse.data;
                console.log('External crawler response:', crawlerResult);

                // Update batch summary with crawler result
                batchSummary.crawlerResult = crawlerResult;
                await fs.writeFile(batchFilepath, JSON.stringify(batchSummary, null, 2));

            } catch (crawlerError) {
                console.warn('External crawler request failed:', crawlerError.message);
                batchSummary.crawlerError = crawlerError.message;
                await fs.writeFile(batchFilepath, JSON.stringify(batchSummary, null, 2));
            }
        }

        res.json({
            success: true,
            summary: {
                totalCVEs: cveList.length,
                successfulCVEs: successCount,
                failedCVEs: errorCount,
                totalUrls: allUrls.length,
                sources: sources
            },
            data: batchSummary,
            savedAs: batchFilename,
            crawlerResult: crawlerResult,
            allUrls: allUrls
        });

    } catch (error) {
        console.error('Batch scraping error:', error);
        res.status(500).json({
            error: 'Batch scraping failed',
            message: error.message
        });
    }
});

// Add this endpoint to your server.js

app.get('/api/logs/:id', async (req, res) => {

    try {

      const { id } = req.params;

      const { dataDir } = await ensureDataDirectory();

      

      // Find the file that matches the ID pattern

      const files = await fs.readdir(dataDir);

      const logFile = files.find(file => file.includes(id) && file.endsWith('.json'));

      

      if (!logFile) {

        return res.status(404).json({ error: 'Log file not found' });

      }

      

      const filePath = path.join(dataDir, logFile);

      const fileContent = await fs.readFile(filePath, 'utf-8');

      const logData = JSON.parse(fileContent);

      

      res.json(logData);

    } catch (error) {

      console.error('Error reading log file:', error);

      res.status(500).json({ error: 'Failed to retrieve log data' });

    }

  });





app.use((err, req, res, next) => {

    console.error('Server error:', err);

    res.status(500).json({

        error: 'Internal server error',

        message: err.message

    });

});



const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {

    console.log(`Scraping server running on port ${PORT}`);

    console.log('Checking browser installation...');

    ensureBrowserInstalled()

        .then(() => console.log('Browser is ready'))

        .catch((err) => console.error('Failed to ensure browser:', err));

});

app.use('/api', aiAnalysisRoutes);