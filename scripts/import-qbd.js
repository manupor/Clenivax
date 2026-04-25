const fs = require('fs');
const path = require('path');

const SOURCE_DIR   = '/Users/manu/Desktop/QBD';
const IMAGES_ROOT  = path.resolve(__dirname, '../images/qbd');
const OUTPUT_JSON  = path.resolve(__dirname, '../data/products.json');

function titleFromSlug(slug) {
    return slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function baseSlug(filename) {
    const stem = path.parse(filename).name;
    // Strip only a SINGLE trailing digit used as an image variant suffix (e.g. "injection2")
    // but keep multi-digit numbers that are part of the product name (e.g. "vitamin-b12", "vitamin-d3")
    return stem.replace(/([a-z])(\d)$/, '$1').replace(/-$/, '');
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
    ensureDir(IMAGES_ROOT);
    ensureDir(path.dirname(OUTPUT_JSON));

    const files = fs.readdirSync(SOURCE_DIR).filter(f =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
    );

    const grouped = {};
    for (const file of files) {
        const slug = baseSlug(file);
        if (!grouped[slug]) grouped[slug] = [];
        grouped[slug].push(file);
    }

    const products = [];

    for (const [slug, images] of Object.entries(grouped)) {
        const destDir = path.join(IMAGES_ROOT, slug);
        ensureDir(destDir);

        const savedImages = [];
        for (const imgFile of images) {
            const src  = path.join(SOURCE_DIR, imgFile);
            const dest = path.join(destDir, imgFile);
            fs.copyFileSync(src, dest);
            savedImages.push(`images/qbd/${slug}/${imgFile}`);
            console.log(`  ✓ ${slug}/${imgFile}`);
        }

        products.push({
            title:       titleFromSlug(slug),
            slug,
            description: '',
            images:      savedImages,
            source_url:  `https://www.qbdpharm.com/product/${slug}`
        });

        console.log(`✔ ${slug} (${images.length} image${images.length > 1 ? 's' : ''})`);
    }

    products.sort((a, b) => a.title.localeCompare(b.title));

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(products, null, 2), 'utf8');
    console.log(`\nDone — ${products.length} products → ${OUTPUT_JSON}`);
}

main();
