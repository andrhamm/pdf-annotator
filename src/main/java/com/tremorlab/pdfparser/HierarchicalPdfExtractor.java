package com.tremorlab.pdfparser;

import java.io.File;
import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;

public class HierarchicalPdfExtractor extends PDFTextStripper {

    private List<PDFTextBlock> textBlocks = new ArrayList<>();
    private Map<String, Float> fontSizes = new HashMap<>();
    private Map<String, Integer> fontWeights = new HashMap<>();
    private StringBuilder currentLineBuilder = new StringBuilder();
    private float currentFontSize = 0;
    private String currentFontName = "";
    private float lineStartY = 0;
    private PDDocument document;

    // Page range variables
    private int pageRangeStart = -1;
    private int pageRangeEnd = -1;

    // Margin variables
    private float marginLeft = 0;
    private float marginTop = 0;
    private float marginRight = 0;
    private float marginBottom = 0;
    private boolean useMargins = false;

    public HierarchicalPdfExtractor() throws IOException {
        super();
    }

    /**
     * Set the page range to extract
     * 
     * @param startPage The starting page number (1-based)
     * @param endPage   The ending page number (1-based)
     */
    public void setPageRange(int startPage, int endPage) {
        if (startPage <= 0 || endPage < startPage) {
            throw new IllegalArgumentException("Invalid page range: start must be positive and end must be >= start");
        }
        this.pageRangeStart = startPage;
        this.pageRangeEnd = endPage;
    }

    /**
     * Set margins to define the content area of interest
     * 
     * @param left   Left margin (points from left edge)
     * @param top    Top margin (points from top edge)
     * @param right  Right margin (points from right edge)
     * @param bottom Bottom margin (points from bottom edge)
     */
    public void setMargins(float left, float top, float right, float bottom) {
        this.marginLeft = left;
        this.marginTop = top;
        this.marginRight = right;
        this.marginBottom = bottom;
        this.useMargins = true;
    }

    /**
     * Main method to extract hierarchical document structure
     */
    public DocumentStructure extractHierarchy(File pdfFile) throws IOException {
        document = Loader.loadPDF(pdfFile);

        // Validate page range
        int totalPages = document.getNumberOfPages();
        if (pageRangeEnd > totalPages) {
            System.out.println("Warning: Requested end page " + pageRangeEnd +
                    " exceeds document length. Using last page (" + totalPages + ") instead.");
            pageRangeEnd = totalPages;
        }

        if (pageRangeStart <= 0) {
            // Default: process all pages
            pageRangeStart = 1;
            pageRangeEnd = totalPages;
        }

        // First, analyze the document to identify fonts and their characteristics
        analyzeFonts(document);

        // Extract text blocks with their attributes
        extractTextBlocks(document);

        // Identify headings based on font attributes
        List<PDFHeading> headings = identifyHeadings(textBlocks);

        // Build hierarchical structure
        DocumentStructure docStructure = buildHierarchy(headings, textBlocks);

        // Set document title from filename if no title found
        if (docStructure.getTitle() == null || docStructure.getTitle().isEmpty()) {
            String filename = pdfFile.getName();
            // Remove extension if present
            int extensionIndex = filename.lastIndexOf('.');
            if (extensionIndex > 0) {
                filename = filename.substring(0, extensionIndex);
            }
            docStructure.setTitle(filename);
        }

        // Add metadata about page range
        docStructure.addMetadata("pageRange", pageRangeStart + "-" + pageRangeEnd);
        docStructure.addMetadata("totalPages", String.valueOf(totalPages));

        // Add margin information to metadata if used
        if (useMargins) {
            docStructure.addMetadata("marginLeft", String.valueOf(marginLeft));
            docStructure.addMetadata("marginTop", String.valueOf(marginTop));
            docStructure.addMetadata("marginRight", String.valueOf(marginRight));
            docStructure.addMetadata("marginBottom", String.valueOf(marginBottom));
        }

        document.close();
        return docStructure;
    }

