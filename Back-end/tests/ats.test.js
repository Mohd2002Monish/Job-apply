const test = require('node:test');
const assert = require('node:assert');
const { extractJson } = require('../utils/geminiService');

test.describe('Gemini Response JSON Parser Tests', () => {

  test('extractJson - should parse a clean JSON string successfully', () => {
    const rawText = '{"score": 85, "matchSummary": "Strong alignment"}';
    const parsed = extractJson(rawText);
    
    assert.strictEqual(typeof parsed, 'object');
    assert.strictEqual(parsed.score, 85);
    assert.strictEqual(parsed.matchSummary, 'Strong alignment');
  });

  test('extractJson - should extract JSON wrapped inside conversational prefixes/suffixes', () => {
    const rawText = 'Here is the response in JSON format:\n{\n  "score": 90,\n  "feedback": "Perfect"\n}\nHope this helps!';
    const parsed = extractJson(rawText);
    
    assert.strictEqual(parsed.score, 90);
    assert.strictEqual(parsed.feedback, 'Perfect');
  });

  test('extractJson - should clean and parse markdown-wrapped JSON code blocks', () => {
    const rawText = '```json\n{\n  "matchingKeywords": ["React", "Node.js"]\n}\n```';
    const parsed = extractJson(rawText);
    
    assert.deepStrictEqual(parsed.matchingKeywords, ['React', 'Node.js']);
  });

  test('extractJson - should strip out trailing commas in objects and arrays to prevent parsing errors', () => {
    // Trailing comma in object and array
    const rawText = '{\n  "score": 75,\n  "keywords": ["Docker", "K8s",],\n}';
    const parsed = extractJson(rawText);
    
    assert.strictEqual(parsed.score, 75);
    assert.deepStrictEqual(parsed.keywords, ['Docker', 'K8s']);
  });

  test('extractJson - should throw error if no JSON object is present', () => {
    const rawText = 'This is a plain text response without any curly brackets.';
    
    try {
      extractJson(rawText);
      assert.fail('Should have thrown an error for text containing no JSON blocks.');
    } catch (err) {
      assert.ok(err.message.includes('JSON') || err instanceof SyntaxError);
    }
  });
});
