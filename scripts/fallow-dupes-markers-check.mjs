// scripts\fallow-dupes-markers-check.mjs
// fallow's suppress-line mechanism only recognizes a `fallow-ignore-next-line`
// comment when it is a single physical line sitting immediately above the
// flagged code — a marker split across multiple comment lines, or separated
// from the code by another comment, silently fails to suppress with no
// warning from `fallow dupes` itself. This script catches that shape so it
// doesn't need re-discovering by hand.
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// git grep exits 1 (not an error) when there are zero matches, e.g. a
// project with no fallow-ignore-next-line comments yet.
function grepFiles() {
  try {
    return execSync('git grep -l "fallow-ignore-next-line"', { cwd: root, encoding: 'utf8' })
  } catch (err) {
    if (err.status === 1) return ''
    throw err
  }
}

const files = grepFiles().split('\n').filter(Boolean)

const broken = []
for (const file of files) {
  const lines = fs.readFileSync(path.join(root, file), 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('fallow-ignore-next-line')) continue
    const markerLine = lines[i].trim()
    const isHtmlComment = markerLine.startsWith('<!--')
    const closesOnSameLine = isHtmlComment && markerLine.includes('-->')
    const isJsComment = markerLine.startsWith('//')

    if (isJsComment && (lines[i + 1] ?? '').trim().startsWith('//')) {
      broken.push(`${file}:${i + 1}`)
    } else if (isHtmlComment && !closesOnSameLine) {
      broken.push(`${file}:${i + 1}`)
    }
  }
}

if (broken.length) {
  console.error('fallow-ignore-next-line markers that will NOT suppress (must be one physical line, directly above the flagged code):')
  for (const entry of broken) console.error(`  ${entry}`)
  process.exit(1)
}

console.log('All fallow-ignore-next-line markers are single-line and correctly placed.')
