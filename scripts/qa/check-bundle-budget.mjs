import { gzipSync } from 'node:zlib'
import { readdir, readFile } from 'node:fs/promises'
import { extname } from 'node:path'

const DIST_DIR = new URL('../../dist/', import.meta.url)
const RAW_LIMIT = 600 * 1024
const GZIP_LIMIT = 150 * 1024

const files = await collectFiles(DIST_DIR)
const JavaScriptFiles = files.filter(file => extname(file.pathname) === '.js')

if (JavaScriptFiles.length === 0) {
  throw new Error('No production JavaScript found. Run npm run build first.')
}

let rawBytes = 0
let gzipBytes = 0

for (const file of JavaScriptFiles) {
  const content = await readFile(file)
  rawBytes += content.byteLength
  gzipBytes += gzipSync(content, { level: 9 }).byteLength
}

const summary = {
  files: JavaScriptFiles.length,
  rawBytes,
  rawLimitBytes: RAW_LIMIT,
  gzipBytes,
  gzipLimitBytes: GZIP_LIMIT
}

console.log(JSON.stringify(summary, null, 2))

if (rawBytes > RAW_LIMIT || gzipBytes > GZIP_LIMIT) {
  process.exitCode = 1
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => {
    const target = new URL(entry.name, directory)
    return entry.isDirectory() ? collectFiles(new URL(`${entry.name}/`, directory)) : [target]
  }))
  return nested.flat()
}
