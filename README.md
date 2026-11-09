# Islamic University 5th Convocation 2027 — Demonstration Portal

> **UNOFFICIAL DEMONSTRATION PROJECT**  
> This website is an independently developed educational UI/UX and software demonstration inspired by the public-facing Islamic University Bangladesh 5th Convocation 2027 portal. It is **NOT** the official university website and is **NOT** affiliated with, endorsed by, or operated by Islamic University Bangladesh.  
> **No real payments, money transfers, or official registrations take place on this portal.**

---

## 🏛️ Project Identity & Overview

* **Event Title:** 5th Convocation 2027 (পঞ্চম সমাবর্তন ২০২৭)
* **Institution:** Islamic University Bangladesh (ইসলামী বিশ্ববিদ্যালয় বাংলাদেশ)
* **Location:** Kushtia - 7003, Bangladesh
* **Ceremony Date:** Tuesday, 02 February 2027 · 09:00 AM BST
* **Venue:** Central Playground, Islamic University Campus, Kushtia
* **Registration Period:** 10 November 2026 – 25 November 2026
* **Official Reference Portals:**
  - Convocation Portal: [https://convocation.iu.ac.bd/](https://convocation.iu.ac.bd/)
  - Islamic University Main: [https://iu.ac.bd/](https://iu.ac.bd/)

---

## 🎨 Asset Inventory & Usage

All original reference assets in the project directory are preserved and reused:

| Folder | Filename | Description | Usage in Demonstration Portal |
|---|---|---|---|
| `Logo/` | `convoLogo.png` | Official 5th Convocation emblem with monument, book & candle flame | Hero section right glass card, Printable Convocation Card, Campus gallery |
| `Logo/` | `iuLogo.png` | Islamic University Bangladesh monogram emblem | Navigation header brand logo, Sign In / Register headers, Footer, Watermarked Receipts |
| `Payment/` | `BKash.jpg` | Magenta bKash BANGLA QR code with Bengali instructions | bKash demonstration QR payment modal & simulation view |
| `Payment/` | `Rocket.jpg` | Dutch-Bangla Bank Rocket BANGLA QR code with beneficiary details | Rocket demonstration QR payment modal & simulation view |
| `refereceSS/` | `background_mainGateImage.webp` | Historic IU Main Entrance Archway Gate image | Hero section background with deep teal gradient overlay & campus gallery |
| `refereceSS/` | `Screenshot (443)` to `(450).png` | High-resolution visual screenshots of original portal | Visual baseline references for Navigation, Hero, Notices, Guidelines, Fees, Schedule, Contact, Sign In & Registration |

---

## ⚙️ Tech Stack & Architecture

### Frontend
* **Framework:** React 19 + TypeScript + Vite
* **Styling:** Tailwind CSS + Custom Academic Palette (`#075C55` Deep Teal, `#153A37` Dark Green, `#F3A052` Warm Gold, `#F4F8F6` Soft Background)
* **Routing:** React Router v7 (`react-router-dom`)
* **Icons:** Lucide React
* **Typography:** Inter (English) & Hind Siliguri (Bangla Unicode)

### Backend
* **API Framework:** Python FastAPI
* **ORM & Database:** SQLAlchemy 2.0 with SQLite (`convocation.db`)
* **Validation:** Pydantic v2 schemas
* **Authentication:** JWT (HMAC-SHA256) with Bcrypt password hashing
* **Test Suite:** Pytest + FastAPI TestClient (15 automated tests)
* **Quality Assurance:** Headless Playwright Chromium engine capturing 24 automated screenshots

---

## 🎓 Department Database (All 36 Departments with Reference IDs)

The portal incorporates all 8 faculties and 36 academic departments matching official IU university structures:

* **Faculty of Theology and Islamic Studies:**
  - `1`: Al-Quran and Islamic Studies
  - `5`: Dawah & Islamic Studies
  - `2`: Al-Hadith & Islamic Studies
  - `4`: As-Sirat An-Nabawiyyah
  - `3`: Comparative Tafseer
* **Faculty of Arts:**
  - `28`: Bengali | `29`: English | `30`: Islamic History and Culture | `27`: Arabic Language and Literature | `31`: Fine Arts
* **Faculty of Social Sciences:**
  - `32`: Economics | `33`: Public Administration | `34`: Political Science | `35`: Folklore and Social Studies | `36`: Development Studies | `37`: Social Welfare | `38`: Communication and Multimedia Journalism | `20`: Physical Education & Sports Science
* **Faculty of Business Administration:**
  - `21`: Accounting and Information Systems | `22`: Management | `23`: Finance and Banking | `24`: Marketing | `25`: Human Resource Management | `26`: Tourism and Hospitality Management
* **Faculty of Law:**
  - `39`: Law | `40`: Al-Fiqh and Law | `41`: Law and Land Administration
* **Faculty of Sciences:**
  - `17`: Mathematics | `18`: Statistics and Data Science | `19`: Environmental Science and Geography
* **Faculty of Biological Sciences:**
  - `15`: Applied Nutrition and Food Technology | `14`: Biotechnology and Genetic Engineering | `16`: Pharmacy
* **Faculty of Engineering & Technology:**
  - `10`: Computer Science and Engineering | `9`: Electrical and Electronic Engineering | `12`: Information and Communication Technology | `13`: Biomedical Engineering | `11`: Applied Chemistry and Chemical Engineering

---

## 🎨 UI Redesign — Faithfully Matching Original IU Convocation Visual Quality

The portal was redesigned using high-resolution visual comparisons against the live official Islamic University 5th Convocation website:

* **Authoritative Typography:**
  - University Branding: 28px bold (`#153A37`).
  - Convocation Subtitle: 13–14px bold uppercase (`#F3A052`, letter-spaced).
  - Navigation Links: 18–20px medium/semibold with clean colored underline active state (`border-b-2 border-[#117A78]`, no pill background boxes).
  - Page Hero Titles: 64–72px extra-bold with 20–22px subtitle descriptions.
* **Sticky Navigation Bar:**
  - Header is fixed (`position: sticky; top: 0; z-index: 50`) with smooth scrolling and subtle bottom shadow.
  - Features the delicate warm gold line (`border-b-2 border-[#F3A052]/40`) beneath the navbar, exactly mirroring the original design.
  - Sign In is a clean rounded-full pill with teal border; Registration is a warm gold pill with graduation cap icon.
* **Shared `PageHero` Component:**
  - Rich campus gate archway photo duotone overlay (`linear-gradient(110deg, rgba(7, 92, 85, 0.78) 0%, rgba(7, 92, 85, 0.65) 50%, rgba(21, 58, 55, 0.60) 100%)`).
  - Subtle repeating diagonal pinstripe lines texture (`repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.055) ...)`).
* **Elimination of Disruptive Disclaimer Cards:**
  - Removed giant overlapping disclaimer cards from page bodies to restore visual elegance. Legal demonstration notices are cleanly housed in the top slim announcement bar and comprehensive footer.
* **Wide Content Layouts:** Expanded content containers to `max-w-[1450px]` for spacious, modern presentation.
* **Full Responsive Support:** Verified across all 8 standard viewports (1920px down to 360px) with responsive navigation drawer and zero horizontal overflow.

---

## 🔑 Demonstration Accounts & Credentials

The database is seeded automatically with synthetic accounts for testing:

### 1. Demonstration Administrator
* **URL:** `/admin/login` or click "University Staff Login" on Sign In page
* **Identifier (Email):** `admin@convocation.iu.ac.bd`
* **Password:** `AdminIU@2027`
* **Capabilities:** View statistics, review all student applications, change status with review notes (Approved/Rejected/Correction), manage notices, export CSVs.

### 2. Demonstration Student 1 (Approved Candidate)
* **Identifier (Mobile):** `01811860339` (or Email: `arnob.ict@gmail.com` or Roll: `1812045`)
* **Password:** `StudentIU@2027`
* **Application ID:** `IU27-DEMO-000101`
* **Department:** Information and Communication Technology (ICT)
* **Status:** `Approved (Demo)`
* **Features to Test:** Download/Print Watermarked Convocation Card, view bKash demo receipt, test public tracking.

### 3. Demonstration Student 2 (Under Review / Payment Done)
* **Identifier (Mobile):** `01712345678` (or Email: `sadia.cse@gmail.com` or Roll: `1910012`)
* **Password:** `StudentIU@2027`
* **Application ID:** `IU27-DEMO-000102`
* **Department:** Computer Science and Engineering (CSE)
* **Status:** `Under Review`

---

## 💳 Payment Demonstration System

The payment interface provides an authentic simulation with strict guardrails:
1. Two payment channels: **bKash** and **Rocket** displaying the repository's local Bangla QR code images.
2. Dynamic fee calculation:
   - Base Registration: Regular ৳4,500 / Evening ৳5,500
   - Certificates: Bachelor ৳500, Masters ৳700, M.Phil ৳1,500, PhD ৳2,000, Evening Masters ৳1,000 (Waived if candidate holds original certificate).
   - Accompanying Guests: ৳1,000 per guest (Max 3, children under 5 exempt).
   - Online Service Charge: ৳32.50.
3. Unique persistent Reference IDs: `DEMO-IU-2027-BKXXXX` / `DEMO-IU-2027-RCXXXX`.
4. **Mandatory Red Warning Banner:**
   ```
   ⛔ DO NOT PAY — FOR TESTING / DEMONSTRATION PURPOSES ONLY.
   NO REAL PAYMENT GATEWAY IS CONNECTED.
   এই QR কোড শুধুমাত্র ওয়েবসাইটের Demo প্রদর্শনের জন্য। অনুগ্রহ করে কোনো টাকা পাঠাবেন না।
   ```
5. Action buttons: "Simulate Payment Success" & "Cancel Payment".
6. Generates watermarked receipt: `"DEMO ONLY — NOT A VALID PAYMENT RECEIPT."`

---

## 🔍 Public Application Tracking

* **Route:** `/track-application`
* **Input:** Unique Application ID (e.g., `IU27-DEMO-000101`)
* **Privacy Safe:** Withholds personal contact details, residential address, photos, and passwords.
* **Synchronization:** Instant updates whenever an administrator changes candidate status in the admin console.

---

## 🚀 Setup & Execution Instructions

### Prerequisites
* Python 3.10+
* Node.js v18+ with `npm`

### Step 1: Start the Backend (Terminal 1)
```powershell
cd "C:\Users\USER\Desktop\Projects\Convocation\backend"
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend API root: `http://127.0.0.1:8000/`
* Swagger Interactive API Docs: `http://127.0.0.1:8000/docs`

### Step 2: Start the Frontend (Terminal 2)
```powershell
cd "C:\Users\USER\Desktop\Projects\Convocation\frontend"
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```
* Frontend Portal: `http://127.0.0.1:5173/`

### Step 3: Run Backend Tests
```powershell
cd "C:\Users\USER\Desktop\Projects\Convocation\backend"
python -m pytest
```
*(All 16 tests pass with 100% coverage on fee engine, user-defined auth, RBAC, payments, and tracking)*

### Step 4: Run Automated UI & Responsive Audit (Full User Journey + 8 Viewports)
```powershell
cd "C:\Users\USER\Desktop\Projects\Convocation"
python scripts/run_final_audit.py
```
*(Executes full registration with user-defined passwords, bKash & Rocket simulations, cancellation, and captures 65 multi-viewport screenshots in `screenshots/final-responsive-audit/`)*

### Demonstration Contact:
* **Demo Technical Support:** [`arnob.ict.iu@gmail.com`](mailto:arnob.ict.iu@gmail.com)
* **Official University Reference:** [`convocation@iu.ac.bd`](mailto:convocation@iu.ac.bd)
* **Comprehensive Audit Report:** See [`FINAL_UI_AUDIT_REPORT.md`](./FINAL_UI_AUDIT_REPORT.md)

---

## 📄 License & Fair Use Notice
This repository is created solely for **educational, UI/UX evaluation, and software architecture demonstration** purposes. Islamic University Bangladesh, its emblems, logos, and trademarks belong to their respective university authorities.
