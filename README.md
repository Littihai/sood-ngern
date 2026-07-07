# 💰 สมุดเงิน (sood-ngern) สามารถนำไปใช้งานได้

แอปพลิเคชันบันทึกรายรับ-รายจ่ายส่วนตัว (Personal Expense Tracker) พัฒนาด้วย React + TypeScript
เชื่อมต่อฐานข้อมูลแบบ Realtime ผ่าน Firebase พร้อมระบบล็อกอินด้วย Google และ Deploy อัตโนมัติผ่าน GitHub Actions

<p align="left">
  <img src="https://img.shields.io/github/stars/Littihai/sood-ngern?style=flat-square" alt="stars" />
  <img src="https://img.shields.io/github/forks/Littihai/sood-ngern?style=flat-square" alt="forks" />
  <img src="https://img.shields.io/github/last-commit/Littihai/sood-ngern?style=flat-square" alt="last commit" />
  <img src="https://img.shields.io/github/license/Littihai/sood-ngern?style=flat-square" alt="license" />
</p>

## 🛠️ Tech Stack

**Frontend**

<p>
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Recharts-2.12-22B5BF?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Recharts" />
  <img src="https://img.shields.io/badge/Lucide%20React-0.383-F56565?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide React" />
</p>

**Backend / Infrastructure**

<p>
  <img src="https://img.shields.io/badge/Firebase-11.10-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Firestore-Database-FFA000?style=for-the-badge&logo=firebase&logoColor=white" alt="Firestore" />
  <img src="https://img.shields.io/badge/Firebase%20Auth-Google%20Sign--In-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Firebase Auth" />
  <img src="https://img.shields.io/badge/Firebase%20Hosting-Deploy-FFA000?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase Hosting" />
</p>

**Tooling / CI-CD**

<p>
  <img src="https://img.shields.io/badge/ESLint-8.57-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" />
  <img src="https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/npm-Package%20Manager-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm" />
</p>

---

## 📖 เกี่ยวกับโปรเจกต์

**สมุดเงิน** เป็นเว็บแอปสำหรับบันทึกและติดตามรายรับ-รายจ่ายส่วนตัว ผู้ใช้แต่ละคนล็อกอินด้วยบัญชี Google
ข้อมูลของแต่ละคนจะถูกแยกเก็บอย่างปลอดภัยใน Firestore ผ่าน security rules ที่บังคับให้เข้าถึงได้เฉพาะเจ้าของข้อมูลเท่านั้น

### ✨ ฟีเจอร์หลัก

- 🔐 ล็อกอินด้วย Google Account (Firebase Authentication)
- 💸 บันทึกรายการรายรับ/รายจ่าย พร้อมหมวดหมู่และหมายเหตุ
- 📊 หน้า Dashboard สรุปภาพรวมพร้อมกราฟ (Recharts)
- 📅 มุมมองรายวัน (Daily View) และสรุปรายสัปดาห์/รายเดือน (Summary View)
- ⚡ ข้อมูล Realtime ผ่าน Firestore — อัปเดตทันทีที่มีการเปลี่ยนแปลง
- 🔒 ข้อมูลแยกตามผู้ใช้ (`users/{uid}/transactions/{txId}`) ปลอดภัยด้วย Firestore Security Rules
- 🚀 Deploy อัตโนมัติขึ้น Firebase Hosting ทุกครั้งที่ push เข้า branch `main` ผ่าน GitHub Actions

---

## 📂 โครงสร้างโปรเจกต์

```
src/
 ├─ main.tsx                    # entry point ครอบด้วย AuthProvider
 ├─ App.tsx                     # gate หน้า login / แอพหลัก + จัดการ tab
 ├─ firebase.ts                 # init Firebase app / auth / firestore
 ├─ theme.ts                    # สี, ฟอนต์, หมวดหมู่, ฟังก์ชันวันที่/เงิน
 ├─ types.ts                    # TypeScript types
 ├─ contexts/
 │   └─ AuthContext.tsx         # จัดการ state การล็อกอินด้วย Google
 ├─ hooks/
 │   └─ useTransactions.ts      # อ่าน/เพิ่ม/ลบ รายการจาก Firestore (realtime)
 └─ components/
     ├─ Login.tsx                # หน้าล็อกอิน
     ├─ Layout.tsx                # sidebar, bottom nav, header
     ├─ Dashboard.tsx             # ภาพรวม + กราฟ
     ├─ AddForm.tsx               # ฟอร์มบันทึกรายการ
     ├─ DailyView.tsx             # มุมมองรายวัน
     ├─ SummaryView.tsx           # สรุปรายสัปดาห์/รายเดือน
     └─ shared.tsx                # Card, TxRow, MiniStat ฯลฯ ที่ใช้ร่วมกัน
```

---

## 🚀 เริ่มต้นใช้งาน

