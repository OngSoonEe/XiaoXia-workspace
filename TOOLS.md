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
- **Known recipients:** `soonee.ong@gmail.com`, `siaw.chen.lee@intel.com`
- **Use cases:** sending reports, HTML emails, model comparison results, newsletters
- **Reference script:** `/home/ubuntu/topics/news/scripts/daily-news-cron.sh`

When someone asks to "email" or "send email", always use this method. Do not say "no email configured" — it IS configured.
