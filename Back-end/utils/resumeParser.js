const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');


/**
 * Detect file type from extension
 */
const getFileType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'docx';
  if (ext === '.doc') return 'doc';
  if (['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'].includes(ext)) return 'image';
  return 'unknown';
};

/**
 * Extract text from PDF
 */
const extractFromPdf = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text || '';
};

/**
 * Extract text from DOCX/DOC
 */
const extractFromDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || '';
};

/**
 * Extract text from image using Tesseract OCR
 */
const extractFromImage = async (filePath) => {
  try {
    // Dynamic import for ESM module compatibility
    const Tesseract = require('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
      logger: () => {}, // suppress verbose logging
    });
    return text || '';
  } catch (err) {
    console.error('Tesseract OCR error:', err.message);
    // Fallback: return empty string so structurer can still try
    return '';
  }
};

/**
 * Main parser — detects type and extracts raw text
 * @param {string} filePath - absolute path to uploaded file
 * @returns {Promise<string>} raw extracted text
 */
const parseResume = async (filePath) => {
  const fileType = getFileType(filePath);
  console.log(`Parsing resume: type=${fileType}, file=${path.basename(filePath)}`);

  switch (fileType) {
    case 'pdf':
      return await extractFromPdf(filePath);
    case 'docx':
    case 'doc':
      return await extractFromDocx(filePath);
    case 'image':
      return await extractFromImage(filePath);
    default:
      throw new Error(`Unsupported file type: ${path.extname(filePath)}`);
  }
};

module.exports = { parseResume, getFileType };