    /**
     * Analyze the document to identify different fonts and their characteristics
     */
    private void analyzeFonts(PDDocument document) throws IOException {
        // Implementation for font analysis
        // This is a simplified placeholder - actual implementation would be more
        // complex
        for (int i = 0; i < document.getNumberOfPages(); i++) {
            PDPage page = document.getPage(i);
            PDResources resources = page.getResources();
            if (resources == null)
                continue;

            // Analyze fonts on this page
            // In a real implementation, we'd examine font dictionary entries
        }
    }

    @Override
    protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
        if (textPositions.isEmpty())
            return;

        TextPosition firstPos = textPositions.get(0);
        float currentY = firstPos.getY();
        float currentX = firstPos.getX();

        // Check if text is within margins if margins are set
        if (useMargins) {
            // Get current page (note: PDFTextStripper keeps track of current page)
            PDPage currentPage = document.getPage(getCurrentPageNo() - 1); // 0-based
            float pageWidth = currentPage.getCropBox().getWidth();
            float pageHeight = currentPage.getCropBox().getHeight();

            // Calculate content boundaries
            float contentMinX = marginLeft;
            float contentMinY = marginTop;
            float contentMaxX = pageWidth - marginRight;
            float contentMaxY = pageHeight - marginBottom;

            // Skip this text if it's outside the defined margins
            // Using a center-point check for simplicity
            float textWidth = 0;
            float textHeight = 0;

            if (textPositions.size() > 1) {
                TextPosition lastPos = textPositions.get(textPositions.size() - 1);
                textWidth = (lastPos.getX() + lastPos.getWidth()) - currentX;
                textHeight = firstPos.getHeight();
            } else {
                textWidth = firstPos.getWidth();
                textHeight = firstPos.getHeight();
            }

            float centerX = currentX + (textWidth / 2);
            float centerY = currentY - (textHeight / 2);

            // Skip text outside margins
            if (centerX < contentMinX || centerX > contentMaxX ||
                    centerY < contentMinY || centerY > contentMaxY) {
                return;
            }
        }

        // If this is a new line
        if (lineStartY == 0 || Math.abs(lineStartY - currentY) > 1) {
            // Save the previous line if it exists
            if (currentLineBuilder.length() > 0) {
                saveCurrentLine();
            }

            // Start a new line
            lineStartY = currentY;
            currentLineBuilder = new StringBuilder();
            currentFontSize = firstPos.getFontSizeInPt();
            currentFontName = firstPos.getFont().getName();
        }

