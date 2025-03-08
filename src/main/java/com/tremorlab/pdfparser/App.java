package com.tremorlab.pdfparser;

import java.io.File;

public class App {
    public static void main(String[] args) {
        if (args.length < 1) {
            printUsage();
            return;
        }

        String pdfFilePath = args[0];
        File pdfFile = new File(pdfFilePath);

        // Use an array to hold page ranges so they can be modified in lambda
        int[] pageRange = { -1, -1 }; // [startPage, endPage]
        boolean detailedSinglePage = false;
        boolean normalizeText = true;
        float[] margins = { -1, -1, -1, -1 }; // Left, Top, Right, Bottom

        // Parse optional arguments
        for (int i = 1; i < args.length; i++) {
            if ("-p".equals(args[i]) || "--pages".equals(args[i])) {
                if (i + 1 < args.length) {
                    String pageRangeStr = args[++i];
                    try {
                        parsePageRange(pageRangeStr, pageRange);
                    } catch (NumberFormatException e) {
                        System.err.println("Invalid page range format: " + pageRangeStr);
                        System.err.println("Expected format: startPage-endPage (e.g., 1-10) or singlePage (e.g., 5)");
                    }
                }
            } else if ("-d".equals(args[i]) || "--detailed".equals(args[i])) {
                detailedSinglePage = true;
            } else if ("-r".equals(args[i]) || "--raw".equals(args[i])) {
                normalizeText = false;
            } else if ("-m".equals(args[i]) || "--margins".equals(args[i])) {
                if (i + 1 < args.length) {
                    String marginStr = args[++i];
                    try {
                        parseMargins(marginStr, margins);
                    } catch (NumberFormatException e) {
                        System.err.println("Invalid margin format: " + marginStr);
                        System.err.println("Expected format: left,top,right,bottom (e.g., 50,50,50,50)");
                    }
                }
            } else if ("-h".equals(args[i]) || "--help".equals(args[i])) {
                printUsage();
                return;
            }
        }

        try {
            // Check if we should extract detailed information for a single page
            if (detailedSinglePage) {
                // If page range wasn't specified but detailed was requested,
                // default to page 1
                int pageNumber = (pageRange[0] > 0) ? pageRange[0] : 1;
                System.out.println("Extracting detailed information for page " + pageNumber + "...");
                System.out.println("Text normalization: " + (normalizeText ? "enabled" : "disabled"));

                if (margins[0] >= 0) {
                    System.out.println("Using margins: left=" + margins[0] + ", top=" + margins[1] +
                            ", right=" + margins[2] + ", bottom=" + margins[3]);
                }

                SinglePageExtractor pageExtractor = new SinglePageExtractor();
                pageExtractor.setNormalizeText(normalizeText);

                // Apply margins if specified
                if (margins[0] >= 0) {
                    pageExtractor.setMargins(margins[0], margins[1], margins[2], margins[3]);
                }

                SinglePageExtractor.PageData pageData = pageExtractor.extractPage(pdfFile, pageNumber);

                System.out.println("Extracted Page Data:");
                System.out.println(pageData.toJson());
                return;
            }

            // Otherwise do regular hierarchical extraction
            System.out.println("Extracting hierarchical structure from PDF...");

            if (pageRange[0] > 0 && pageRange[1] > 0) {
                System.out.println("Processing page range: " + pageRange[0] + " to " + pageRange[1]);
            } else {
                System.out.println("Processing all pages");
            }

            if (margins[0] >= 0) {
                System.out.println("Using margins: left=" + margins[0] + ", top=" + margins[1] +
                        ", right=" + margins[2] + ", bottom=" + margins[3]);
            }

            HierarchicalPdfExtractor hierarchicalExtractor = new HierarchicalPdfExtractor();

            // Set page range if specified
            if (pageRange[0] > 0 && pageRange[1] > 0) {
                hierarchicalExtractor.setPageRange(pageRange[0], pageRange[1]);
            }

            // Set margins if specified
            if (margins[0] >= 0) {
                hierarchicalExtractor.setMargins(margins[0], margins[1], margins[2], margins[3]);
            }

            DocumentStructure structure = hierarchicalExtractor.extractHierarchy(pdfFile);

            System.out.println("Extracted Document Structure:");
            System.out.println(structure.toJson());
        } catch (Exception e) {
            System.err.println("Error processing PDF: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void printUsage() {
        System.out.println("Usage: java -jar pdfparse.jar <path-to-pdf> [options]");
        System.out.println("Options:");
        System.out.println("  -p, --pages <range>     Specify page range (e.g., 1-10 or 5)");
        System.out.println("  -d, --detailed          Extract detailed information for a single page");
        System.out.println("  -r, --raw               Disable text normalization for inconsistent font sizes");
        System.out.println("  -m, --margins <values>  Set margins to filter content (left,top,right,bottom)");
        System.out.println("  -h, --help              Print this help message");
        System.out.println("Examples:");
        System.out.println("  java -jar pdfparse.jar document.pdf");
        System.out.println("  java -jar pdfparse.jar document.pdf -p 10-20");
        System.out.println("  java -jar pdfparse.jar document.pdf -p 5 -d");
        System.out.println("  java -jar pdfparse.jar document.pdf -p 5 -d -r");
        System.out.println("  java -jar pdfparse.jar document.pdf -m 50,50,50,50");
    }

    private static void parsePageRange(String range, int[] result) throws NumberFormatException {
        if (range.contains("-")) {
            String[] parts = range.split("-");
            result[0] = Integer.parseInt(parts[0].trim());
            result[1] = Integer.parseInt(parts[1].trim());
        } else {
            result[0] = Integer.parseInt(range.trim());
            result[1] = result[0]; // Single page means start=end
        }
    }

    private static void parseMargins(String marginString, float[] margins) throws NumberFormatException {
        String[] parts = marginString.split(",");
        if (parts.length != 4) {
            throw new NumberFormatException("Margins must be specified as four values: left,top,right,bottom");
        }

        for (int i = 0; i < 4; i++) {
            margins[i] = Float.parseFloat(parts[i].trim());
            if (margins[i] < 0) {
                throw new NumberFormatException("Margin values cannot be negative");
            }
        }
    }
}