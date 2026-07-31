import { readdir, readFile } from 'node:fs/promises'
import { extname } from 'node:path'

const DIST_DIR = new URL('../../dist/', import.meta.url)
const files = await collectFiles(DIST_DIR)
const violations = []
const forbiddenExtensions = new Set(['.env', '.key', '.map', '.pem', '.p12', '.pfx'])
const executableFiles = files.filter(file => ['.html', '.js', '.css'].includes(extname(file.pathname)))

for (const file of files) {
  if (forbiddenExtensions.has(extname(file.pathname))) {
    violations.push(`Forbidden release artifact: ${file.pathname}`)
  }
}

for (const file of executableFiles) {
  const content = await readFile(file, 'utf8')
  if (/sourceMappingURL\s*=/.test(content)) {
    violations.push(`Source map reference in ${file.pathname}`)
  }
  if (/\b(?:eval|document\.write)\s*\(/.test(content)) {
    violations.push(`Unsafe executable sink in ${file.pathname}`)
  }
  const urls = content.match(/https?:\/\/[^"'`\s)]+/g) || []
  const unexpectedURLs = urls.filter(url =>
    url !== 'http://www.w3.org/1999/xhtml' &&
    url !== 'http://www.w3.org/2000/svg'
  )
  if (unexpectedURLs.length > 0) {
    violations.push(`Unexpected external URL in ${file.pathname}: ${unexpectedURLs[0]}`)
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Security artifact scan passed (${files.length} files inspected).`)
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => {
    const target = new URL(entry.name, directory)
    return entry.isDirectory() ? collectFiles(new URL(`${entry.name}/`, directory)) : [target]
  }))
  return nested.flat()
}
