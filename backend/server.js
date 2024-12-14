// backend/server.js
const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

let browser = null;

async function ensureBrowserInstalled() {
  try {
    if (!browser) {
      // Try to launch browser
      browser = await chromium.launch({
        headless: false,
        slowMo: 50,
      });
    }
  } catch (error) {
    if (error.message.includes("Executable doesn't exist")) {
      console.log('Installing browsers...');
      try {
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        // Try launching again after installation
        browser = await chromium.launch({
          headless: false,
          slowMo: 50,
        });
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
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      viewport: { width: 1280, height: 720 },
    });

    console.log('Creating new page...');
    page = await context.newPage();

    // Add visual delay
    await delay(1000);
    console.log('Navigating to URL:', url);

    await page.goto(url);
    console.log('Waiting for page load...');

    await page.waitForLoadState('networkidle');
    await delay(2000);

    const data = await page.evaluate(() => {
      function highlightElement(element) {
        if (element) {
          const originalBackground = element.style.backgroundColor;
          const originalTransition = element.style.transition;
          element.style.transition = 'background-color 0.3s';
          element.style.backgroundColor = 'yellow';
          setTimeout(() => {
            element.style.backgroundColor = originalBackground;
            element.style.transition = originalTransition;
          }, 1000);
        }
      }

      const getTextContent = (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          highlightElement(element);
          return element.textContent.trim();
        }
        return null;
      };

      return {
        title: getTextContent('h1') || 'N/A',
        detailedDescription:
          getTextContent('.vulnerability-description') ||
          getTextContent('[data-testid="description"]') ||
          'Description not found',
        severity:
          getTextContent('.severity') ||
          getTextContent('[data-testid="severity"]') ||
          'N/A',
        impactScore:
          getTextContent('.impact-score') ||
          getTextContent('[data-testid="impact"]') ||
          'N/A',
        affectedVersions: Array.from(
          document.querySelectorAll(
            '.affected-versions li, [data-testid="versions"] li'
          )
        ).map((el) => {
          highlightElement(el);
          return el.textContent.trim();
        }),
        detailedRemediation:
          getTextContent('.remediation') ||
          getTextContent('[data-testid="remediation"]') ||
          'Remediation steps not found',
      };
    });

    await delay(3000);

    await page.close();
    await context.close();

    res.json({
      success: true,
      data,
      message: 'Scraping completed successfully',
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      error: 'Failed to scrape vulnerability details',
      message: error.message,
    });
  } finally {
    if (page) await page.close();
    if (context) await context.close();
  }
});

app.post('/api/cleanup', async (req, res) => {
  try {
    if (browser) {
      await browser.close();
      browser = null;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
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
