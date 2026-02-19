import { describe, it, expect } from 'vitest'
import {
  inferLanguage,
  fixBareCodeBlocks,
  extractTitleFromHeading,
  addFrontmatterTitle,
  hasFrontmatterTitle,
} from '../../scripts/fix-doc-quality.js'

// ---------------------------------------------------------------------------
// inferLanguage
// ---------------------------------------------------------------------------
describe('inferLanguage', () => {
  it('detects JSON from curly-brace structure', () => {
    expect(inferLanguage('{\n  "key": "value"\n}')).toBe('json')
  })

  it('detects JSON from array structure', () => {
    expect(inferLanguage('[{"id": 1}, {"id": 2}]')).toBe('json')
  })

  it('detects bash from $ prefix', () => {
    expect(inferLanguage('$ npm install')).toBe('bash')
  })

  it('detects bash from $ prefix with leading whitespace', () => {
    expect(inferLanguage('  $ curl -X GET http://example.com')).toBe('bash')
  })

  it('detects sql from SELECT statement', () => {
    expect(inferLanguage('SELECT * FROM entities')).toBe('sql')
  })

  it('detects sql from INSERT statement', () => {
    expect(inferLanguage('INSERT INTO entities (id) VALUES (1)')).toBe('sql')
  })

  it('detects sql from CREATE TABLE statement', () => {
    expect(inferLanguage('CREATE TABLE test (id INT)')).toBe('sql')
  })

  it('detects http from GET request', () => {
    expect(inferLanguage('GET /api/v1/entities HTTP/1.1')).toBe('http')
  })

  it('detects http from POST request', () => {
    expect(inferLanguage('POST /api/v1/entities HTTP/1.1')).toBe('http')
  })

  it('detects http from PUT request', () => {
    expect(inferLanguage('PUT /api/v1/entities/1 HTTP/1.1')).toBe('http')
  })

  it('detects http from DELETE request', () => {
    expect(inferLanguage('DELETE /api/v1/entities/1 HTTP/1.1')).toBe('http')
  })

  it('falls back to text for unrecognized content', () => {
    expect(inferLanguage('some random content here')).toBe('text')
  })

  it('falls back to text for empty string', () => {
    expect(inferLanguage('')).toBe('text')
  })
})

// ---------------------------------------------------------------------------
// fixBareCodeBlocks
// ---------------------------------------------------------------------------
describe('fixBareCodeBlocks', () => {
  it('adds language from en counterpart at same position', () => {
    const ja = '# Title\n\n```\n{"key": "value"}\n```\n'
    const en = '# Title\n\n```json\n{"key": "value"}\n```\n'
    const result = fixBareCodeBlocks(ja, en)
    // Opening fence should now have language identifier
    expect(result).toContain('```json\n{"key": "value"}')
    // Content should differ from input (was modified)
    expect(result).not.toBe(ja)
  })

  it('infers language from content when en has no language either', () => {
    const ja = '# Title\n\n```\n$ npm install\n```\n'
    const en = '# Title\n\n```\n$ npm install\n```\n'
    const result = fixBareCodeBlocks(ja, en)
    // Opening fence should now have inferred language identifier
    expect(result).toContain('```bash\n$ npm install')
    expect(result).not.toBe(ja)
  })

  it('infers language from content when en is null', () => {
    const ja = '# Title\n\n```\n SELECT * FROM t\n```\n'
    const result = fixBareCodeBlocks(ja, null)
    expect(result).toContain('```sql')
  })

  it('does not modify code blocks that already have language', () => {
    const ja = '# Title\n\n```javascript\nconsole.log("hi")\n```\n'
    const en = '# Title\n\n```javascript\nconsole.log("hi")\n```\n'
    const result = fixBareCodeBlocks(ja, en)
    expect(result).toBe(ja)
  })

  it('handles multiple code blocks, some bare some not', () => {
    const ja = [
      '# Title',
      '',
      '```json',
      '{"a": 1}',
      '```',
      '',
      '```',
      '$ curl example.com',
      '```',
    ].join('\n')
    const en = [
      '# Title',
      '',
      '```json',
      '{"a": 1}',
      '```',
      '',
      '```bash',
      '$ curl example.com',
      '```',
    ].join('\n')
    const result = fixBareCodeBlocks(ja, en)
    // First block already had language — should be preserved
    expect(result).toContain('```json\n{"a": 1}')
    // Second block was bare — should be fixed with en's language
    expect(result).toContain('```bash\n$ curl example.com')
  })

  it('uses position-matched en language over content inference', () => {
    // Content looks like JSON but en says yaml
    const ja = '# Title\n\n```\nkey: value\n```\n'
    const en = '# Title\n\n```yaml\nkey: value\n```\n'
    const result = fixBareCodeBlocks(ja, en)
    expect(result).toContain('```yaml')
  })

  it('returns original content unchanged when no bare code blocks', () => {
    const ja = '# Title\n\nSome text without code blocks.\n'
    const result = fixBareCodeBlocks(ja, null)
    expect(result).toBe(ja)
  })
})

