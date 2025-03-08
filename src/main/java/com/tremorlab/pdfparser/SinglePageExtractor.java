package com.tremorlab.pdfparser;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.apache.pdfbox.pdmodel.graphics.form.PDFormXObject;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.PDFTextStripperByArea;
import org.apache.pdfbox.text.TextPosition;

import java.awt.geom.Rectangle2D;
import java.io.File;
import java.io.IOException;
import java.io.StringWriter;
import java.util.*;

/**
 * Extractor for detailed information about a single PDF page
 */
public class SinglePageExtractor {
    private boolean normalizeText = true;
    // Add margin settings with default values
    private float marginLeft = 0;
    private float marginTop = 0;
    private float marginRight = 0;
    private float marginBottom = 0;
    private boolean useMargins = false;

    /**
     * Set whether text should be normalized for font size inconsistencies
     */
    public void setNormalizeText(boolean normalizeText) {
        this.normalizeText = normalizeText;
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
     * Extract detailed metadata and content from a specific page
     * 
     * @param pdfFile   The PDF file
     * @param pageIndex The 1-based page number
     * @return A PageData object containing page information
     * @throws IOException If there's an error processing the PDF
     */
    public PageData extractPage(File pdfFile, int pageIndex) throws IOException {
        if (pageIndex < 1) {
            throw new IllegalArgumentException("Page index must be 1 or greater");
        }

        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            int totalPages = document.getNumberOfPages();

            if (pageIndex > totalPages) {
                throw new IllegalArgumentException("Page index " + pageIndex +
                        " exceeds document length " + totalPages);
            }

            // PDFBox uses 0-based indexing internally
            PDPage page = document.getPage(pageIndex - 1);

            // Create a PageData object to hold all information
            PageData pageData = new PageData();
            pageData.setPageNumber(pageIndex);
            pageData.setTotalPages(totalPages);

            // Extract page dimensions
            PDRectangle cropBox = page.getCropBox();
            PDRectangle mediaBox = page.getMediaBox();
            pageData.setWidth(cropBox.getWidth());
            pageData.setHeight(cropBox.getHeight());
            pageData.setMediaBoxWidth(mediaBox.getWidth());
            pageData.setMediaBoxHeight(mediaBox.getHeight());
            pageData.setRotation(page.getRotation());

            // Set margins metadata if they're being used
            if (useMargins) {
                pageData.setUsingMargins(true);
                pageData.setMargins(marginLeft, marginTop, marginRight, marginBottom);
            }

            // Extract page resources
            analyzePageResources(page, pageData);

            // Extract text content using standard text stripper
            extractBasicText(document, pageIndex, pageData);

            // Extract text with positioning information
            extractPositionedText(document, pageIndex, pageData);

            // Extract text by regions (divide page into quadrants for example)
            extractTextByRegions(page, pageData);

            return pageData;
        }
    }

    /**
     * Analyze page resources (fonts, images, etc.)
     */
    private void analyzePageResources(PDPage page, PageData pageData) throws IOException {
        PDResources resources = page.getResources();
        if (resources == null)
            return;

        // Extract font information
        Map<String, FontInfo> fontInfoMap = new HashMap<>();
        for (COSName fontName : resources.getFontNames()) {
            PDFont font = resources.getFont(fontName);
            if (font != null) {
                FontInfo fontInfo = new FontInfo();
                fontInfo.setName(font.getName());
                fontInfo.setId(fontName.getName());
                fontInfo.setEmbedded(font.isEmbedded());
                fontInfoMap.put(fontName.getName(), fontInfo);
            }
        }
        pageData.setFonts(fontInfoMap);

        // Extract image information
        List<ImageInfo> imageInfoList = new ArrayList<>();
        for (COSName xObjectName : resources.getXObjectNames()) {
            PDXObject xObject = resources.getXObject(xObjectName);

            // Check if this XObject is an image
            if (xObject instanceof PDImageXObject) {
                PDImageXObject image = (PDImageXObject) xObject;
                ImageInfo imageInfo = new ImageInfo();
                imageInfo.setName(xObjectName.getName());
                imageInfo.setWidth(image.getWidth());
                imageInfo.setHeight(image.getHeight());
                imageInfo.setColorSpace(image.getColorSpace() != null ? image.getColorSpace().getName() : "unknown");
                imageInfo.setBitsPerComponent(image.getBitsPerComponent());
                imageInfoList.add(imageInfo);
            }
            // Check if this XObject is a form (can contain other content)
            else if (xObject instanceof PDFormXObject) {
                PDFormXObject form = (PDFormXObject) xObject;
                // Process form XObjects if needed
                // This is a simplified example
                ImageInfo formInfo = new ImageInfo();
                formInfo.setName(xObjectName.getName() + " (Form)");
                formInfo.setWidth((int) form.getBBox().getWidth());
                formInfo.setHeight((int) form.getBBox().getHeight());
                formInfo.setColorSpace("form");
                imageInfoList.add(formInfo);
            }
        }
        pageData.setImages(imageInfoList);
    }

