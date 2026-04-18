// ============================================
// resume.service.js - PDF Resume Parser
// ============================================
// Parses PDF resume files and extracts text.
// Uses dynamic import to avoid DOMMatrix issues
// at server startup.
// ============================================

/**
 * Parse a PDF buffer and extract all text content.
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @returns {string} - Extracted text
 */
export const parseResume = async (pdfBuffer) => {
  try {
    // Dynamic import to avoid loading pdfjs-dist at startup
    // (pdfjs-dist references DOMMatrix which doesn't exist in Node.js)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { getDocument } = pdfjsLib;

    // Convert Buffer to Uint8Array for pdfjs-dist
    const data = new Uint8Array(pdfBuffer);

    const pdf = await getDocument({ data }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    // Fallback: if pdfjs fails, try a simpler approach
    try {
      // Try extracting raw text from PDF buffer
      const text = pdfBuffer.toString('utf-8');
      // Look for text between stream/endstream markers (basic PDF text extraction)
      const matches = text.match(/\((.*?)\)/g);
      if (matches && matches.length > 0) {
        const extracted = matches
          .map((m) => m.slice(1, -1))
          .filter((s) => s.length > 1 && /[a-zA-Z]/.test(s))
          .join(' ');
        if (extracted.length > 50) return extracted;
      }
    } catch (fallbackError) {
      // Fallback also failed
    }
    throw new Error('Failed to parse resume PDF. Please try a different file.');
  }
};