// ---------------------------------------------------------------------------
// extractTitleFromHeading
// ---------------------------------------------------------------------------
describe('extractTitleFromHeading', () => {
  it('extracts title from first H1 heading', () => {
    expect(extractTitleFromHeading('# My Title\n\nSome content')).toBe('My Title')
  })

  it('extracts title after frontmatter', () => {
    const content = '---\ndescription: foo\n---\n\n# My Title\n\nContent'
    expect(extractTitleFromHeading(content)).toBe('My Title')
  })

  it('returns null when no H1 heading exists', () => {
    expect(extractTitleFromHeading('## Subtitle\n\nContent')).toBeNull()
  })

  it('returns null for empty content', () => {
    expect(extractTitleFromHeading('')).toBeNull()
  })

  it('trims whitespace from title', () => {
    expect(extractTitleFromHeading('#   Spaced Title  \n')).toBe('Spaced Title')
  })
})

// ---------------------------------------------------------------------------
// hasFrontmatterTitle
// ---------------------------------------------------------------------------
describe('hasFrontmatterTitle', () => {
  it('returns true when title exists in frontmatter', () => {
    expect(hasFrontmatterTitle('---\ntitle: My Title\n---\n# Heading')).toBe(true)
  })

  it('returns false when title missing from frontmatter', () => {
    expect(hasFrontmatterTitle('---\ndescription: foo\n---\n# Heading')).toBe(false)
  })

  it('returns false when no frontmatter exists', () => {
    expect(hasFrontmatterTitle('# Heading\n\nContent')).toBe(false)
  })

  it('returns true for layout: home pages (no title needed)', () => {
    expect(hasFrontmatterTitle('---\nlayout: home\nhero:\n  name: Test\n---')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// addFrontmatterTitle
// ---------------------------------------------------------------------------
describe('addFrontmatterTitle', () => {
  it('adds title to existing frontmatter', () => {
    const content = '---\ndescription: foo\n---\n\n# Heading\n'
    const result = addFrontmatterTitle(content, 'My Title')
    expect(result).toContain('title: "My Title"')
    expect(result).toContain('description: foo')
  })

  it('creates frontmatter with title when none exists', () => {
    const content = '# Heading\n\nContent'
    const result = addFrontmatterTitle(content, 'My Title')
    expect(result).toMatch(/^---\ntitle: "My Title"\n---/)
    expect(result).toContain('# Heading')
  })

  it('preserves other frontmatter fields', () => {
    const content = '---\ndescription: bar\noutline: deep\n---\n# H'
    const result = addFrontmatterTitle(content, 'Test')
    expect(result).toContain('description: bar')
    expect(result).toContain('outline: deep')
    expect(result).toContain('title: "Test"')
  })
})
