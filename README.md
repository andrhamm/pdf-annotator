# PDF Annotator

This project provides a React single page web application backed by a Java script. The application is used locally to review PDF documents, annotating each page to produce a metadata file describing the structure of the content. The metadata file can then be used to consistently and deterministically extract the content of the PDF document in a rich well-formed JSON structure.

The purpose of this tool is to enable the development of open source software that requires the parsing of trademarked or copyrighted PDF documents. Since the software does not have license to bundle the documents, it is necessary for the user to supply authentic copies of the documents for which they have paid for a personal license. The software must then have a reliable way of parsing the documents to extract the necessary content at runtime.

## Features

* Runs locally
* Load a PDF for reviewing and annotating. Progress is saved to local storage in realtime. Saves are based on the unique file name and page count of the document, so you can switch to editing different files as needed.
* Specify content margins on a per-page basis. Supports customizable presets or draggable controls.
* Specify content areas using Draw Mode controls. Classify each content area with various properties used to enrich the resulting JSON data structure.
* Extraction script, written in Java, uses Apache PDFBox to extract content from the PDF documents. With the metadata from the annotation tool, the script is able to focus the extraction on specific areas of the PDF

## Development

This project is a personal project of mine and I'm using it as an opportunity to evaluate AI assisted development tools and processes. I am not writing any of the code myself. I am primarily using Github Copilot to build the application, and only making code changes manually when it will save a prompt or when the AI has got itself in trouble. Because of this, the code quality can be quite poor. I'm OK with it!

## Installation

To run the Java-based extraction script you should have a modern JDK installed and also Maven to build it. I use OpenJDK installed with Homebrew:

```bash
brew install openjdk@17 maven
```

To build the extraction script:

```bash
mvn clean package
```

To manually run the extraction script:

```bash
./run-parser.sh ~/Documents/my-document.pdf -p 1 -d
```

To run the web application:

```bash
cd annotate/
npm install
npm run start
```

This should launch your web browser pointed to `http://localhost:3000/`

---

### TODO

* Save annotations on a page-by-page basis, track overall progress, provide a checklist of tasks for completion
* Call the "backend" parse script and show a preview of the extracted data. This will allow fine-tuning the content areas for deterministic extraction output.
* Export the annotation metadata as a file
