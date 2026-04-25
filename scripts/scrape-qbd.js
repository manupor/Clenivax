const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.qbdpharm.com';
const PRODUCT_LIST_URL = `${BASE_URL}/product`;
const OUTPUT_JSON = path.resolve(__dirname, '../data/products.json');
const IMAGES_ROOT = path.resolve(__dirname, '../images/qbd');
const DELAY_MS = 1200;
const MAX_RETRIES = 3;

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

let _browser = null;

async function getBrowser() {
    if (!_browser) {
        _browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
        });
    }
    return _browser;
}

async function fetchHTML(url, retries = MAX_RETRIES) {
    const browser = await getBrowser();
    for (let attempt = 1; attempt <= retries; attempt++) {
        const page = await browser.newPage();
        try {
            await page.setUserAgent(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );
            await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            const html = await page.content();
            await page.close();
            return html;
        } catch (err) {
            await page.close();
            if (attempt === retries) throw err;
            console.warn(`  ↻ retry ${attempt}/${retries - 1} for ${url}`);
            await sleep(DELAY_MS * attempt * 2);
        }
    }
}

async function downloadImage(url, destPath) {
    if (fs.existsSync(destPath)) return;
    const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 20000,
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
    });
    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(destPath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

function resolveUrl(href) {
    if (!href) return null;
    if (href.startsWith('http')) return href;
    return `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
}

function extractImageFilename(url) {
    const parsed = new URL(url);
    const basename = path.basename(parsed.pathname) || 'image.jpg';
    return slugify(path.parse(basename).name) + path.extname(basename).toLowerCase();
}

async function getProductUrls() {
    const html = await fetchHTML(PRODUCT_LIST_URL);
    const $ = cheerio.load(html);
    const urls = new Set();

    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const resolved = resolveUrl(href);
        if (resolved && resolved.includes('/product/') && resolved !== PRODUCT_LIST_URL) {
            const clean = resolved.split('?')[0].split('#')[0];
            urls.add(clean);
        }
    });

    return [...urls];
}

async function scrapeProduct(url) {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    const title = (
        $('h1').first().text() ||
        $('h2').first().text() ||
        $('title').text()
    ).trim();

    const descriptionParts = [];
    $('p, .description, .product-description, [class*="desc"]').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) descriptionParts.push(text);
    });
    const description = [...new Set(descriptionParts)].join('\n\n');

    const imageUrls = new Set();
    $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        const dataSrc = $(el).attr('data-src') || $(el).attr('data-lazy-src');
        [src, dataSrc].forEach((raw) => {
            const resolved = resolveUrl(raw);
            if (resolved && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(resolved)) {
                const highRes = resolved.replace(/-\d+x\d+(\.\w+)$/, '$1');
                imageUrls.add(highRes);
            }
        });
    });

    return {
        title,
        description,
        imageUrls: [...imageUrls],
    };
}

async function main() {
    ensureDir(path.dirname(OUTPUT_JSON));
    ensureDir(IMAGES_ROOT);

    console.log('Fetching product list...');
    const productUrls = await getProductUrls();
    console.log(`Found ${productUrls.length} products.\n`);

    const results = [];

    for (let i = 0; i < productUrls.length; i++) {
        const url = productUrls[i];
        console.log(`Scraping ${i + 1} of ${productUrls.length}: ${url}`);

        try {
            const { title, description, imageUrls } = await scrapeProduct(url);
            const slug = slugify(title || `product-${i + 1}`);
            const imgDir = path.join(IMAGES_ROOT, slug);
            ensureDir(imgDir);

            const savedImages = [];
            for (const imgUrl of imageUrls) {
                try {
                    const filename = extractImageFilename(imgUrl);
                    const destPath = path.join(imgDir, filename);
                    await downloadImage(imgUrl, destPath);
                    savedImages.push(`images/qbd/${slug}/${filename}`);
                    console.log(`  ✓ image: ${filename}`);
                } catch (imgErr) {
                    console.warn(`  ✗ image failed (${imgUrl}): ${imgErr.message}`);
                }
            }

            results.push({
                title,
                slug,
                description,
                images: savedImages,
                source_url: url,
            });
        } catch (err) {
            console.error(`  ✗ product failed (${url}): ${err.message}`);
            results.push({
                title: '',
                slug: slugify(`product-${i + 1}`),
                description: '',
                images: [],
                source_url: url,
            });
        }

        if (i < productUrls.length - 1) await sleep(DELAY_MS);
    }

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nDone. ${results.length} products saved to ${OUTPUT_JSON}`);

    if (_browser) await _browser.close();
}

main().catch((err) => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
