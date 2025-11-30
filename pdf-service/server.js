const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

let browser;

async function initBrowser() {
  browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
  console.log('Browser initialized');
}

app.post('/generate-pdf', async (req, res) => {
  const { html, options = {} } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'HTML content is required' });
  }

  let page;
  try {
    page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    const pdfOptions = {
      format: options.format || 'a4',
      printBackground: true,
      margin: options.margin || {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    };

    const pdf = await page.pdf(pdfOptions);

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  } finally {
    if (page) {
      await page.close();
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  await initBrowser();
  app.listen(PORT, () => {
    console.log(`PDF Service running on port ${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

start().catch(console.error);
