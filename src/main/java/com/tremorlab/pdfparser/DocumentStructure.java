package com.tremorlab.pdfparser;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Represents the hierarchical structure of a document
 */
public class DocumentStructure {
    private String title;
    private String content;
    private List<DocumentSection> sections = new ArrayList<>();
    private Map<String, String> metadata = new HashMap<>();

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

    public List<DocumentSection> getSections() {
        return sections;
    }

    public void setSections(List<DocumentSection> sections) {
        this.sections = sections;
    }

    public void addSection(DocumentSection section) {
        if (section.getLevel() == 1) {
            // Top-level section
            sections.add(section);
        } else {
            // Find parent section
            DocumentSection parent = findParentSection(section);
            if (parent != null) {
                parent.addSubSection(section);
            } else {
                // If no parent found, add as top-level
                sections.add(section);
            }
        }
    }

    private DocumentSection findParentSection(DocumentSection section) {
        int targetLevel = section.getLevel() - 1;

        // Search backwards through sections to find the closest parent
        for (int i = sections.size() - 1; i >= 0; i--) {
            DocumentSection potential = sections.get(i);
            DocumentSection parent = findParentRecursive(potential, targetLevel, section);
            if (parent != null) {
                return parent;
            }
        }

        return null;
    }

    private DocumentSection findParentRecursive(DocumentSection current, int targetLevel, DocumentSection child) {
        if (current.getLevel() == targetLevel) {
            return current;
        }

        if (current.getSubSections().isEmpty()) {
            return null;
        }

        for (int i = current.getSubSections().size() - 1; i >= 0; i--) {
            DocumentSection potential = current.getSubSections().get(i);
            DocumentSection result = findParentRecursive(potential, targetLevel, child);
            if (result != null) {
                return result;
            }
        }

        return null;
    }

    /**
     * Add metadata to the document structure
     */
    public void addMetadata(String key, String value) {
        metadata.put(key, value);
    }

    /**
     * Get metadata by key
     */
    public String getMetadata(String key) {
        return metadata.get(key);
    }

    /**
     * Get all metadata
     */
    public Map<String, String> getAllMetadata() {
        return new HashMap<>(metadata);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        if (title != null && !title.isEmpty()) {
            sb.append("# ").append(title).append("\n\n");
        }

        if (content != null && !content.isEmpty()) {
            sb.append(content).append("\n\n");
        }

        for (DocumentSection section : sections) {
            sb.append(section.toString());
        }

        return sb.toString();
    }

    /**
     * Convert the document structure to JSON format
     */
    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");

        if (title != null && !title.isEmpty()) {
            sb.append("  \"title\": ").append(jsonEscape(title)).append(",\n");
        }

        if (!metadata.isEmpty()) {
            sb.append("  \"metadata\": {\n");
            int count = 0;
            for (Map.Entry<String, String> entry : metadata.entrySet()) {
                sb.append("    ").append(jsonEscape(entry.getKey())).append(": ")
                        .append(jsonEscape(entry.getValue()));
                if (++count < metadata.size()) {
                    sb.append(",");
                }
                sb.append("\n");
            }
            sb.append("  },\n");
        }

        if (content != null && !content.isEmpty()) {
            sb.append("  \"content\": ").append(jsonEscape(content)).append(",\n");
        }

        if (!sections.isEmpty()) {
            sb.append("  \"sections\": [\n");
            for (int i = 0; i < sections.size(); i++) {
                sb.append(sections.get(i).toJson(4));
                if (i < sections.size() - 1) {
                    sb.append(",");
                }
                sb.append("\n");
            }
            sb.append("  ]\n");
        } else {
            // Remove trailing comma if there are no sections
            sb.setLength(sb.length() - 2);
            sb.append("\n");
        }

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
