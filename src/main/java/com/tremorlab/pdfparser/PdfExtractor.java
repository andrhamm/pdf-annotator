package com.tremorlab.pdfparser;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;
import java.io.IOException;

public class PdfExtractor {

    public String extractText(File pdfFile) throws IOException {
        String extractedText = "";
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            extractedText = pdfStripper.getText(document);
        }
        return extractedText;
    }
}