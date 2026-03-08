import React from 'react';
import { Text, View } from 'react-native';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown parser for common formatting
  const parseMarkdown = (text: string): React.ReactNode[] => {
    // Split by lines to handle headers and lists
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      const lineKey = `line-${lineIndex}`;
      const trimmedLine = line.trim();
      
      // Empty line
      if (!trimmedLine) {
        return <View key={lineKey} className="h-2" />;
      }
      
      // Headers (###, ##, #)
      if (trimmedLine.startsWith('### ')) {
        return (
          <Text key={lineKey} className="text-sm font-semibold mt-2 mb-1 text-gray-900">
            {parseInlineMarkdown(trimmedLine.substring(4))}
          </Text>
        );
      }
      if (trimmedLine.startsWith('## ')) {
        return (
          <Text key={lineKey} className="text-base font-semibold mt-2 mb-1 text-gray-900">
            {parseInlineMarkdown(trimmedLine.substring(3))}
          </Text>
        );
      }
      if (trimmedLine.startsWith('# ')) {
        return (
          <Text key={lineKey} className="text-base font-bold mt-2 mb-1 text-gray-900">
            {parseInlineMarkdown(trimmedLine.substring(2))}
          </Text>
        );
      }
      
      // Numbered lists (1. 2. etc)
      const numberedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedListMatch && numberedListMatch[2]) {
        return (
          <View key={lineKey} className="flex-row items-start gap-2 my-1">
            <Text className="text-green-600 font-medium">{numberedListMatch[1]}.</Text>
            <Text className="text-sm flex-1">{parseInlineMarkdown(numberedListMatch[2])}</Text>
          </View>
        );
      }
      
      // Bullet lists (- or *)
      if (trimmedLine.match(/^[-*]\s+/)) {
        const listContent = trimmedLine.replace(/^[-*]\s+/, '');
        return (
          <View key={lineKey} className="flex-row items-start gap-2 my-1">
            <Text className="text-green-600">•</Text>
            <Text className="text-sm flex-1">{parseInlineMarkdown(listContent)}</Text>
          </View>
        );
      }
      
      // Regular paragraph
      return (
        <Text key={lineKey} className="text-sm my-1">
          {parseInlineMarkdown(trimmedLine)}
        </Text>
      );
    });
  };

  // Parse inline markdown (bold, italic, code)
  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    // Process in order: bold first (to avoid conflicts with italic), then code, then italic
    const processedIndices = new Set<number>();
    const matches: { index: number; length: number; component: React.ReactNode; endIndex: number }[] = [];

    // First, find all bold matches (**text**)
    const boldRegex = /\*\*(.+?)\*\*/g;
    let boldMatch;
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      const start = boldMatch.index;
      const end = start + boldMatch[0].length;
      for (let i = start; i < end; i++) {
        processedIndices.add(i);
      }
      matches.push({
        index: start,
        length: boldMatch[0].length,
        endIndex: end,
        component: <Text key={`bold-${key++}`} className="font-semibold">{boldMatch[1]}</Text>,
      });
    }

    // Then find code matches (`text`)
    const codeRegex = /`(.+?)`/g;
    let codeMatch;
    while ((codeMatch = codeRegex.exec(text)) !== null) {
      const start = codeMatch.index;
      const end = start + codeMatch[0].length;
      let overlaps = false;
      for (let i = start; i < end; i++) {
        if (processedIndices.has(i)) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        for (let i = start; i < end; i++) {
          processedIndices.add(i);
        }
        matches.push({
          index: start,
          length: codeMatch[0].length,
          endIndex: end,
          component: (
            <Text key={`code-${key++}`} className="bg-green-50 text-green-700 px-1 py-0.5 rounded text-xs">
              {codeMatch[1]}
            </Text>
          ),
        });
      }
    }

    // Finally, find italic matches (*text*) that don't overlap
    const italicRegex = /\*(.+?)\*/g;
    let italicMatch;
    while ((italicMatch = italicRegex.exec(text)) !== null) {
      const start = italicMatch.index;
      const end = start + italicMatch[0].length;
      let overlaps = false;
      for (let i = start; i < end; i++) {
        if (processedIndices.has(i)) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        for (let i = start; i < end; i++) {
          processedIndices.add(i);
        }
        matches.push({
          index: start,
          length: italicMatch[0].length,
          endIndex: end,
          component: <Text key={`italic-${key++}`} className="italic">{italicMatch[1]}</Text>,
        });
      }
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // Build parts
    let lastIndex = 0;
    matches.forEach((match) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add match component
      parts.push(match.component);
      lastIndex = match.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // If no matches, return text as-is
    if (parts.length === 0) {
      return [text];
    }

    return parts;
  };

  return (
    <View className="markdown-content">
      {parseMarkdown(content)}
    </View>
  );
}

