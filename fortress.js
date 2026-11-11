/**
 * ============================================================================
 * 🛡️ TikTok Live Automation Engine - "قەڵای نەبەز" (Iron Fortress Core)
 * ============================================================================
 * پەرەپێدراو بۆ کۆنتڕۆڵکردنی ئۆتۆماتیکی و پارێزراوی ئەکاونتەکان لەسەر لایڤی تیکتۆک.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ڕێکخستنە سەرەکییەکانی پڕۆژە
const CONFIG = {
    headless: true, // دەکاتە true بۆ ئەوەی لە پشت پەردەوە بە بێ کێشە کار بکات
    viewport: { width: 375, height: 812 }, // شێوازی شاشەی مۆبایل بۆ خۆپاراستن لە ناسینەوە وەک بۆت
    sessionDir: path.join(__dirname, 'sessions'), // فۆڵدەری پاشەکەوتکردنی کووکیز و سێشنەکان
    maxRetries: 3
};

// دڵنیابوونەوە بوونی فۆڵدەری سێشنەکان
if (!fs.existsSync(CONFIG.sessionDir)) {
    fs.mkdirSync(CONFIG.sessionDir, { recursive: true });
}

/**
 * دەستپێکردنی قەڵاکە و ناردنی لایک بۆ لایڤ
 * @param {string} liveUrl - لینکی لایڤی تیکتۆک
 * @param {Array<string>} accountList - لیستی ناوی ئەکاونتەکان یان ئیمەیلەکان
 * @param {number} speedMs - خێرایی ناردنی داواکارییەکان بە میلی چرکە
 */
async function launchFortressEngine(liveUrl, accountList, speedMs = 2000) {
    console.log(`\n🛡️ [قەڵای نەبەز]: سیستەم دەستی بەکارکرد کرد بۆ لایڤی: ${liveUrl}`);
    console.log(`👥 ژمارەی ئەکاونتە چالاکەکان: ${accountList.length}\n`);

    // کردنەوەی براوسەر بە شێوازێکی پارێزراو (Anti-Detection)
    const browser = await puppeteer.launch({
        headless: CONFIG.headless,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-size=375,812',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        for (let i = 0; i < accountList.length; i++) {
            const accountId = accountList[i];
            console.log(`> [پڕۆسە]: دەستپێک لەگەڵ ئەکاونتی (#${i + 1} - ${accountId})`);

            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            
            // شاردنەوەی نیشانەکانی ئۆتۆمەیشن
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
            });

            await page.setViewport(CONFIG.viewport);

            // پاشەکەوتکردن یان بارکردنی سێشنی پێشوو (Session Persistence)
            const sessionPath = path.join(CONFIG.sessionDir, `${accountId.replace(/[@.]/g, '_')}.json`);
            if (fs.existsSync(sessionPath)) {
                const cookies = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
                await page.setCookie(...cookies);
                console.log(`   └─ سێشنی پارێزراو بارهێنرا بۆ ${accountId}`);
            }

            try {
                // چوونە ناو لایڤەکە
                await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                console.log(`   └─ بە سەرکەوتوویی چووە ناو لایڤەکە!`);

                // پاشەکەوتکردنی کووکیز دوای چوونە ژوورەوە
                const currentCookies = await page.cookies();
                fs.writeFileSync(sessionPath, JSON.stringify(currentCookies, null, 2));

                // لۆژیکی لایک ناردن (سیستەمی قەڵا)
                let likeCounter = 0;
                const heartInterval = setInterval(async () => {
                    try {
                        // کلیککردنی ئۆتۆماتیکی لەسەر شاشەی لایڤ بۆ ناردنی لایک
                        await page.mouse.click(200, 400);
                        likeCounter++;
                        process.stdout.write(`❤️ [${accountId}]: لایکی ژمارە ${likeCounter} نێردرا\r`);
                    } catch (err) {
                        clearInterval(heartInterval);
                    }
                }, speedMs);

                // هەر ئەکاونتێک بۆ ماوەی دیاریکراو کار دەکات پاشان دەگوازرێتەوە
                await new Promise(resolve => setTimeout(resolve, 15000));
                clearInterval(heartInterval);

            } catch (err) {
                console.log(`❌ هەڵە لە ئەکاونتی ${accountId}: ${err.message}`);
            } finally {
                await context.close();
            }
        }
    } catch (globalError) {
        console.error(`🚨 کێشەیەکی گەورە ڕوویدا لە قەڵاکەدا:`, globalError.message);
    } finally {
        await browser.close();
        console.log(`\n🛡️ [قەڵای نەبەز]: هەموو پڕۆسەکان تەواو بوون و براوسەر داخرا.`);
    }
}

// نموونەی تاقیکردنەوەی بانگکردنی فەنکشنەکە:
// const sampleLive = "https://www.tiktok.com/@username/live";
// const accounts = ["account_1@tiktok.com", "account_2@tiktok.com"];
// launchFortressEngine(sampleLive, accounts, 2000);

module.exports = { launchFortressEngine };