### สิ่งที่ต้องมีก่อน

- [Node.js](https://nodejs.org/) และ npm
- บัญชี [Firebase](https://console.firebase.google.com)

### 1. ติดตั้งโปรเจกต์

```bash
npm install
cp .env.example .env.local   # แล้วกรอกค่าจาก Firebase Console (ดูขั้นตอนถัดไป)
npm run dev                  # รันที่ http://localhost:5173
```

### 2. ตั้งค่า Firebase project

1. ไปที่ [Firebase Console](https://console.firebase.google.com) → **Add project** → ตั้งชื่อ เช่น `sood-ngern`
2. **Build > Authentication** → Get started → เปิด provider **Google** → ใส่ support email → Save
3. **Build > Firestore Database** → Create database → เลือก production mode → เลือก region (เช่น `asia-southeast1`)
4. **Project settings (⚙) > General** → เลื่อนลงหา "Your apps" → กด **Web** → ตั้งชื่อแอป → จะได้ `firebaseConfig` เอาค่าไปใส่ใน `.env.local`:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

5. แก้ `.firebaserc` ให้ `default` เป็น project id จริงของคุณ

### 3. Firestore data model

```
users/{uid}/transactions/{txId}
  type: "income" | "expense"
  amount: number
  category: string
  note: string
  date: "yyyy-mm-dd"
  createdAt: number (epoch ms)
```

ข้อมูลแยกตาม `uid` ของผู้ใช้แต่ละคน — คนอื่นมองไม่เห็นข้อมูลกัน กติกานี้ถูกบังคับด้วย `firestore.rules`
ที่มีมาให้แล้ว (อนุญาตเฉพาะเจ้าของ `uid` เท่านั้น) ให้ deploy rules ก่อนใช้งานจริง:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 4. รัน local dev + ทดสอบ Google login

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:5173` — หน้าจอ Login จะขึ้นปุ่ม "เข้าสู่ระบบด้วย Google"
กดแล้วจะเด้ง popup ของ Google ให้เลือกบัญชี เมื่อล็อกอินสำเร็จจะเข้าแอพหลักทันที
(ต้องตั้งค่า **authorized domains** ใน Firebase Auth ให้รวม `localhost` ซึ่งปกติมีให้อยู่แล้ว)

### 5. Deploy ขึ้น Firebase Hosting (manual)

```bash
npm run build
firebase deploy --only hosting
```

จะได้ URL แบบ `https://<your-project-id>.web.app` — อย่าลืมเพิ่มโดเมนนี้ใน
**Authentication > Settings > Authorized domains** มิฉะนั้น Google login จะ error บน production

### 6. Auto-deploy ด้วย GitHub Actions (CI/CD)

Workflow อยู่ที่ `.github/workflows/deploy.yml` — จะ build + deploy ให้อัตโนมัติทุกครั้งที่ push เข้า `main`

ต้องตั้งค่า **GitHub Secrets** ก่อน (Settings > Secrets and variables > Actions > New repository secret):

| Secret name | ค่า |
|---|---|
| `VITE_FIREBASE_API_KEY` ฯลฯ (6 ตัว) | ค่าเดียวกับใน `.env.local` |
| `FIREBASE_SERVICE_ACCOUNT` | JSON key จาก Firebase Console > Project settings > Service accounts > Generate new private key |

แล้วแก้ `projectId: your-firebase-project-id` ใน `deploy.yml` ให้เป็น project id จริง
หลังจากนั้น push โค้ดเข้า `main` ทีไร GitHub Actions จะ build แล้ว deploy ให้อัตโนมัติ

---

## 📜 Available Scripts

| คำสั่ง | คำอธิบาย |
|---|---|
| `npm run dev` | รัน dev server (Vite) |
| `npm run build` | ตรวจสอบ type (`tsc -b`) แล้ว build production |
| `npm run preview` | ดูตัวอย่าง production build ในเครื่อง |
| `npm run lint` | ตรวจสอบโค้ดด้วย ESLint |

---

## 🔒 ความปลอดภัย

- ข้อมูลผู้ใช้แต่ละคนถูกแยกด้วย `uid` และบังคับใช้ผ่าน `firestore.rules`
- ดูรายละเอียดการวิเคราะห์ rules เพิ่มเติมได้ที่ [`.firestore-rules-analysis.md`](./.firestore-rules-analysis.md)
- ห้าม commit ไฟล์ `.env.local` หรือ Firebase service account key เข้า repository

---

## 🤝 Contributing

หากต้องการมีส่วนร่วมพัฒนาโปรเจกต์นี้ สามารถ fork แล้วเปิด Pull Request ได้เลย

## 📄 License

โปรเจกต์นี้ยังไม่ได้ระบุ License — โปรดติดต่อเจ้าของ repository หากต้องการนำไปใช้งานต่อ