    /**
     * Extract basic text from the page
     */
    private void extractBasicText(PDDocument document, int pageIndex, PageData pageData) throws IOException {
        PDFTextStripper textStripper = new PDFTextStripper();
        textStripper.setStartPage(pageIndex);
        textStripper.setEndPage(pageIndex);
        String text = textStripper.getText(document);
        pageData.setPlainText(text);
    }

    /**
     * Extract text with positioning information
     */
    private void extractPositionedText(PDDocument document, int pageIndex, PageData pageData) throws IOException {
        // Store raw text positions for normalization
        List<PositionedText> rawTextPositions = new ArrayList<>();

        // Calculate actual content boundaries based on page dimensions and margins
        final float pageWidth = pageData.getWidth();
        final float pageHeight = pageData.getHeight();
        final float contentMinX = marginLeft;
        final float contentMinY = marginTop;
        final float contentMaxX = pageWidth - marginRight;
        final float contentMaxY = pageHeight - marginBottom;

        PDFTextStripper stripper = new PDFTextStripper() {
            @Override
            protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
                if (textPositions == null || textPositions.isEmpty())
                    return;

                TextPosition firstPos = textPositions.get(0);
                TextPosition lastPos = textPositions.get(textPositions.size() - 1);

                // Calculate the bounding box for this text
                float minX = firstPos.getX();
                float minY = firstPos.getY() - firstPos.getHeight();
                float maxX = lastPos.getX() + lastPos.getWidth();
                float maxY = firstPos.getY();

                // Skip text outside of defined content area if margins are set
                if (useMargins) {
                    // Center point of text
                    float centerX = (minX + maxX) / 2;
                    float centerY = (minY + maxY) / 2;

                    // Skip if center point is outside the defined content area
                    if (centerX < contentMinX || centerX > contentMaxX ||
                            centerY < contentMinY || centerY > contentMaxY) {
                        return;
                    }
                }

                // Create positioned text object
                PositionedText posText = new PositionedText();
                posText.setText(text);
                posText.setX(minX);
                posText.setY(minY);
                posText.setWidth(maxX - minX);
                posText.setHeight(maxY - minY);
                posText.setFontSize(firstPos.getFontSizeInPt());
                posText.setFontName(firstPos.getFont().getName());
                posText.setBaseline(firstPos.getY());

                rawTextPositions.add(posText);
            }
        };

        stripper.setStartPage(pageIndex);
        stripper.setEndPage(pageIndex);
        stripper.setSortByPosition(true);

        // This will trigger the writeString method for each text segment
        StringWriter writer = new StringWriter();
        stripper.writeText(document, writer);

        // Always store raw text positions for reference
        pageData.setRawPositionedText(new ArrayList<>(rawTextPositions));

