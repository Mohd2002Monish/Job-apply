const sharp = require('sharp');
const fs = require('fs');

async function makeDarkAndMobile() {
  const desktopPath = '/Users/mohd2002monish/Desktop/Job-apply-app/Front-end/public/logo_desktop.png';
  const darkOutputPath = '/Users/mohd2002monish/Desktop/Job-apply-app/Front-end/public/logo_desktop_dark.png';
  const mobileOutputPath = '/Users/mohd2002monish/Desktop/Job-apply-app/Front-end/public/logo_mobile.png';

  console.log("Loading desktop logo...");
  if (!fs.existsSync(desktopPath)) {
    throw new Error(`Base desktop logo not found at: ${desktopPath}`);
  }

  const image = sharp(desktopPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  // 1. Create Dark Mode Logo: convert dark text to white
  const darkData = Buffer.from(data);
  for (let i = 0; i < darkData.length; i += 4) {
    const r = darkData[i];
    const g = darkData[i+1];
    const b = darkData[i+2];
    const a = darkData[i+3];

    if (a > 10) {
      const maxChannel = Math.max(r, g, b);
      const minChannel = Math.min(r, g, b);
      const diff = maxChannel - minChannel;
      
      // If the pixel is dark and low-saturation (grayscale text)
      if (diff < 45 && maxChannel < 150) {
        darkData[i] = 255;
        darkData[i+1] = 255;
        darkData[i+2] = 255;
      }
    }
  }

  // Save dark mode logo
  if (fs.existsSync(darkOutputPath)) fs.unlinkSync(darkOutputPath);
  await sharp(darkData, {
    raw: { width, height, channels: 4 }
  })
  .png()
  .toFile(darkOutputPath);
  console.log(`Saved dark desktop logo to: ${darkOutputPath}`);

  // 2. Extract mobile logo by finding the transparent gap column between icon and text
  let gapX = -1;
  for (let x = 0; x < width; x++) {
    let colIsEmpty = true;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha > 0) {
        colIsEmpty = false;
        break;
      }
    }
    // We want the first gap column after we have seen some icon content on the left
    if (colIsEmpty && x > 10) {
      gapX = x;
      break;
    }
  }

  if (gapX === -1) {
    console.warn("Could not find a transparent gap column! Using fallback crop.");
    gapX = Math.floor(width * 0.35);
  }

  console.log(`Cropping mobile icon from x=0 to x=${gapX}`);

  // Crop the icon section
  if (fs.existsSync(mobileOutputPath)) fs.unlinkSync(mobileOutputPath);
  await sharp(desktopPath)
    .extract({ left: 0, top: 0, width: gapX, height: height })
    .trim()
    .png()
    .toFile(mobileOutputPath);

  console.log(`Saved mobile logo to: ${mobileOutputPath}`);
}

(async () => {
  try {
    await makeDarkAndMobile();
    console.log("=== LOGO SYNC COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Error running logo sync:", err);
  }
})();