        // Add text to current line
        currentLineBuilder.append(text);
    }

    private void saveCurrentLine() {
        if (currentLineBuilder.length() == 0)
            return;

        String line = currentLineBuilder.toString().trim();
        if (!line.isEmpty()) {
            PDFTextBlock block = new PDFTextBlock(
                    line,
                    currentFontSize,
                    currentFontName,
                    lineStartY,
                    getCurrentPageNo());
            textBlocks.add(block);
        }
    }

    @Override
    protected void endPage(PDPage page) throws IOException {
        // Save any remaining text from the current line
        saveCurrentLine();
        currentLineBuilder = new StringBuilder();
        lineStartY = 0;
        super.endPage(page);
    }

    /**
     * Extract all text blocks from the document with their attributes
     */
    private void extractTextBlocks(PDDocument document) throws IOException {
        textBlocks.clear();
        setSortByPosition(true);

        // Use specified page range
        setStartPage(pageRangeStart);
        setEndPage(pageRangeEnd);

        StringWriter writer = new StringWriter();
        writeText(document, writer); // This will call writeString for each text element

        // Sort text blocks by page and vertical position
        Collections.sort(textBlocks);
    }

    /**
     * Identify headings based on font characteristics
     */
    private List<PDFHeading> identifyHeadings(List<PDFTextBlock> blocks) {
        List<PDFHeading> headings = new ArrayList<>();

        // Find the most common font size (body text)
        Map<Float, Integer> fontSizeCounts = new HashMap<>();
        for (PDFTextBlock block : blocks) {
            fontSizeCounts.put(block.fontSize, fontSizeCounts.getOrDefault(block.fontSize, 0) + 1);
        }

        // Determine the body text font size (most common)
        float bodyFontSize = Collections.max(fontSizeCounts.entrySet(), Map.Entry.comparingByValue()).getKey();

        // Identify headings (text with larger font size than body text)
        for (PDFTextBlock block : blocks) {
            if (block.fontSize > bodyFontSize && block.text.trim().length() > 0) {
                // This is likely a heading
                int level = determineHeadingLevel(block, bodyFontSize);
                headings.add(new PDFHeading(block.text, level, block.pageNumber, block.yPosition));
            }
        }

        return headings;
    }

    /**
     * Determine heading level based on font size
     */
    private int determineHeadingLevel(PDFTextBlock block, float bodyFontSize) {
        // Larger font size difference = higher level heading
        float sizeDifference = block.fontSize - bodyFontSize;

        if (sizeDifference > 6)
            return 1; // H1
        if (sizeDifference > 4)
            return 2; // H2
        if (sizeDifference > 2)
            return 3; // H3
        return 4; // H4
    }

    /**
     * Build hierarchical document structure from headings and text
     */
    private DocumentStructure buildHierarchy(List<PDFHeading> headings, List<PDFTextBlock> allBlocks) {
        DocumentStructure docStructure = new DocumentStructure();

        if (headings.isEmpty()) {
            // No headings found, just add all text
            StringBuilder contentBuilder = new StringBuilder();
            for (PDFTextBlock block : allBlocks) {
                contentBuilder.append(block.text).append("\n");
            }
            docStructure.setContent(contentBuilder.toString().trim());
            return docStructure;
        }

        // Process each heading and its content
        for (int i = 0; i < headings.size(); i++) {
            PDFHeading heading = headings.get(i);
            DocumentSection section = new DocumentSection();
            section.setTitle(heading.text);
            section.setLevel(heading.level);

            // Find content that belongs to this section (until next heading)
            StringBuilder contentBuilder = new StringBuilder();
            int nextHeadingIndex = i + 1;

            for (PDFTextBlock block : allBlocks) {
                // Skip blocks before this heading
                if (block.pageNumber < heading.pageNumber ||
                        (block.pageNumber == heading.pageNumber && block.yPosition <= heading.yPosition)) {
                    continue;
                }

                // Stop at next heading
                if (nextHeadingIndex < headings.size()) {
                    PDFHeading nextHeading = headings.get(nextHeadingIndex);
                    if (block.pageNumber > nextHeading.pageNumber ||
                            (block.pageNumber == nextHeading.pageNumber && block.yPosition >= nextHeading.yPosition)) {
                        break;
                    }
                }

                // Add this block's text to content
                contentBuilder.append(block.text).append("\n");
            }

            section.setContent(contentBuilder.toString().trim());

            // Add section to appropriate parent based on heading level
            docStructure.addSection(section);
        }

        return docStructure;
    }

    // Inner classes to represent document structure

    public static class PDFTextBlock implements Comparable<PDFTextBlock> {
        String text;
        float fontSize;
        String fontName;
        float yPosition;
        int pageNumber;

        public PDFTextBlock(String text, float fontSize, String fontName, float yPosition, int pageNumber) {
            this.text = text;
            this.fontSize = fontSize;
            this.fontName = fontName;
            this.yPosition = yPosition;
            this.pageNumber = pageNumber;
        }

        @Override
        public int compareTo(PDFTextBlock other) {
            if (this.pageNumber != other.pageNumber) {
                return Integer.compare(this.pageNumber, other.pageNumber);
            }
            return Float.compare(this.yPosition, other.yPosition);
        }
    }

    public static class PDFHeading {
        String text;
        int level;
        int pageNumber;
        float yPosition;

        public PDFHeading(String text, int level, int pageNumber, float yPosition) {
            this.text = text;
            this.level = level;
            this.pageNumber = pageNumber;
            this.yPosition = yPosition;
        }
    }
}