        // Process text blocks based on normalization setting
        if (normalizeText) {
            // First sort all text by Y position
            Collections.sort(rawTextPositions, Comparator.comparing(PositionedText::getBaseline));

            // Group into paragraphs based on Y position and normalize font sizes
            List<PositionedText> paragraphTextList = groupIntoParagraphs(rawTextPositions);
            pageData.setPositionedText(paragraphTextList);
        } else {
            pageData.setPositionedText(new ArrayList<>(rawTextPositions));
        }
    }

    /**
     * Group text positions into paragraphs and normalize font sizes
     */
    private List<PositionedText> groupIntoParagraphs(List<PositionedText> rawText) {
        // This is a more advanced text grouping algorithm
        List<PositionedText> paragraphs = new ArrayList<>();
        if (rawText.isEmpty())
            return paragraphs;

        // Calculate the median line height to determine paragraph breaks
        List<Float> lineHeights = new ArrayList<>();
        for (int i = 1; i < rawText.size(); i++) {
            float height = Math.abs(rawText.get(i).getBaseline() - rawText.get(i - 1).getBaseline());
            if (height > 0.5) { // Ignore tiny differences
                lineHeights.add(height);
            }
        }

        // Sort heights to find median
        Collections.sort(lineHeights);
        float medianLineHeight = lineHeights.isEmpty() ? 12 : lineHeights.get(lineHeights.size() / 2);

        // Set a paragraph break threshold at 1.5 times the median line height
        float paragraphBreakThreshold = medianLineHeight * 1.5f;

        // Group text blocks into lines first based on Y position
        Map<Integer, List<PositionedText>> lineMap = new HashMap<>();
        int lineCount = 0;
        float currentBaseline = -1;

        // First pass: group text blocks into lines
        for (PositionedText text : rawText) {
            float baseline = text.getBaseline();

            // Check if we need to start a new line
            if (currentBaseline < 0 || Math.abs(baseline - currentBaseline) > 2.0) {
                lineCount++;
                currentBaseline = baseline;
            }

            // Add the text to the current line
            List<PositionedText> line = lineMap.computeIfAbsent(lineCount, k -> new ArrayList<>());
            line.add(text);
        }

        // Second pass: sort each line by X position and group lines into paragraphs
        List<List<PositionedText>> lines = new ArrayList<>();
        for (int i = 1; i <= lineCount; i++) {
            List<PositionedText> line = lineMap.get(i);
            if (line != null && !line.isEmpty()) {
                // Sort text blocks in the line by X position
                line.sort(Comparator.comparing(PositionedText::getX));
                lines.add(line);
            }
        }

        // Third pass: group lines into paragraphs
        List<List<PositionedText>> paragraphLines = new ArrayList<>();
        List<PositionedText> currentParagraphLines = new ArrayList<>();
        float previousLineBaseline = -1;

        for (List<PositionedText> line : lines) {
            if (line.isEmpty())
                continue;

            float currentLineBaseline = line.get(0).getBaseline();

            // Check if this line starts a new paragraph
            if (previousLineBaseline >= 0
                    && Math.abs(currentLineBaseline - previousLineBaseline) > paragraphBreakThreshold) {
                // Start a new paragraph
                if (!currentParagraphLines.isEmpty()) {
                    paragraphLines.add(new ArrayList<>(currentParagraphLines));
                    currentParagraphLines.clear();
                }
            }

            // Add all text from this line to the current paragraph
            currentParagraphLines.addAll(line);
            previousLineBaseline = currentLineBaseline;
        }

        // Add the last paragraph
        if (!currentParagraphLines.isEmpty()) {
            paragraphLines.add(currentParagraphLines);
        }

        // Fourth pass: create a single PositionedText object for each paragraph
        for (List<PositionedText> paragraphTextBlocks : paragraphLines) {
            if (paragraphTextBlocks.isEmpty())
                continue;

            // Calculate paragraph bounds and average font metrics
            float minX = Float.MAX_VALUE;
            float minY = Float.MAX_VALUE;
            float maxX = Float.MIN_VALUE;
            float maxY = Float.MIN_VALUE;
            float totalFontSize = 0;
            int blockCount = 0;
            Map<String, Integer> fontCount = new HashMap<>();

            // StringBuilder for collecting all text in the paragraph
            StringBuilder paragraphText = new StringBuilder();

            // Track previous position to detect if we need a space or newline
            float lastX = -1;
            float lastWidth = 0;
            float lastBaseline = -1;

            // Sort paragraph blocks by baseline and then X position
            paragraphTextBlocks.sort(Comparator.<PositionedText>comparingDouble(p -> p.getBaseline())
                    .thenComparingDouble(p -> p.getX()));

            for (PositionedText block : paragraphTextBlocks) {
                // Update paragraph bounds
                minX = Math.min(minX, block.getX());
                minY = Math.min(minY, block.getY());
                maxX = Math.max(maxX, block.getX() + block.getWidth());
                maxY = Math.max(maxY, block.getY() + block.getHeight());

                // Update font metrics
                totalFontSize += block.getFontSize();
                blockCount++;
                fontCount.put(block.getFontName(), fontCount.getOrDefault(block.getFontName(), 0) + 1);

                // Handle spacing between blocks
                if (lastX >= 0) {
                    if (Math.abs(block.getBaseline() - lastBaseline) > 2.0) {
                        // This is a new line
                        paragraphText.append("\n");
                    } else if (block.getX() > lastX + lastWidth + 2.0) {
                        // There's a significant gap, add a space
                        paragraphText.append(" ");
                    }
                }

                // Add the block's text
                paragraphText.append(block.getText());

                // Update tracking variables
                lastX = block.getX();
                lastWidth = block.getWidth();
                lastBaseline = block.getBaseline();
            }

            // Create the paragraph object
            PositionedText paragraph = new PositionedText();
            paragraph.setText(paragraphText.toString());
            paragraph.setX(minX);
            paragraph.setY(minY);
            paragraph.setWidth(maxX - minX);
            paragraph.setHeight(maxY - minY);
            paragraph.setBaseline(maxY);
            paragraph.setParagraph(true);

            // Set average font size
            if (blockCount > 0) {
                paragraph.setFontSize(totalFontSize / blockCount);
            }

            // Set most common font name
            String mostCommonFont = fontCount.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Unknown");
            paragraph.setFontName(mostCommonFont);

            paragraphs.add(paragraph);
        }

        return paragraphs;
    }

    /**
     * Extract text by dividing the page into regions
     */
    private void extractTextByRegions(PDPage page, PageData pageData) throws IOException {
        PDFTextStripperByArea stripper = new PDFTextStripperByArea();
        stripper.setSortByPosition(true);

        // Define regions based on margins if set
        PDRectangle cropBox = page.getCropBox();
        float width = cropBox.getWidth();
        float height = cropBox.getHeight();

        float effectiveLeft = useMargins ? marginLeft : 0;
        float effectiveTop = useMargins ? marginTop : 0;
        float effectiveRight = useMargins ? marginRight : 0;
        float effectiveBottom = useMargins ? marginBottom : 0;

        float contentWidth = width - effectiveLeft - effectiveRight;
        float contentHeight = height - effectiveTop - effectiveBottom;

        // Create a content region
        Rectangle2D contentRegion = new Rectangle2D.Float(effectiveLeft, effectiveTop, contentWidth, contentHeight);
        stripper.addRegion("content", contentRegion);

        // Define and add quadrant regions
        float midX = effectiveLeft + contentWidth / 2;
        float midY = effectiveTop + contentHeight / 2;

        Rectangle2D topLeft = new Rectangle2D.Float(effectiveLeft, effectiveTop,
                midX - effectiveLeft, midY - effectiveTop);
        Rectangle2D topRight = new Rectangle2D.Float(midX, effectiveTop,
                contentWidth / 2, midY - effectiveTop);
        Rectangle2D bottomLeft = new Rectangle2D.Float(effectiveLeft, midY,
                midX - effectiveLeft, contentHeight / 2);
        Rectangle2D bottomRight = new Rectangle2D.Float(midX, midY,
                contentWidth / 2, contentHeight / 2);

        stripper.addRegion("topLeft", topLeft);
        stripper.addRegion("topRight", topRight);
        stripper.addRegion("bottomLeft", bottomLeft);
        stripper.addRegion("bottomRight", bottomRight);

        // Extract text from the regions
        stripper.extractRegions(page);

        Map<String, String> regionText = new HashMap<>();
        regionText.put("content", stripper.getTextForRegion("content"));
        regionText.put("topLeft", stripper.getTextForRegion("topLeft"));
        regionText.put("topRight", stripper.getTextForRegion("topRight"));
        regionText.put("bottomLeft", stripper.getTextForRegion("bottomLeft"));
        regionText.put("bottomRight", stripper.getTextForRegion("bottomRight"));

        pageData.setRegionText(regionText);
    }

    /**
     * Class to hold detailed information about a PDF page
     */
    public static class PageData {
        private int pageNumber;
        private int totalPages;
        private float width;
        private float height;
        private float mediaBoxWidth;
        private float mediaBoxHeight;
        private int rotation;
        private String plainText;
        private Map<String, FontInfo> fonts = new HashMap<>();
        private List<ImageInfo> images = new ArrayList<>();
        private List<PositionedText> positionedText = new ArrayList<>();
        private List<PositionedText> rawPositionedText = new ArrayList<>();
        private Map<String, String> regionText = new HashMap<>();
        // Add margin information
        private boolean usingMargins = false;
        private float marginLeft = 0;
        private float marginTop = 0;
        private float marginRight = 0;
        private float marginBottom = 0;

        // Getters and setters
        public int getPageNumber() {
            return pageNumber;
        }

        public void setPageNumber(int pageNumber) {
            this.pageNumber = pageNumber;
        }

        public int getTotalPages() {
            return totalPages;
        }

        public void setTotalPages(int totalPages) {
            this.totalPages = totalPages;
        }

        public float getWidth() {
            return width;
        }

        public void setWidth(float width) {
            this.width = width;
        }

        public float getHeight() {
            return height;
        }

        public void setHeight(float height) {
            this.height = height;
        }

        public float getMediaBoxWidth() {
            return mediaBoxWidth;
        }

        public void setMediaBoxWidth(float mediaBoxWidth) {
            this.mediaBoxWidth = mediaBoxWidth;
        }

        public float getMediaBoxHeight() {
            return mediaBoxHeight;
        }

        public void setMediaBoxHeight(float mediaBoxHeight) {
            this.mediaBoxHeight = mediaBoxHeight;
        }

        public int getRotation() {
            return rotation;
        }

        public void setRotation(int rotation) {
            this.rotation = rotation;
        }

        public String getPlainText() {
            return plainText;
        }

        public void setPlainText(String plainText) {
            this.plainText = plainText;
        }

        public Map<String, FontInfo> getFonts() {
            return fonts;
        }

        public void setFonts(Map<String, FontInfo> fonts) {
            this.fonts = fonts;
        }

        public List<ImageInfo> getImages() {
            return images;
        }

        public void setImages(List<ImageInfo> images) {
            this.images = images;
        }

        public List<PositionedText> getPositionedText() {
            return positionedText;
        }

        public void setPositionedText(List<PositionedText> positionedText) {
            this.positionedText = positionedText;
        }

        public List<PositionedText> getRawPositionedText() {
            return rawPositionedText;
        }

        public void setRawPositionedText(List<PositionedText> rawPositionedText) {
            this.rawPositionedText = rawPositionedText;
        }

        public Map<String, String> getRegionText() {
            return regionText;
        }

        public void setRegionText(Map<String, String> regionText) {
            this.regionText = regionText;
        }

        // New getters and setters for margins
        public boolean isUsingMargins() {
            return usingMargins;
        }

        public void setUsingMargins(boolean usingMargins) {
            this.usingMargins = usingMargins;
        }

        public float getMarginLeft() {
            return marginLeft;
        }

        public float getMarginTop() {
            return marginTop;
        }

        public float getMarginRight() {
            return marginRight;
        }

        public float getMarginBottom() {
            return marginBottom;
        }

        public void setMargins(float left, float top, float right, float bottom) {
            this.marginLeft = left;
            this.marginTop = top;
            this.marginRight = right;
            this.marginBottom = bottom;
        }

        /**
         * Convert to JSON format
         */
        public String toJson() {
            StringBuilder sb = new StringBuilder();
            sb.append("{\n");
            sb.append("  \"pageNumber\": ").append(pageNumber).append(",\n");
            sb.append("  \"totalPages\": ").append(totalPages).append(",\n");
            sb.append("  \"dimensions\": {\n");
            sb.append("    \"width\": ").append(width).append(",\n");
            sb.append("    \"height\": ").append(height).append(",\n");
            sb.append("    \"mediaBoxWidth\": ").append(mediaBoxWidth).append(",\n");
            sb.append("    \"mediaBoxHeight\": ").append(mediaBoxHeight).append(",\n");
            sb.append("    \"rotation\": ").append(rotation).append("\n");
            sb.append("  },\n");

            // Add margin information if applicable
            if (usingMargins) {
                sb.append("  \"margins\": {\n");
                sb.append("    \"left\": ").append(marginLeft).append(",\n");
                sb.append("    \"top\": ").append(marginTop).append(",\n");
                sb.append("    \"right\": ").append(marginRight).append(",\n");
                sb.append("    \"bottom\": ").append(marginBottom).append("\n");
                sb.append("  },\n");
            }

            // Fonts
            sb.append("  \"fonts\": [\n");
            if (!fonts.isEmpty()) {
                int i = 0;
                for (FontInfo font : fonts.values()) {
                    sb.append(font.toJson(4));
                    if (++i < fonts.size()) {
                        sb.append(",");
                    }
                    sb.append("\n");
                }
            }
            sb.append("  ],\n");

            // Images
            sb.append("  \"images\": [\n");
            if (!images.isEmpty()) {
                for (int i = 0; i < images.size(); i++) {
                    sb.append(images.get(i).toJson(4));
                    if (i < images.size() - 1) {
                        sb.append(",");
                    }
                    sb.append("\n");
                }
            }
            sb.append("  ],\n");

            // Text content
            sb.append("  \"plainText\": ").append(jsonEscape(plainText)).append(",\n");

            // Positioned text (normalized/grouped into paragraphs)
            sb.append("  \"positionedText\": [\n");
            if (!positionedText.isEmpty()) {
                for (int i = 0; i < positionedText.size(); i++) {
                    sb.append(positionedText.get(i).toJson(4));
                    if (i < positionedText.size() - 1) {
                        sb.append(",");
                    }
                    sb.append("\n");
                }
            }
            sb.append("  ],\n");

            // Raw positioned text (for debugging)
            sb.append("  \"rawPositionedText\": [\n");
            if (!rawPositionedText.isEmpty()) {
                for (int i = 0; i < rawPositionedText.size(); i++) {
                    sb.append(rawPositionedText.get(i).toJson(4));
                    if (i < rawPositionedText.size() - 1) {
                        sb.append(",");
                    }
                    sb.append("\n");
                }
            }
            sb.append("  ],\n");

            // Region text
            sb.append("  \"regionText\": {\n");
            if (!regionText.isEmpty()) {
                int i = 0;
                for (Map.Entry<String, String> entry : regionText.entrySet()) {
                    sb.append("    ").append(jsonEscape(entry.getKey())).append(": ")
                            .append(jsonEscape(entry.getValue()));
                    if (++i < regionText.size()) {
                        sb.append(",");
                    }
                    sb.append("\n");
                }
            }
            sb.append("  }\n");

            sb.append("}");
            return sb.toString();
        }

        private String jsonEscape(String text) {
            if (text == null)
                return "null";

            StringBuilder sb = new StringBuilder("\"");
            for (char c : text.toCharArray()) {
                switch (c) {
                    case '"':
                        sb.append("\\\"");
                        break;
                    case '\\':
                        sb.append("\\\\");
                        break;
                    case '\b':
                        sb.append("\\b");
                        break;
                    case '\f':
                        sb.append("\\f");
                        break;
                    case '\n':
                        sb.append("\\n");
                        break;
                    case '\r':
                        sb.append("\\r");
                        break;
                    case '\t':
                        sb.append("\\t");
                        break;
                    default:
                        if (c < ' ') {
                            sb.append(String.format("\\u%04x", (int) c));
                        } else {
                            sb.append(c);
                        }
                }
            }
            return sb.append("\"").toString();
        }
    }

    /**
     * Class to hold font information
     */
    public static class FontInfo {
        private String name;
        private String id;
        private boolean embedded;

        // Getters and setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public boolean isEmbedded() {
            return embedded;
        }

        public void setEmbedded(boolean embedded) {
            this.embedded = embedded;
        }

        /**
         * Convert to JSON format
         */
        public String toJson(int indent) {
            String spaces = " ".repeat(indent);
            StringBuilder sb = new StringBuilder();
            sb.append(spaces).append("{\n");
            sb.append(spaces).append("  \"name\": \"").append(name).append("\",\n");
            sb.append(spaces).append("  \"id\": \"").append(id).append("\",\n");
            sb.append(spaces).append("  \"embedded\": ").append(embedded).append("\n");
            sb.append(spaces).append("}");
            return sb.toString();
        }
    }

    /**
     * Class to hold image information
     */
    public static class ImageInfo {
        private String name;
        private int width;
        private int height;
        private String colorSpace;
        private int bitsPerComponent;

        // Getters and setters
        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getWidth() {
            return width;
        }

        public void setWidth(int width) {
            this.width = width;
        }

        public int getHeight() {
            return height;
        }

        public void setHeight(int height) {
            this.height = height;
        }

        public String getColorSpace() {
            return colorSpace;
        }

        public void setColorSpace(String colorSpace) {
            this.colorSpace = colorSpace;
        }

        public int getBitsPerComponent() {
            return bitsPerComponent;
        }

        public void setBitsPerComponent(int bitsPerComponent) {
            this.bitsPerComponent = bitsPerComponent;
        }

        /**
         * Convert to JSON format
         */
        public String toJson(int indent) {
            String spaces = " ".repeat(indent);
            StringBuilder sb = new StringBuilder();
            sb.append(spaces).append("{\n");
            sb.append(spaces).append("  \"name\": \"").append(name).append("\",\n");
            sb.append(spaces).append("  \"width\": ").append(width).append(",\n");
            sb.append(spaces).append("  \"height\": ").append(height).append(",\n");
            sb.append(spaces).append("  \"colorSpace\": \"").append(colorSpace).append("\",\n");
            sb.append(spaces).append("  \"bitsPerComponent\": ").append(bitsPerComponent).append("\n");
            sb.append(spaces).append("}");
            return sb.toString();
        }
    }

    /**
     * Class to hold positioned text information
     */
    public static class PositionedText {
        private String text;
        private float x;
        private float y;
        private float width;
        private float height;
        private float fontSize;
        private String fontName;
        private float baseline;
        private boolean isParagraph = false;

        // Getters and setters
        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public float getX() {
            return x;
        }

        public void setX(float x) {
            this.x = x;
        }

        public float getY() {
            return y;
        }

        public void setY(float y) {
            this.y = y;
        }

        public float getWidth() {
            return width;
        }

        public void setWidth(float width) {
            this.width = width;
        }

        public float getHeight() {
            return height;
        }

        public void setHeight(float height) {
            this.height = height;
        }

        public float getFontSize() {
            return fontSize;
        }

        public void setFontSize(float fontSize) {
            this.fontSize = fontSize;
        }

        public String getFontName() {
            return fontName;
        }

        public void setFontName(String fontName) {
            this.fontName = fontName;
        }

        public float getBaseline() {
            return baseline;
        }

        public void setBaseline(float baseline) {
            this.baseline = baseline;
        }

        public boolean isParagraph() {
            return isParagraph;
        }

        public void setParagraph(boolean isParagraph) {
            this.isParagraph = isParagraph;
        }

        /**
         * Convert to JSON format
         */
        public String toJson(int indent) {
            String spaces = " ".repeat(indent);
            StringBuilder sb = new StringBuilder();
            sb.append(spaces).append("{\n");
            sb.append(spaces).append("  \"text\": \"").append(escapeJson(text)).append("\",\n");
            sb.append(spaces).append("  \"position\": {\n");
            sb.append(spaces).append("    \"x\": ").append(x).append(",\n");
            sb.append(spaces).append("    \"y\": ").append(y).append(",\n");
            sb.append(spaces).append("    \"width\": ").append(width).append(",\n");
            sb.append(spaces).append("    \"height\": ").append(height).append(",\n");
            sb.append(spaces).append("    \"baseline\": ").append(baseline).append("\n");
            sb.append(spaces).append("  },\n");
            sb.append(spaces).append("  \"fontSize\": ").append(fontSize).append(",\n");
            sb.append(spaces).append("  \"fontName\": \"").append(fontName).append("\"");

            if (isParagraph) {
                sb.append(",\n");
                sb.append(spaces).append("  \"isParagraph\": true");
            }

            sb.append("\n").append(spaces).append("}");
            return sb.toString();
        }

        private String escapeJson(String text) {
            if (text == null)
                return "";
            return text.replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
        }

        // Add a method to join with another text block (for merging/normalization)
        public void join(PositionedText other) {
            // Combine text content
            StringBuilder combined = new StringBuilder(this.text);

            // Add a space if needed
            if (!this.text.endsWith(" ") && !other.text.startsWith(" ")) {
                combined.append(" ");
            }

            combined.append(other.text);
            this.text = combined.toString();

            // Expand bounds
            float minX = Math.min(this.x, other.x);
            float minY = Math.min(this.y, other.y);
            float maxX = Math.max(this.x + this.width, other.x + other.width);
            float maxY = Math.max(this.y + this.height, other.y + other.height);

            this.x = minX;
            this.y = minY;
            this.width = maxX - minX;
            this.height = maxY - minY;

            // Update baseline to the latest one
            this.baseline = Math.max(this.baseline, other.baseline);

            // Average font size
            this.fontSize = (this.fontSize + other.fontSize) / 2;
        }
    }
}
