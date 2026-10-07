import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Clipboard, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  editable?: boolean;
  showLineNumbers?: boolean;
  onRun?: () => void;
  onCopy?: () => void;
}

// Syntax highlighting keywords for different languages
const SYNTAX_HIGHLIGHTING: Record<string, Record<string, string>> = {
  javascript: {
    keywords: 'const let var function return if else for while do switch case break continue try catch finally throw new delete typeof instanceof void this',
    builtins: 'Array Object String Number Boolean Math Date RegExp JSON Promise async await',
    literals: 'true false null undefined NaN Infinity',
    operators: '+ - * / % == === != !== > < >= <= && || ! & | ^ ~ << >> >>> += -= *= /= %= == = ++ -- typeof instanceof new delete void',
  },
  typescript: {
    keywords: 'const let var function return if else for while do switch case break continue try catch finally throw new delete typeof instanceof void this interface type enum namespace module export import',
    builtins: 'Array Object String Number Boolean Math Date RegExp JSON Promise async await any unknown never void',
    literals: 'true false null undefined NaN Infinity',
    operators: '+ - * / % == === != !== > < >= <= && || ! & | ^ ~ << >> >>> += -= *= /= %= == = ++ -- typeof instanceof new delete void as in',
  },
  python: {
    keywords: 'def class return if elif else for while break continue try except finally raise pass import from as lambda with',
    builtins: 'print len type str int float bool list dict tuple set frozenset None True False and or not in is',
    literals: 'None True False',
    operators: '+ - * / % ** // == != > < >= <= and or not in is & | ^ ~ << >>',
  },
  java: {
    keywords: 'public private protected static final abstract class interface enum extends implements new return if else switch case default while do for break continue try catch finally throw throws import package',
    builtins: 'String Integer Double Boolean Long Float Character Byte Short Void Object System Math Arrays Collections',
    literals: 'true false null',
    operators: '+ - * / % == != > < >= <= && || ! & | ^ ~ << >> >>> += -= *= /= %= == = ++ -- instanceof new',
  },
  html: {
    keywords: 'div span p a img input button form label select option textarea ul ol li header footer nav section article aside main',
    builtins: 'class id style src href alt type value placeholder name action method enctype',
    literals: '',
    operators: '',
  },
  css: {
    keywords: 'color background border margin padding font display position flex grid justify align items content',
    builtins: 'px em rem % vh vw pt pc in cm mm',
    literals: 'auto none inherit initial unset',
    operators: '',
  },
  sql: {
    keywords: 'SELECT FROM WHERE GROUP BY ORDER BY HAVING JOIN INNER OUTER LEFT RIGHT FULL ON USING INSERT INTO UPDATE SET DELETE AS CREATE TABLE DROP ALTER INDEX PRIMARY FOREIGN KEY UNIQUE NOT NULL DEFAULT',
    builtins: 'COUNT SUM AVG MIN MAX',
    literals: 'NULL TRUE FALSE',
    operators: '= != < > <= >= LIKE IN BETWEEN AND OR NOT',
  },
};

// Color scheme for syntax highlighting
const COLORS = {
  keyword: '#ff79c6',
  builtin: '#50fa7b',
  literal: '#bd93f9',
  operator: '#ffb86c',
  string: '#f1fa8c',
  number: '#bd93f9',
  comment: '#6272a4',
  function: '#50fa7b',
  variable: '#ffb86c',
  type: '#8be9fd',
  punctuation: '#ffb86c',
  default: '#f8f8f2',
  background: '#282a36',
  lineNumber: '#6272a4',
  selection: '#44475a',
};

