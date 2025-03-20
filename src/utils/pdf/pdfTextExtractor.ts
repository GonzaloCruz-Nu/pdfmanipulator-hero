
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PageContent {
  text: string;
  pageNum: number;
}

/**
 * Extract text content from a PDF file
 */
export const extractTextFromPDF = async (
  pdfData: Uint8Array, 
  onProgressUpdate: (progress: number) => void
): Promise<{ 
  pageContents: PageContent[], 
  totalTextExtracted: number, 
  numPages: number 
}> => {
  try {
    // Load the PDF document with error tolerance options
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      disableFontFace: false,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/',
      cMapPacked: true,
      useSystemFonts: true, // Allow system fonts
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded: ${pdf.numPages} pages`);
    
    onProgressUpdate(30);
    
    const numPages = pdf.numPages;
    
    // Structure to store all PDF content
    const pageContents: PageContent[] = [];
    let totalTextExtracted = 0;
    
    // Extract text from all PDF pages with better handling
    for (let i = 1; i <= numPages; i++) {
      onProgressUpdate(30 + Math.floor((i / numPages) * 40));
      console.log(`Processing page ${i} of ${numPages}`);
      
      try {
        const page = await pdf.getPage(i);
        
        // Enhanced text extraction mode with compatible options
        const textContent = await page.getTextContent({
          // Only use valid properties according to PDF.js API
          includeMarkedContent: true,
        });
        
        // Extract text page by page with better space and line break handling
        let pageText = '';
        let lastY = null;
        let lastX = null;
        
        if (textContent.items.length === 0) {
          console.log(`Page ${i}: No extractable text. Could be an image.`);
          pageText = `[This page appears to contain only images or graphics without extractable text]`;
        } else {
          for (const item of textContent.items) {
            if (!('str' in item) || typeof item.str !== 'string') continue;
            
            const text = item.str;
            const x = item.transform?.[4] || 0; // X position
            const y = item.transform?.[5] || 0; // Y position
            
            // Detect line breaks based on Y position
            if (lastY !== null && Math.abs(y - lastY) > 3) {
              // It's a significant line change
              pageText += '\n';
            } 
            // Detect spaces between words based on X position
            else if (lastX !== null && x - lastX > 10) {
              // There's a significant horizontal space
              if (!pageText.endsWith(' ') && !text.startsWith(' ')) {
                pageText += ' ';
              }
            }
            
            pageText += text;
            lastY = y;
            lastX = x + (item.width || 0);
          }
        }
        
        // Advanced method to get content operators
        try {
          const opList = await page.getOperatorList();
          // Basic analysis to detect if there is content that isn't text
          const hasImages = opList.fnArray.some(op => op === pdfjsLib.OPS.paintImageXObject);
          
          if (hasImages && pageText.trim().length < 100) {
            console.log(`Page ${i}: Contains images but little extractable text.`);
            if (pageText.trim().length === 0) {
              pageText = `[This page contains images without extractable text]`;
            }
          }
        } catch (opError) {
          console.warn(`Could not get operators for page ${i}:`, opError);
        }
        
        // Improvement: Render to canvas as backup for pages without text
        if (pageText.trim().length < 50) {
          try {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              await page.render({
                canvasContext: ctx,
                viewport: viewport
              }).promise;
              
              console.log(`Page ${i}: Rendered to canvas as backup`);
              
              // Informative note in the text
              if (pageText.trim().length === 0) {
                pageText = `[Page ${i}: This page appears to contain mainly images or graphics]`;
              }
            }
          } catch (canvasError) {
            console.warn(`Error rendering page ${i} to canvas:`, canvasError);
          }
        }
        
        // Clean up excessive whitespace
        pageText = pageText
          .replace(/\s+/g, ' ')  // Convert multiple spaces to one
          .replace(/\n\s+/g, '\n')  // Remove spaces at beginning of lines
          .replace(/\s+\n/g, '\n')  // Remove spaces at end of lines
          .replace(/\n{3,}/g, '\n\n'); // Limit multiple line breaks to max 2
        
        console.log(`Page ${i}: Extracted approximately ${pageText.length} characters`);
        totalTextExtracted += pageText.length;
        
        pageContents.push({
          text: pageText,
          pageNum: i
        });
      } catch (pageError) {
        console.error(`Error processing page ${i}:`, pageError);
        // Instead of failing, we add a page with an error message
        pageContents.push({
          text: `[Error on page ${i}: Could not extract content. Possible image or scanned content.]`,
          pageNum: i
        });
      }
    }
    
    return {
      pageContents,
      totalTextExtracted,
      numPages
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
};
