# MEMORY.md - Long-Term Memory

## Infrastructure Setup

### Google Drive (Setup: 2026-07-15)
- **Google Account:** ewizt.com@gmail.com
- **Google Cloud Project:** xiaoxia-502415
- **Service Account:** xiaoxia@xiaoxia-502415.iam.gserviceaccount.com (Client ID: 111586787135490698875)
- **Service Account Key:** ~/.config/gdrive/service-account-key.json (read-only — 0 byte storage quota, can't create files)
- **OAuth Client ID:** 222016922937-gq5udtuih7ueiqqdjfdn4r94dvr724kf.apps.googleusercontent.com
- **OAuth Client Secret:** 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
- **OAuth Token:** ~/.config/gdrive/oauth_token.json (use this for creating/editing files — refreshes automatically)
- **Client Secret File:** ~/.config/gdrive/client_secret.json
- **Shared Folder:** XiaoXia (ID: 1Ypzi2ifGAvNs5kIWErkK_ojPZh2aBLW4)
- **Storage:** 15GB limit, ~35KB used
- **Note:** Service accounts have 0 storage quota. Must use OAuth credentials for creating files. Service account is fine for reading shared files.
- **Setup steps documented in:** TOOLS.md → Google Drive section + email sent to soonee.ong@gmail.com

### Key Lessons
- Service accounts can READ shared files but CANNOT CREATE files (0 byte quota)
- OAuth consent screen in Testing mode requires adding users as "Test users"
- The OOB flow (urn:ietf:wg:oauth:2.0:oob) works for headless auth — user opens URL in browser, gets code, pastes it back
- Token auto-refreshes via refresh_token, so it's permanent until revoked