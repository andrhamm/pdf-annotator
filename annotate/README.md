# PDF Annotation Tool

This React application allows you to annotate PDF documents by adding metadata to individual pages.

## Features

- Load PDF files from your local system
- Navigate through PDF pages with pagination controls
- View PDF pages with zoom functionality
- Add and save metadata for each page including:
  - Page type categorization
  - Tags
  - Margins
  - Content areas

## Technical Implementation

This application uses:

- `react-pdf` for viewing and navigating PDF files (not to be confused with `@react-pdf/renderer` which is for generating PDFs)
- `formik` and `yup` for form handling and validation
- Material UI for the user interface components
- PDF.js web workers for efficient PDF processing

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

## Integration with Java Backend

This frontend application can be integrated with the Java PDF parsing backend using the following approaches:

1. Make API calls to the backend to process PDFs using PDFBox
2. Use the SinglePageExtractor.java class to extract detailed page information
3. Save and retrieve metadata through a REST API

## Project Structure

```
annotate/
├── public/           # Public assets
├── src/
│   ├── components/   # React components
│   │   ├── FileUploader.js
│   │   ├── MetadataForm.js
│   │   ├── PDFViewer.js
│   │   └── FallbackPDFViewer.js
│   ├── utils/        # Utility functions
│   │   ├── pdfUtils.js
│   │   └── pdfBufferManager.js
│   ├── App.js        # Main application component
│   └── index.js      # Application entry point
└── package.json      # Project dependencies
```

## Troubleshooting

If you encounter "detached ArrayBuffer" errors when viewing certain PDFs:

1. Try using the fallback viewer which uses Object URLs instead of ArrayBuffers
2. Ensure you're using a compatible version of `react-pdf`
3. Check browser console for specific error details

## Future Enhancements

- Integration with the Java backend for PDFBox processing
- Ability to export/import annotations
- Drawing annotations directly on the PDF
- OCR capabilities for scanned documents
- Collaborative annotation features
