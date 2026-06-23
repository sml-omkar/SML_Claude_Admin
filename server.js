const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname);
const USER_DIR = path.join(DATA_DIR, 'user');
const CONV_DIR = path.join(DATA_DIR, 'conversation');

[USER_DIR, CONV_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function dedupeByUuid(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (!item.uuid || seen.has(item.uuid)) return false;
    seen.add(item.uuid);
    return true;
  });
}

function loadAllFromDir(dir, fallbackFile) {
  const results = [];
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) results.push(...data);
    }
  } catch (e) { console.error('loadAllFromDir error:', e.message); }
  if (results.length) return dedupeByUuid(results);
  try {
    delete require.cache[require.resolve(fallbackFile)];
    const data = require(fallbackFile);
    if (Array.isArray(data)) return data;
  } catch (e) { console.error('loadAllFromDir fallback error:', e.message); }
  return null;
}

app.get('/api/users', (req, res) => {
  const data = loadAllFromDir(USER_DIR, './users.json');
  if (!data) return res.status(500).json({ error: 'Failed to load users' });
  res.json(data);
});

app.get('/api/conversations', (req, res) => {
  const data = loadAllFromDir(CONV_DIR, './conversations.json');
  if (!data) return res.status(500).json({ error: 'Failed to load conversations' });
  res.json(data);
});

app.get('/api/conversations/:userId', (req, res) => {
  const users = loadAllFromDir(USER_DIR, './users.json');
  const conversations = loadAllFromDir(CONV_DIR, './conversations.json');
  if (!users || !conversations) {
    return res.status(500).json({ error: 'Failed to load data' });
  }
  const user = users.find(u => u.uuid === req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const userConversations = conversations.filter(c => c.account?.uuid === req.params.userId);
  res.json({ user, conversations: userConversations });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'users' ? USER_DIR : CONV_DIR;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const prefix = Date.now();
    const ext = path.extname(file.originalname) || '.json';
    cb(null, `${prefix}${ext}`);
  }
});

const upload = multer({ storage });

app.post('/api/upload/users', upload.fields([
  { name: 'users', maxCount: 1 },
  { name: 'conversations', maxCount: 1 }
]), (req, res) => {
  try {
    const uploaded = [];
    if (req.files?.users) uploaded.push('user/' + req.files.users[0].filename);
    if (req.files?.conversations) uploaded.push('conversation/' + req.files.conversations[0].filename);
    res.json({ success: true, files: uploaded });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Claude SML Admin running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${__dirname}`);
  console.log(`Users dir: ${USER_DIR}`);
  console.log(`Conversations dir: ${CONV_DIR}`);
});
