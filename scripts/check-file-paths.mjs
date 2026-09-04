// scripts\check-file-paths.mjs
// Verifies that every .ts/.tsx source file under app/, components/, lib/
// starts with a path comment matching its real location.
//
// Usage:
//   node scripts/check-file-paths.mjs         report mismatches/missing headers, exit 1 if any
//   node scripts/check-file-paths.mjs --fix    rewrite/insert the header in place

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = join(fileURLToPath(import.meta.url), '..', '..')
const scanDirs = ['app', 'components', 'lib', 'scripts']
const skipDirNames = new Set(['node_modules', '.next', 'dist', 'coverage', 'ui'])
const skipFiles = new Set()
const extHandlers = {
  '.ts': { pattern: /^\/\/\s*(.+?)\s*$/, format: p => `// ${p}` },
  '.tsx': { pattern: /^\/\/\s*(.+?)\s*$/, format: p => `// ${p}` },
  '.mjs': { pattern: /^\/\/\s*(.+?)\s*$/, format: p => `// ${p}` }
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (skipDirNames.has(entry)) continue
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      walk(fullPath, files)
    } else if (extHandlers[extname(entry)]) {
      files.push(fullPath)
    }
  }
  return files
}

function expectedPathFor(fullPath) {
  return relative(rootDir, fullPath).split(/[\\/]/).join('\\')
}

function checkFile(fullPath) {
  const ext = extname(fullPath)
  const handler = extHandlers[ext]
  const content = readFileSync(fullPath, 'utf8')
  const firstLine = (content.split(/\r?\n/)[0] ?? '').trim()
  const expectedPath = expectedPathFor(fullPath)
  const expectedComment = handler.format(expectedPath)

  const match = firstLine.match(handler.pattern)
  if (match && match[1] !== expectedPath) {
    // First line is a path-shaped comment ending in this file's extension, just the
    // wrong path (e.g. stale after a folder move) — safe to overwrite in place.
    if (match[1].endsWith(ext)) {
      return { status: 'mismatch', actual: firstLine, expectedComment, content }
    }
    // First line is a comment but doesn't look like a path at all (a file-level
    // description, an invariant note, a fallow-ignore directive, etc.) — don't
    // clobber it, insert the header above it instead.
    return { status: 'missing', note: firstLine, expectedComment, content }
  }
  if (match) return { status: 'ok' }
  return { status: 'missing', expectedComment, content }
}

function fixFile(fullPath, result) {
  const eol = result.content.includes('\r\n') ? '\r\n' : '\n'
  const lines = result.content.split(/\r?\n/)
  if (result.status === 'mismatch') {
    lines[0] = result.expectedComment
  } else {
    lines.unshift(result.expectedComment)
  }
  writeFileSync(fullPath, lines.join(eol))
}

const shouldFix = process.argv.includes('--fix')
const files = scanDirs
  .flatMap(dir => walk(join(rootDir, dir)))
  .filter(fullPath => !skipFiles.has(relative(rootDir, fullPath)))

const missing = []
const mismatched = []

for (const fullPath of files) {
  const result = checkFile(fullPath)
  if (result.status === 'ok') continue

  const relPath = relative(rootDir, fullPath)
  if (result.status === 'missing') {
    missing.push({ relPath, note: result.note, expected: result.expectedComment })
  } else {
    mismatched.push({ relPath, actual: result.actual, expected: result.expectedComment })
  }

  if (shouldFix) fixFile(fullPath, result)
}

console.log(`Scanned ${files.length} files under ${scanDirs.join(', ')}`)

if (mismatched.length > 0) {
  console.log(`\n${mismatched.length} mismatched header${mismatched.length === 1 ? '' : 's'}:`)
  for (const { relPath, actual, expected } of mismatched) {
    console.log(`  ${relPath}`)
    console.log(`    found:    ${actual}`)
    console.log(`    expected: ${expected}`)
  }
}

if (missing.length > 0) {
  console.log(`\n${missing.length} file${missing.length === 1 ? '' : 's'} missing a path header (will be inserted above any existing first-line comment):`)
  for (const { relPath, note, expected } of missing) {
    console.log(`  ${relPath}${note ? ` (first line kept: "${note}")` : ''}`)
    console.log(`    ${shouldFix ? 'inserted' : 'would insert'}: ${expected}`)
  }
}

if (mismatched.length === 0 && missing.length === 0) {
  console.log('\nAll path headers are correct.')
} else if (shouldFix) {
  console.log('\nFixed all of the above.')
} else {
  console.log('\nRun with --fix to correct these in place.')
}

process.exit(mismatched.length === 0 && missing.length === 0 ? 0 : shouldFix ? 0 : 1)
