# GitHub Pages + Cloudflare Worker (Flash Receiver Lookup)

โซลูชันนี้ให้หน้าเว็บ **แบบ static** บน GitHub Pages โดยไม่มีช่องกรอกบัญชี/รหัสผ่าน
และใช้ **Cloudflare Worker** เป็นแบ็กเอนด์ส่วนตัวเก็บรหัสไว้เป็น Secrets

> อ้างอิงโค้ดต้นฉบับสำหรับเรียก Flash API จากไฟล์ `location2.py` ของคุณ (คลาส `FH`, เส้นทาง API, โฟลว์ login → address) fileciteturn2file0

## โฟลเดอร์
- `pages/` — ไฟล์สำหรับ GitHub Pages (`index.html`)
- `worker/` — โค้ด Cloudflare Worker (`worker.js`, `wrangler.toml`)

## ติดตั้ง / ดีพลอย

### 1) ดีพลอย Cloudflare Worker
- ติดตั้ง wrangler: https://developers.cloudflare.com/workers/wrangler/install-and-update/
- ล็อกอิน: `wrangler login`
- เข้าโฟลเดอร์ `worker/` แล้วตั้ง secrets:
  ```bash
  wrangler secret put FLASH_USER
  wrangler secret put FLASH_PASS
  ```
- ดีพลอย:
  ```bash
  wrangler deploy
  ```
- ได้ URL ประมาณ `https://<your-worker-subdomain>.workers.dev`

### 2) ตั้งค่า GitHub Pages
- สร้าง repo แล้วโฟลเดอร์ `pages/` เป็นรากของไซต์ (หรือย้ายไฟล์ใน `pages/` ไปไว้ราก repo)
- แก้ `pages/index.html` บรรทัด:
  ```js
  const WORKER_URL = 'https://<your-worker-subdomain>.workers.dev';
  ```
  ใส่ URL ที่ได้จากขั้นตอน Worker
- เปิด GitHub Pages (Settings → Pages) ให้เสิร์ฟจาก branch ที่มีไฟล์ `index.html`

### ใช้งาน
- เปิดหน้าเว็บบน GitHub Pages
- ใส่เบอร์โทร แล้วกด "ค้นหา" — หน้าเว็บจะเรียก Worker ของคุณเพื่อดึงผลลัพธ์จาก Flash API

## หมายเหตุสำคัญ
- **อย่าฝังรหัส** ลงในหน้าเว็บ/รีโปโดยตรง ให้เก็บไว้ที่ Worker Secrets เท่านั้น
- การเรียกใช้งาน Flash API และข้อมูลผู้รับอาจมีข้อกำหนดด้าน **ข้อตกลงการใช้งาน / ความเป็นส่วนตัว** ตรวจสอบให้ถูกต้องก่อนใช้งานจริง
- โค้ด Worker นี้แปลงลอจิกจากสคริปต์ Python ให้เป็น JS บน Edge (login → เรียก `/address/...`) เพื่อให้ใช้งานได้โดยไม่มีฟอร์มรหัสผ่านบนหน้าเว็บ

โชคดีครับ 🎯
