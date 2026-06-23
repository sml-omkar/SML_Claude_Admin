# Claude SML Admin

Admin portal to view employee Claude conversation logs. Supports uploading JSON export files and browsing employee chat history.

## Prerequisites

- **Node.js** (v18 or later) — download from https://nodejs.org

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/claude-sml-admin.git

# 2. Go into the project folder
cd claude-sml-admin

# 3. Install dependencies
npm install

# 4. Start the server
node server.js
```

Open your browser to **http://localhost:5000**.

## How to Use

1. Open the portal at `http://localhost:5000`
2. Click **Upload Data** in the sidebar
3. Drag your `users.json` and `conversations.json` files onto the upload zones (or click to select them)
4. Click **Upload Files**
5. Click an employee name in the sidebar to view their Claude conversation history

## How It Works

- All JSON files inside the `user/` folder are merged together (deduplicated by `uuid`)
- All JSON files inside the `conversation/` folder are merged together (deduplicated by `uuid`)
- When you upload new files, old files are kept — nothing is overwritten
- Each upload creates a new timestamped file (e.g., `1748674445000.json`) inside the respective folder

## Project Structure

```
claude-sml-admin/
├── server.js           Express server (API + static files)
├── index.html          Admin portal frontend
├── package.json        Node.js dependencies
├── user/               Uploaded users JSON files (merged on load)
├── conversation/       Uploaded conversation JSON files (merged on load)
└── README.md           This file
```

## Features

- Employee list with search, conversation count, and last activity date
- Per-user conversation viewer with clear Employee / Claude labels
- Extracts Claude tool calls, file creations, and thinking blocks — no "not supported" placeholders
- Shows attachment file names on employee messages
- Safe re-uploading — old data merges with new, nothing is lost
