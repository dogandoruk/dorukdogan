import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'src', 'data');
const PAGES_DIR = path.join(ROOT_DIR, 'src', 'pages');
const UPLOADS_DIR = path.join(ROOT_DIR, 'public', 'images', 'uploads');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups', 'cms-auto');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = 3001;

// Ensure directories exist
for (const dir of [UPLOADS_DIR, BACKUP_DIR, PUBLIC_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Prunes the backups/cms-auto directory to keep strictly the latest 5 files.
 */
function pruneBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .map(name => ({
        name,
        path: path.join(BACKUP_DIR, name),
        time: fs.statSync(path.join(BACKUP_DIR, name)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time); // newest first

    if (files.length > 5) {
      const toDelete = files.slice(5);
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
      }
    }
  } catch (err) {
    console.error('Error pruning backups:', err);
  }
}

/**
 * Creates a timestamped backup before modifying a file.
 */
function createBackup(filename, content) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = path.basename(filename);
    const backupPath = path.join(BACKUP_DIR, `${safeName}.${timestamp}.bak`);
    fs.writeFileSync(backupPath, content, 'utf8');
    pruneBackups();
  } catch (err) {
    console.error('Backup creation failed:', err);
  }
}

/**
 * Sanitizes an uploaded image filename to clean web-friendly lowercase.
 */
function sanitizeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const timestamp = Date.now().toString().slice(-4);
  return `${baseName || 'upload'}-${timestamp}${ext || '.png'}`;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // CORS headers for local dev
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  try {
    // API: Get structured data collection
    if (req.method === 'GET' && pathname.startsWith('/api/data/')) {
      const collection = pathname.replace('/api/data/', '');
      const filePath = path.join(DATA_DIR, `${collection}.json`);
      if (!fs.existsSync(filePath)) {
        return sendJson(res, 404, { error: `Collection ${collection} not found` });
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return sendJson(res, 200, JSON.parse(content));
    }

    // API: Save structured data collection
    if (req.method === 'POST' && pathname.startsWith('/api/data/')) {
      const collection = pathname.replace('/api/data/', '');
      const filePath = path.join(DATA_DIR, `${collection}.json`);
      const body = await parseBody(req);
      const parsedData = JSON.parse(body);

      // Create backup of existing file
      if (fs.existsSync(filePath)) {
        const oldContent = fs.readFileSync(filePath, 'utf8');
        createBackup(`${collection}.json`, oldContent);
      }

      fs.writeFileSync(filePath, JSON.stringify(parsedData, null, 2), 'utf8');
      return sendJson(res, 200, { success: true, message: `Saved ${collection}.json` });
    }

    // API: List editable .astro pages
    if (req.method === 'GET' && pathname === '/api/pages') {
      const pages = [];
      const scanDir = (dir, prefix = '') => {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const relative = path.join(prefix, entry.name);
          if (entry.isDirectory()) {
            scanDir(path.join(dir, entry.name), relative);
          } else if (entry.name.endsWith('.astro')) {
            pages.push({
              name: entry.name,
              relativePath: relative.replace(/\\/g, '/')
            });
          }
        }
      };
      scanDir(path.join(PAGES_DIR, 'case-studies'), 'case-studies');
      scanDir(path.join(PAGES_DIR, 'projects'), 'projects');
      return sendJson(res, 200, { pages });
    }

    // API: Read .astro page content
    if (req.method === 'GET' && pathname.startsWith('/api/page/')) {
      const relPath = decodeURIComponent(pathname.replace('/api/page/', ''));
      const filePath = path.join(PAGES_DIR, relPath);
      if (!fs.existsSync(filePath)) {
        return sendJson(res, 404, { error: 'Page not found' });
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return sendJson(res, 200, { path: relPath, content });
    }

    // API: Save .astro page content
    if (req.method === 'POST' && pathname.startsWith('/api/page/')) {
      const relPath = decodeURIComponent(pathname.replace('/api/page/', ''));
      const filePath = path.join(PAGES_DIR, relPath);
      const body = await parseBody(req);
      const { content } = JSON.parse(body);

      if (fs.existsSync(filePath)) {
        const oldContent = fs.readFileSync(filePath, 'utf8');
        createBackup(path.basename(filePath), oldContent);
      }

      fs.writeFileSync(filePath, content, 'utf8');
      return sendJson(res, 200, { success: true, message: `Saved ${relPath}` });
    }

    // API: List recent uploaded images
    if (req.method === 'GET' && pathname === '/api/uploads') {
      const files = fs.readdirSync(UPLOADS_DIR)
        .filter(name => !name.startsWith('.'))
        .map(name => ({
          name,
          url: `/dorukdogan/images/uploads/${name}`,
          time: fs.statSync(path.join(UPLOADS_DIR, name)).mtimeMs
        }))
        .sort((a, b) => b.time - a.time);
      return sendJson(res, 200, { files });
    }

    // API: Upload image (multipart/form-data parser in pure Node)
    if (req.method === 'POST' && pathname === '/api/upload') {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        return sendJson(res, 400, { error: 'Expected multipart/form-data' });
      }

      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      if (!boundaryMatch) {
        return sendJson(res, 400, { error: 'Missing boundary' });
      }
      const boundary = boundaryMatch[1] || boundaryMatch[2];

      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        
        // Find filename
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) {
          return sendJson(res, 400, { error: 'Malformed multipart form data' });
        }
        
        const headerStr = buffer.slice(0, headerEnd).toString();
        const filenameMatch = headerStr.match(/filename="([^"]+)"/i);
        const originalName = filenameMatch ? filenameMatch[1] : 'uploaded-image.png';
        const safeName = sanitizeFilename(originalName);

        // Extract binary data between headerEnd + 4 and ending boundary
        const dataStart = headerEnd + 4;
        const dataEnd = buffer.indexOf(Buffer.from(`\r\n--${boundary}`), dataStart);
        const fileData = dataEnd !== -1 ? buffer.slice(dataStart, dataEnd) : buffer.slice(dataStart);

        const targetPath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(targetPath, fileData);

        return sendJson(res, 200, {
          success: true,
          filename: safeName,
          url: `/dorukdogan/images/uploads/${safeName}`
        });
      });
      return;
    }

    // API: Git status
    if (req.method === 'GET' && pathname === '/api/git/status') {
      exec('git status --porcelain', { cwd: ROOT_DIR }, (err, stdout) => {
        if (err) {
          return sendJson(res, 500, { error: err.message });
        }
        const lines = stdout.trim().split('\n').filter(Boolean);
        const changes = lines.map(line => {
          const status = line.slice(0, 2).trim();
          const file = line.slice(3).trim();
          return { status, file };
        });
        return sendJson(res, 200, { dirty: changes.length > 0, changes });
      });
      return;
    }

    // API: Git commit and push
    if (req.method === 'POST' && pathname === '/api/git/push') {
      const body = await parseBody(req);
      const { message } = JSON.parse(body || '{}');
      const commitMsg = message && message.trim() ? message.trim() : `Content update via Local CMS (${new Date().toISOString().slice(0, 10)})`;

      const command = `git add . && git commit -m "${commitMsg.replace(/"/g, '\\"')}" && git push`;
      exec(command, { cwd: ROOT_DIR }, (err, stdout, stderr) => {
        if (err) {
          return sendJson(res, 500, {
            success: false,
            error: err.message,
            output: stderr || stdout
          });
        }
        return sendJson(res, 200, {
          success: true,
          message: 'Changes committed and pushed to GitHub!',
          output: stdout
        });
      });
      return;
    }

    // Serve Static Files from cms/public
    let reqFile = pathname === '/' ? 'index.html' : pathname;
    const safeFilePath = path.join(PUBLIC_DIR, path.normalize(reqFile));

    if (fs.existsSync(safeFilePath) && fs.statSync(safeFilePath).isFile()) {
      const ext = path.extname(safeFilePath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(safeFilePath).pipe(res);
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');

  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`Doruk's Local Studio CMS Server is running at:`);
  console.log(`http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
