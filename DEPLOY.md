# Deploy to Vercel (quick trial)

รันได้ฟรีบน Vercel + Neon (Postgres serverless). ทำตามขั้นตอน 10-15 นาที.

## ข้อจำกัดที่ต้องทราบ

| เรื่อง | สถานะบน Vercel |
|-------|--------------------|
| Auth, CRM, Cases, Invoices, LINE chat | ✅ ใช้งานได้ |
| อัปโหลดเอกสาร (Document upload) | ⚠️ ไฟล์เก็บใน `/tmp` ของ Vercel function — **ไม่ persist** ระหว่าง cold start. เหมาะสำหรับลองเล่นเท่านั้น; production ให้เปลี่ยนไปใช้ Vercel Blob / S3 |
| PWA install | ✅ |
| Service worker | ✅ (Vercel serve HTTPS อัตโนมัติ) |

---

## 1. เตรียม Postgres ที่ Neon (ฟรี)

1. สมัคร https://neon.tech → "Create project"
2. เลือก Region ใกล้ที่สุด (Singapore แนะนำถ้าอยู่ไทย)
3. คัดลอก **Pooled connection string** — จะได้ URL แบบ
   ```
   postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
   ```

## 2. เตรียม LINE Channel (ถ้าจะใช้แชท)

1. ไป https://developers.line.biz/console/ → Providers → สร้าง Messaging API channel
2. จด **Channel secret** + **Channel access token**
3. *(ยังไม่ต้องตั้ง Webhook URL — ตั้งหลัง deploy)*

## 3. Import project เข้า Vercel

1. Login https://vercel.com ด้วย GitHub
2. "Add New..." → "Project" → เลือก `JiramedFirst/LoveBridge`
3. Framework preset: **Next.js** (auto)
4. Branch: `claude/visa-marriage-management-VtnBe`

## 4. ใส่ Environment Variables

กดปุ่ม "Environment Variables" ใน Vercel setup screen, ใส่:

| ชื่อ | ค่า |
|------|------|
| `DATABASE_URL` | connection string จาก Neon (ขั้นตอนที่ 1) |
| `NEXTAUTH_SECRET` | รันบนเครื่อง `openssl rand -base64 32` แล้ววาง |
| `NEXTAUTH_URL` | `https://<your-project>.vercel.app` (ใส่หลัง Vercel สร้าง URL) |
| `AUTH_TRUST_HOST` | `true` |
| `LINE_CHANNEL_SECRET` | จาก LINE console (ว่างไว้ได้ถ้าไม่ใช้) |
| `LINE_CHANNEL_ACCESS_TOKEN` | จาก LINE console (ว่างไว้ได้ถ้าไม่ใช้) |

> ตอนแรกยังไม่รู้ URL ใส่ `NEXTAUTH_URL=https://placeholder.vercel.app` ก่อนก็ได้ แล้วแก้หลัง deploy

## 5. Deploy

กด "Deploy" → Vercel จะ build เอง (ครั้งแรกประมาณ 2-3 นาที)

## 6. Migrate + Seed database

หลัง deploy แรกเสร็จ, บนเครื่อง local:

```bash
# ใช้ DATABASE_URL จาก Neon เดียวกัน
export DATABASE_URL="postgresql://..."

npx prisma migrate deploy
npx prisma db seed
```

Seed จะสร้าง user:
- `admin@lovebridge.local` / `admin1234`
- `staff@lovebridge.local` / `staff1234`

## 7. แก้ NEXTAUTH_URL (ถ้ายังไม่ใส่จริง)

Vercel → Project → Settings → Environment Variables → แก้ `NEXTAUTH_URL` เป็น URL จริงที่ Vercel ให้มา (เช่น `https://love-bridge-abc123.vercel.app`) → Redeploy

## 8. ตั้ง LINE Webhook (ถ้าใช้)

LINE Developers Console → Messaging API → Webhook URL =
```
https://<your-project>.vercel.app/api/line/webhook
```
เปิด "Use webhook" + ปิด "Auto-reply messages" → "Verify"

## 9. ลองใช้งาน

เปิด `https://<your-project>.vercel.app/th/login` → login → ลองฟีเจอร์ทั้งหมด

### ติดตั้ง PWA

- **Desktop Chrome**: คลิกไอคอน install ใน address bar
- **Android Chrome**: menu → "Add to Home screen"
- **iOS Safari**: Share → "Add to Home Screen"

---

## ถ้าอัปโหลดเอกสารพังบน Vercel

เพราะ Vercel serverless มี read-only filesystem. แก้ได้สองวิธี:

**A. ใช้ Vercel Blob (แนะนำ production):**
```bash
npm install @vercel/blob
```
จากนั้นดูตัวอย่างแทน `saveFile/readFile` ใน `lib/storage.ts` ด้วย `@vercel/blob` API

**B. ต่อ S3/R2/MinIO** ผ่าน `@aws-sdk/client-s3` — abstraction layer มีอยู่แล้วใน `lib/storage.ts`

---

## ทางเลือก: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Vercel จะถาม env vars แบบ interactive.
