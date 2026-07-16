# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## ⚠️ Critical: Never Kill the Lobster Server Process

The lobster server (`tsx src/server.ts`) on port 3099 shares the OpenClaw process tree. **Never use `kill`, `pkill`, `fuser`, or any direct process termination on port 3099 or `tsx src/server.ts`** — it will crash OpenClaw and require manual restart.

**When restart is needed:** Ask Jack to run from a terminal:
```bash
cd /home/ubuntu/works/lobster-automation/server-deployment && pkill -f "tsx src/server.ts" && sleep 2 && node_modules/.bin/tsx src/server.ts &
```

**Before killing anything, check first:**
```bash
ps aux | grep -E "tsx|node.*server" | grep -v grep
```
If unsure, ask Jack.

---

## FTP Accounts — Two Separate Accounts

### FTP Account 1: `clawftpewizt` (PUBLIC web hosting)
**Use for:** Public web-accessible files only.

- **Host:** `ewizt.com`
- **User:** `clawftpewizt`
- **Pass:** `Zgk64r28a`
- **Port:** 21 / SSL port 990
- **Root:** `/ewizt/` — maps to `http://ewizt.com/`
- **⚠️ RULES:** Do NOT store private/secrete data here. Everything uploaded here is publicly accessible on the web.

Contents of `/ewizt/`:
- `index.php` = landing page
- `wrello/` = Kanban board
- `Wlight/` = light sensor app
- `daily-news/` = daily news HTML pages
- `custom/` = custom news subscriber pages

---

### FTP Account 2: `clawdataewizt` (PRIVATE data storage — NOT web accessible)
**Use for:** Private databases, backups, config files, sensitive data — anything that should NOT be public.

- **Host:** `ewizt.com`
- **User:** `clawdataewizt`
- **Pass:** `d1dtnR307`
- **Port:** 21 / SSL
- **Root:** `/data/` — this folder is NOT accessible from the public web
- **✅ USE THIS** for: private DB files (e.g. `custom-news-requests.db`), backups, logs, non-public scripts, credentials that shouldn't leak

---

### Quick Reference

| Account | URL Access | Use Case |
|---------|-----------|----------|
| `clawftpewizt` | `http://ewizt.com/...` | Public web files only |
| `clawdataewizt` | No web access | Private data, databases, backups |

### Python FTP Helper (use this for both accounts)

```python
import ftplib

# PUBLIC account (clawftpewizt)
ftp = ftplib.FTP_TLS('ewizt.com', timeout=15)
ftp.login('clawftpewizt', 'Zgk64r28a')
ftp.prot_p()  # enable TLS

# PRIVATE account (clawdataewizt)
ftp2 = ftplib.FTP_TLS('ewizt.com', timeout=15)
ftp2.login('clawdataewizt', 'd1dtnR307')
ftp2.prot_p()  # enable TLS
# Root is /data/ — NOT web accessible
```

When downloading/uploading, use the correct account based on whether the data is public or private.

## Google Drive

Service account configured for `ewizt.com@gmail.com` Google Drive.

- **Key file:** `~/.config/gdrive/service-account-key.json`
- **Service account email:** `xiaoxia@xiaoxia-502415.iam.gserviceaccount.com`
- **Project:** `xiaoxia-502415`
- **Shared folder:** `XiaoXia` (ID: `1Ypzi2ifGAvNs5kIWErkK_ojPZh2aBLW4`)
- **OAuth token:** `~/.config/gdrive/oauth_token.json` (for ewizt.com@gmail.com — use this for creating files)
- **Service account:** `~/.config/gdrive/service-account-key.json` (read-only — 0 byte quota)
- **Scopes:** `https://www.googleapis.com/auth/drive` (full access)
- **Python setup:** `google-api-python-client`, `google-auth-httplib2`, `google-auth-oauthlib` installed

### Usage (OAuth — for creating/editing files)
```python
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import json

with open('/home/ubuntu/.config/gdrive/oauth_token.json') as f:
    token_data = json.load(f)

creds = Credentials(
    token=token_data['token'],
    refresh_token=token_data['refresh_token'],
    token_uri=token_data['token_uri'],
    client_id=token_data['client_id'],
    client_secret=token_data['client_secret'],
    scopes=token_data['scopes']
)
creds.refresh(Request())  # auto-refreshes token
service = build('drive', 'v3', credentials=creds)
```

### Usage (Service Account — read-only, 0 quota)
```python
from google.oauth2 import service_account
from googleapiclient.discovery import build

creds = service_account.Credentials.from_service_account_file(
    '/home/ubuntu/.config/gdrive/service-account-key.json',
    scopes=['https://www.googleapis.com/auth/drive']
)
service = build('drive', 'v3', credentials=creds)
```

---

## Project Directories

- **novel_fuzzy-weights** → `~/works/novel_fuzzy-weights/` 🅿️ pinned as default project — novel writing & translation (模糊权重)
- **ji-js-cn** → `~/works/ji-js-cn/` — Bazi marriage compatibility (八字合婚) reproduction
- **daily-news-tech-site** → `~/projects/daily-news-tech-site/`
- **youtube** → `~/works/youtube/` — YouTube-related automation and tools

## OpenClaw Session Management

If the model returns context overflow errors (`estimatedPromptTokens=XXX`), clean up session files:
```bash
rm -f /home/ubuntu/.openclaw/agents/main/sessions/*.lock
find /home/ubuntu/.openclaw/agents/main/sessions/ -name "*.jsonl" -size +1M -delete
```
This resolves SIGKILL/exec failures caused by bloated session history (>100K tokens).

## Email (SMTP)

**Sending email** is available via Python `smtplib` using the ewizt.com mail server.

```python
import smtplib, ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

msg = MIMEMultipart('alternative')
msg['Subject'] = 'Subject here'
msg['From'] = 'bot@ewizt.com'
msg['To'] = 'recipient@example.com'
# msg['Cc'] = 'cc@example.com'  # optional

msg.attach(MIMEText(plain_text, 'plain', 'utf-8'))
msg.attach(MIMEText(html_content, 'html', 'utf-8'))

recipients = ['recipient@example.com']  # include Cc addresses here too

context = ssl.create_default_context()
with smtplib.SMTP_SSL('ewizt.com', 465, context=context) as server:
    server.login('bot@ewizt.com', 'n59Sun8K8')
    server.sendmail('bot@ewizt.com', recipients, msg.as_string())
```

- **SMTP host:** `ewizt.com:465` (SSL)
- **Sender:** `bot@ewizt.com`
- **FTP host:** `ewizt.com`, user: `clawftpewizt`, pass: `Zgk64r28a` (Plesk)
- **Known recipients:** `soonee.ong@gmail.com`, `siaw.chen.lee@intel.com`
- **Use cases:** sending reports, HTML emails, model comparison results, newsletters
- **Reference:** use the SMTP method directly in Python scripts

When someone asks to "email" or "send email", always use this method. Do not say "no email configured" — it IS configured.
