#!/bin/bash

# Define constants
JAR_DIR="/Users/andrewhammond/dev/pdfparse/target"
JAR_NAME="pdfparse.jar"
JAR_PATH="$JAR_DIR/$JAR_NAME"

# Check if the JAR file exists
if [ ! -f "$JAR_PATH" ]; then
    echo "Error: JAR file not found at $JAR_PATH"
    echo "Please build the project first using 'mvn package' or similar command"
    exit 1
fi

# Display usage if no arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <path-to-pdf-file> [options]"
    echo "Options:"
    echo "  -p, --pages <range>     Specify page range (e.g., 1-10 or 5)"
    echo "  -d, --detailed          Extract detailed information for a single page"
    echo "  -r, --raw               Disable text normalization for inconsistent font sizes"
    echo "  -m, --margins <values>  Set margins to filter content (left,top,right,bottom)"
    echo "  -h, --help              Print this help message"
    echo "Examples:"
    echo "  $0 /path/to/document.pdf"
    echo "  $0 /path/to/document.pdf -p 10-20"
    echo "  $0 /path/to/document.pdf -p 5 -d"
    echo "  $0 /path/to/document.pdf -p 5 -d -r"
    echo "  $0 /path/to/document.pdf -m 50,50,50,50"
    exit 1
fi

# Execute the Java application with all arguments
echo "Running PDF parser on file: $1"
java -jar "$JAR_PATH" "$@"

exit 0
