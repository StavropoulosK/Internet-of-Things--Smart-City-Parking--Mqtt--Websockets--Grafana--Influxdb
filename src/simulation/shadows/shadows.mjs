import puppeteer from "puppeteer";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    // launch fake browser to run the script
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1000,
            height: 1000
        }
    });
    // console.log('browser launched');

    const page = await browser.newPage();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, 'shadow_map.html');

    await page.goto(`file://${filePath}`);

    setTimeout(async () => {
        await browser.close();
        // Change ~/downloads to the actual path where the file is downloaded
        const oldPath = path.join(process.env.DOWNLOAD_FOLDER, 'shadow_data.png');
        const newPath = path.join(process.cwd(), 'src/simulation/shadows/shadow_data.png');

        fs.rename(oldPath, newPath, (err) => {
            if (err) throw err;
            // console.log('File moved successfully');
        });
    }, 16000);
})();