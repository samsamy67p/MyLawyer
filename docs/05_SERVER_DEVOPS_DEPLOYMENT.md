# دليل إدارة الخادم والعمليات والنشر (DevOps, Server & Deployment Guide)

**خادم الإنتاج:** Contabo VPS (`13.140.141.32`)  
**نظام التشغيل:** Ubuntu 24.04 LTS (x86_64)  
**معمارية الخادم:** AMD EPYC 4 vCPUs, 8GB RAM, 75GB NVMe  
**موقع الاستضافة الجغرافي:** Frankfurt, Germany  

---

## 1. مخطط هيكل المجلدات على السيرفر (`/var/www/mylawyer`)

```
/var/www/mylawyer/
├── current -> /var/www/mylawyer/releases/20261030_175230/   # رابط رمزي ذري للإصدار النشط
├── releases/                                                # مجلد الإصدارات السابقة (يُحتفظ بآخر 5 إصدارات)
│   ├── 20261030_160000/
│   └── 20261030_175230/
├── backend/                                                 # بيئة تشغيل الباك إند الحية
│   ├── dist/
│   ├── node_modules/
│   ├── package.json
│   └── .env
├── storage/                                                 # مجلد التخزين الدائم (مشترك بين كل الإصدارات)
│   ├── public/avatars/                                      # صور البروفايل العامة
│   └── private_docs/                                        # كارنيهات المحامين المعزولة
├── deploy.sh                                                # سكربت النشر الذري دون انقطاع
├── rollback.sh                                              # سكربت التراجع التلقائي السريع
└── backups/                                                 # مجلد النسخ الاحتياطية اليومية للقاعدة والملفات
```

---

## 2. إعدادات خادم الويب Nginx (`/etc/nginx/sites-available/mylawyer`)

```nginx
# تكوين Nginx لموقع MyLawyer والواجهات البرمجية
server {
    listen 80;
    listen [::]:80;
    server_name 13.140.141.32;

    client_max_body_size 12M;

    # 1. خدمة الواجهة الأمامية المستقرة (SPA)
    location / {
        root /var/www/mylawyer/current;
        index index.html;
        try_files $uri $uri/ /index.html;

        # التخزين المؤقت للأصول المجمعة
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }

    # 2. توجيه استدعاءات الـ API إلى خادم Fastify
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }

    # 3. توجيه استدعاءات الخرائط إلى محرك OSRM المحلي
    location /route/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 4. خدمة صور البروفايل العامة
    location /uploads/avatars/ {
        alias /var/www/mylawyer/storage/public/avatars/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # 5. حماية المستندات والوثائق الخاصة من الوصول المباشر
    location /storage/private_docs/ {
        internal;
        return 403;
    }
}
```

---

## 3. إدارة الخدمات عبر Systemd (`systemctl`)

### 3.1 خدمة الباك إند (`/etc/systemd/system/mylawyer-backend.service`):
```ini
[Unit]
Description=MyLawyer Fastify Backend Production Service
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/mylawyer/backend
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=4000

[Install]
WantedBy=multi-user.target
```

### أوامر التحكم السريع:
```bash
# تشغيل أو إعادة تشغيل خدمة الباك إند
systemctl restart mylawyer-backend

# فحص حالة الخدمة وسجل الأخطاء
systemctl status mylawyer-backend
journalctl -u mylawyer-backend -f -n 50
```

---

## 4. سكربت النشر الذري دون انقطاع (`/var/www/mylawyer/deploy.sh`)

```bash
#!/usr/bin/env bash
set -e

RELEASE_ID=$(date +%Y%m%d_%H%M%S)
BASE_DIR="/var/www/mylawyer"
TARGET_DIR="$BASE_DIR/releases/$RELEASE_ID"

echo "[DEPLOY] Starting atomic deployment release $RELEASE_ID..."

# 1. إنشاء مجلد الإصدار الجديد
mkdir -p "$TARGET_DIR"

# 2. فك حزمة الواجهة الأمامية
tar -xzf /tmp/mylawyer-build.tar.gz -C "$TARGET_DIR"

# 3. التحقق المسبق من وجود index.html
if [ ! -f "$TARGET_DIR/index.html" ]; then
    echo "[ERROR] index.html missing from artifact! Aborting."
    rm -rf "$TARGET_DIR"
    exit 1
fi

# 4. تحديث الباك إند إن وُجد أرشيف جديد
if [ -f /tmp/mylawyer-backend.tar.gz ]; then
    echo "[DEPLOY] Updating backend build..."
    tar -xzf /tmp/mylawyer-backend.tar.gz -C "$BASE_DIR/backend"
    systemctl restart mylawyer-backend
fi

# 5. التبديل الذري عبر الروابط الرمزية (Atomic Symlink Switch)
ln -sfn "$TARGET_DIR" "$BASE_DIR/current_tmp"
mv -Tf "$BASE_DIR/current_tmp" "$BASE_DIR/current"

# 6. إعادة تحميل Nginx بنعومة (Graceful Reload)
systemctl reload nginx

# 7. تنظيف الإصدارات القديمة والإبقاء على آخر 5 إصدارات فقط
cd "$BASE_DIR/releases"
ls -1dt */ | tail -n +6 | xargs -r rm -rf

echo "[DEPLOY] Atomic deployment completed successfully!"
```

---

## 5. خطة النسخ الاحتياطي والاستعادة في حالات الطوارئ (Disaster Recovery & Backup)

### 5.1 سكربت النسخ الاحتياطي اليومي المجدول عبر Cron (`/root/backup_mylawyer.sh`):
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/www/mylawyer/backups"
mkdir -p "$BACKUP_DIR"

# 1. تصدير قاعدة بيانات PostgreSQL مشفرة ومضغوطة
pg_dump -U mylawyer_user -d mylawyer_prod -F c -b -v -f "$BACKUP_DIR/db_$DATE.dump"

# 2. أرشفة ملفات ومستندات التخزين
tar -czf "$BACKUP_DIR/storage_$DATE.tar.gz" -C /var/www/mylawyer/storage .

# 3. حذف النسخ الأقدم من 14 يوماً لتوفير المساحة
find "$BACKUP_DIR" -type f -mtime +14 -delete
```

### 5.2 أمر استعادة قاعدة البيانات في الطوارئ:
```bash
pg_restore -U mylawyer_user -d mylawyer_prod -v -c /var/www/mylawyer/backups/db_YYYYMMDD_HHMMSS.dump
```

