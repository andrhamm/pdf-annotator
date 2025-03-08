package com.tremorlab.pdfparser;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a section in the document (e.g., a chapter, subchapter)
 */
public class DocumentSection {
    private String title;
    private String content;
    private int level;
    private List<DocumentSection> subSections = new ArrayList<>();

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public List<DocumentSection> getSubSections() {
        return subSections;
    }

    public void setSubSections(List<DocumentSection> subSections) {
        this.subSections = subSections;
    }

    public void addSubSection(DocumentSection subSection) {
        this.subSections.add(subSection);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        String heading = "#".repeat(level) + " " + title;
        sb.append(heading).append("\n\n");

        if (content != null && !content.isEmpty()) {
            sb.append(content).append("\n\n");
        }

        for (DocumentSection subSection : subSections) {
            sb.append(subSection.toString());
        }

        return sb.toString();
    }

    /**
     * Convert the section to JSON format
     */
    public String toJson(int indent) {
        String spaces = " ".repeat(indent);
        StringBuilder sb = new StringBuilder();
        sb.append(spaces).append("{\n");

        String innerSpaces = spaces + "  ";
        sb.append(innerSpaces).append("\"title\": ").append(jsonEscape(title)).append(",\n");
        sb.append(innerSpaces).append("\"level\": ").append(level).append(",\n");

        if (content != null && !content.isEmpty()) {
            sb.append(innerSpaces).append("\"content\": ").append(jsonEscape(content)).append(",\n");
        }

        if (!subSections.isEmpty()) {
            sb.append(innerSpaces).append("\"subSections\": [\n");
            for (int i = 0; i < subSections.size(); i++) {
                sb.append(subSections.get(i).toJson(indent + 4));
                if (i < subSections.size() - 1) {
                    sb.append(",");
                }
                sb.append("\n");
            }
            sb.append(innerSpaces).append("]");
        } else {
            // Remove trailing comma if there are no subsections
            sb.setLength(sb.length() - 2);
        }

        sb.append("\n").append(spaces).append("}");
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