// Tokenize code for syntax highlighting
function tokenizeCode(code: string, language: string = 'javascript'): { text: string; color: string }[] {
  const lang = SYNTAX_HIGHLIGHTING[language.toLowerCase()] || SYNTAX_HIGHLIGHTING.javascript;
  const lines = code.split('\n');
  const tokens: { text: string; color: string }[] = [];

  for (const line of lines) {
    let remaining = line;
    
    // Skip empty lines
    if (!remaining.trim()) {
      tokens.push({ text: line + '\n', color: COLORS.default });
      continue;
    }

    // Process line
    let pos = 0;
    
    while (pos < remaining.length) {
      // Check for comments
      if (language === 'javascript' || language === 'typescript' || language === 'java') {
        if (remaining.substring(pos, pos + 2) === '//') {
          tokens.push({ text: remaining.substring(pos), color: COLORS.comment });
          pos = remaining.length;
          continue;
        }
        if (remaining.substring(pos, pos + 2) === '/*') {
          const endIdx = remaining.indexOf('*/', pos);
          if (endIdx !== -1) {
            tokens.push({ text: remaining.substring(pos, endIdx + 2), color: COLORS.comment });
            pos = endIdx + 2;
            continue;
          }
        }
      }
      
      if (language === 'python') {
        if (remaining.substring(pos) === '#') {
          tokens.push({ text: remaining.substring(pos), color: COLORS.comment });
          pos = remaining.length;
          continue;
        }
        if (remaining.substring(pos, pos + 3) === '"""' || remaining.substring(pos, pos + 3) === "'''") {
          const endIdx = remaining.indexOf(remaining.substring(pos, pos + 3), pos + 3);
          if (endIdx !== -1) {
            tokens.push({ text: remaining.substring(pos, endIdx + 3), color: COLORS.string });
            pos = endIdx + 3;
            continue;
          }
        }
      }

      // Check for strings
      if (remaining[pos] === '"' || remaining[pos] === "'") {
        const quote = remaining[pos];
        const endIdx = remaining.indexOf(quote, pos + 1);
        if (endIdx !== -1) {
          tokens.push({ text: remaining.substring(pos, endIdx + 1), color: COLORS.string });
          pos = endIdx + 1;
          continue;
        }
      }

      // Check for numbers
      if (/\d/.test(remaining[pos])) {
        const match = remaining.substring(pos).match(/^\d+(\.\d+)?([eE][+-]?\d+)?/);
        if (match) {
          tokens.push({ text: match[0], color: COLORS.number });
          pos += match[0].length;
          continue;
        }
      }

      // Check for keywords
      const keywordMatch = lang.keywords.split(' ').find(kw => 
        remaining.substring(pos).startsWith(kw + ' ') ||
        remaining.substring(pos).startsWith(kw + '\n') ||
        remaining.substring(pos).startsWith(kw + '(') ||
        remaining.substring(pos).startsWith(kw + ')') ||
        remaining.substring(pos).startsWith(kw + ';') ||
        remaining.substring(pos).startsWith(kw + ',') ||
        remaining.substring(pos).startsWith(kw + '.') ||
        remaining === kw
      );
      
      if (keywordMatch) {
        tokens.push({ text: keywordMatch, color: COLORS.keyword });
        pos += keywordMatch.length;
        continue;
      }

      // Check for builtins
      const builtinMatch = lang.builtins.split(' ').find(builtin => 
        remaining.substring(pos).startsWith(builtin + ' ') ||
        remaining.substring(pos).startsWith(builtin + '\n') ||
        remaining.substring(pos).startsWith(builtin + '(') ||
        remaining.substring(pos).startsWith(builtin + '.') ||
        remaining === builtin
      );
      
      if (builtinMatch) {
        tokens.push({ text: builtinMatch, color: COLORS.builtin });
        pos += builtinMatch.length;
        continue;
      }

      // Check for literals
      const literalMatch = lang.literals.split(' ').find(lit => 
        remaining.substring(pos).startsWith(lit + ' ') ||
        remaining.substring(pos).startsWith(lit + '\n') ||
        remaining.substring(pos).startsWith(lit + ';') ||
        remaining.substring(pos).startsWith(lit + ',') ||
        remaining === lit
      );
      
      if (literalMatch) {
        tokens.push({ text: literalMatch, color: COLORS.literal });
        pos += literalMatch.length;
        continue;
      }

      // Check for operators
      const operatorMatch = lang.operators.split(' ').find(op => 
        remaining.substring(pos).startsWith(op)
      );
      
      if (operatorMatch) {
        tokens.push({ text: operatorMatch, color: COLORS.operator });
        pos += operatorMatch.length;
        continue;
      }

      // Default: add character as is
      tokens.push({ text: remaining[pos], color: COLORS.default });
      pos++;
    }

    tokens.push({ text: '\n', color: COLORS.default });
  }

  return tokens;
}

// Colored text component
const ColoredText = ({ text, color }: { text: string; color: string }) => (
  <Text style={[styles.codeText, { color }]}>{text}</Text>
);

export function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  editable = true,
  showLineNumbers = true,
  onRun,
  onCopy,
}: CodeEditorProps) {
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [copied, setCopied] = useState(false);

  // Tokenize the code
  const tokens = tokenizeCode(value, language);

  // Handle copy
  const handleCopy = useCallback(() => {
    Clipboard.setString(value);
    setCopied(true);
    if (onCopy) onCopy();
    setTimeout(() => setCopied(false), 2000);
  }, [value, onCopy]);

  // Render line with syntax highlighting
  const renderLine = (lineText: string, lineNumber: number) => {
    // For simplicity, we'll render the whole line with default color
    // In a more sophisticated implementation, we'd tokenize per line
    return (
      <View style={styles.line} key={lineNumber}>
        {showLineNumbers && (
          <Text style={styles.lineNumber}>{lineNumber + 1}</Text>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text style={[styles.codeText, { color: COLORS.default }]}>
            {lineText}
          </Text>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.languageBadge}>
          <Text style={styles.languageText}>{language}</Text>
        </View>
        <View style={styles.headerActions}>
          {onRun && (
            <TouchableOpacity style={styles.headerButton} onPress={onRun}>
              <MaterialCommunityIcons name="play" size={18} color="#00ff88" />
              <Text style={styles.headerButtonText}>Run</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={handleCopy}>
            <MaterialIcons name={copied ? 'check' : 'content-copy'} size={18} color={copied ? '#00ff88' : '#888'} />
            <Text style={styles.headerButtonText}>{copied ? 'Copied!' : 'Copy'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Code area */}
      <ScrollView
        style={styles.codeContainer}
        contentContainerStyle={styles.codeContent}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {editable ? (
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={onChange}
            multiline
            spellCheck={false}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="default"
            textAlignVertical="top"
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.readonlyCode}>
            {value.split('\n').map((line, index) => renderLine(line, index))}
          </View>
        )}
      </ScrollView>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {value.split('\n').length} lines, {value.length} characters
        </Text>
      </View>
    </View>
  );
}

export default CodeEditor;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#282a36',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  languageBadge: {
    backgroundColor: '#00ff8822',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  languageText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  headerButtonText: {
    color: '#888',
    fontSize: 12,
  },
  codeContainer: {
    flex: 1,
    minHeight: 200,
  },
  codeContent: {
    padding: 12,
  },
  textInput: {
    flex: 1,
    color: '#f8f8f2',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  readonlyCode: {
    flex: 1,
  },
  line: {
    flexDirection: 'row',
    minHeight: 20,
  },
  lineNumber: {
    color: COLORS.lineNumber,
    fontSize: 12,
    width: 40,
    textAlign: 'right',
    marginRight: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  statusBar: {
    backgroundColor: '#282a36',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statusText: {
    color: '#6272a4',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
