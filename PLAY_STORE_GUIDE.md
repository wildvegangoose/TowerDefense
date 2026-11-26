# Google Play Store Release Guide — TowerDeChess

Everything required to publish **TowerDeChess — Chess Tower Defense** (`io.github.wildvegangoose.towerdechess`) to the Google Play Store is configured in this repository.

---

## 1. Ready-to-Upload Store Listing Copy

- **App Name:** `TowerDeChess: Chess Tower Defense`
- **Package ID:** `io.github.wildvegangoose.towerdechess`
- **Category:** Games → Strategy
- **Pricing:** Free (No Ads, No In-App Purchases)
- **Privacy Policy URL (already live on GitHub Pages):**
  `https://wildvegangoose.github.io/TowerDefense/privacy-policy.html`

### Short Description (79 / 80 characters)
> Defend the board with chess pieces! Unlock new pieces each level & battle foes.

### Full Description
> Command a handcrafted royal chess army in **TowerDeChess**, a tactical 2.5D diagonal-aerial tower defense game where authentic chess geometry decides every battle.
>
> **UNLOCK A NEW PIECE EVERY LEVEL**
> - **Level 1 — Pawn:** Steadfast frontline defender dealing bonus Critical Thrusts on its 4 diagonal capture squares.
> - **Level 2 — Knight:** Leaps over obstacles in classic L-shapes with shockwave splash damage.
> - **Level 3 — Bishop:** Channels piercing solar beams down all 4 diagonals to sunder enemy armor.
> - **Level 4 — Rook:** Heavy siege artillery firing down straight ranks and files.
> - **Level 5 — Queen:** Commands all 8 compass rays with rapid ricocheting starlight bolts.
> - **Level 6 — King:** Projects a 3×3 Royal Court Aura boosting nearby defenders' damage and speed while generating bonus gold every wave.
> - **Level 7 — Frost Obelisk (Relic Beyond the Board):** Discover the first non-chess mythic construct, chilling enemy hordes in glacial choke points.
>
> **ESCALATING OBSIDIAN LEGIONS**
> Hold the Citadel Gate against Shadow Chargers, heavily armored Ironclad Bastions, healing Blighted Clerics, and the minion-summoning Crimson Warlord across **Tactical** and **Grandmaster** difficulty modes.
>
> **FEATURES**
> - Tactile 2.5D tabletop chessboard with sculpted 3D chess miniatures
> - 3-tier Piece Promotions & target-priority controls (First / Strongest / Closest / Last)
> - Dynamic adaptive battle soundtrack & crisp combat sound effects
> - 100% offline playable — zero ads, zero tracking, zero account required

---

## 2. Store Graphics (Pre-Generated in `store-assets/`)

| Play Console Field | File in Repository | Dimensions |
|---|---|---|
| App Icon | `store-assets/play-icon-512.png` | `512 × 512` PNG |
| Feature Graphic | `store-assets/feature-graphic-1024x500.png` | `1024 × 500` PNG |
| Phone Screenshots (×4) | `store-assets/screenshots/01-phone-*.png` – `04-phone-*.png` | `1080 × 1920` (9:16) |
| Tablet Screenshot | `store-assets/screenshots/05-tablet-frost-obelisk.png` | `1920 × 1080` (16:9) |

---

## 3. Compliance Answers (Play Console Forms)

- **Data Safety:**
  - Does your app collect or share any of the required user data types? → **No**
- **Ads:**
  - Does your app contain ads? → **No**
- **App Access:**
  - All functionality is available without special access/login → **All functionality is available without special access**
- **Content Rating (IARC):**
  - Violence: Mild fantasy/cartoon violence (chess pieces battling dark stone golems, no blood/gore) → typically **Everyone / PEGI 3–7**.
- **Target API Level:**
  - Configured to **`compileSdk = 35` / `targetSdk = 35` (Android 15)**, meeting Google Play's mandatory API requirement.

---

## 4. Generating Your Upload Keystore & Signed `.aab`

> **Important:** Keep your `.jks` keystore and passwords backed up safely — Google Play requires the same upload key for future updates (with Play App Signing enabled). Never commit `.jks` or `keystore.properties` to Git (both are already in `.gitignore`).

### Step A — Generate Your Upload Keystore (One Time)
```bash
keytool -genkey -v \
  -keystore towerdechess-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias towerdechess
```

### Step B — Build the Signed `.aab` (Choose Local OR GitHub Actions)

#### Option 1: Build Automatically via GitHub Actions (No Local Android Studio Needed!)
1. Base64-encode your keystore:
   ```bash
   base64 -w 0 towerdechess-upload.jks
   ```
2. In your GitHub repo **Settings → Secrets and variables → Actions**, add 4 repository secrets:
   - `ANDROID_KEYSTORE_BASE64` — base64 output from step 1
   - `ANDROID_KEYSTORE_PASSWORD` — your keystore password
   - `ANDROID_KEY_ALIAS` — `towerdechess`
   - `ANDROID_KEY_PASSWORD` — your key password
3. Open the **Actions** tab → **Android Play Store Build (.aab)** → **Run workflow**, then download the signed `towerdechess-play-store-aab` artifact!

#### Option 2: Build Locally
1. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in your keystore path & passwords.
2. Run:
   ```bash
   npm install
   npm run android:bundle
   ```
3. Upload `android/app/build/outputs/bundle/release/app-release.aab` to **Google Play Console → Testing → Internal testing** (or **Production**).

---

## 5. Versioning Future Updates
Before each new Play Store upload, increment `versionCode` (integer) and `versionName` in `android/app/build.gradle`, then run `npm run android:bundle` (or push to `main` for GitHub Actions).
