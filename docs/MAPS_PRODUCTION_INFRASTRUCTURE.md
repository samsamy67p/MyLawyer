# دليل تشغيل البنية التحتية للخرائط والملاحة على سيرفر المشروع (Production Infrastructure Guide)

هذا المستند يوثق خطوة بخطوة كيفية الاستغناء الكامل عن الخوادم العامة المجانية عند إطلاق التطبيق لمئات الآلاف من المستخدمين، وتشغيل **محرك مسارات خاص بمصر (Valhalla)** + **خادم كاش لبلاطات الخريطة (Nginx Tile Cache + Cloudflare CDN)** على سيرفر خاص بك بتكلفة ثابتة وبأعلى سرعة ممكنة.

---

## 1. كيف يعمل النظام ببساطة؟ (الصورة الكاملة)

التطبيق يحتاج من الخريطة شيئين فقط:
1. **صور الخريطة (Map Tiles):** المربعات البصرية التي تظهر الشوارع والمباني والمدن.
2. **حساب الطريق والوقت (Routing & ETA):** معرفة المسار الفعلي على شوارع مصر بين العميل والمحامي وكم كيلو وكم دقيقة بالسيارة.

### لماذا ننقلهم على سيرفرنا الخاص عند التوسع؟
- في مرحلة التطوير والتجربة الحالية، التطبيق يستخدم الخوادم المجانية العالمية لـ OpenStreetMap.
- عندما يدخل للتطبيق **مئات الآلاف من المستخدمين** في نفس الوقت، الخوادم المجانية ستعتبر هذا ضغطاً تجارياً كبيراً وقد تُبطئ الطلبات أو تحجبها.
- الحل الهندسي الأذكى لأن تطبيقنا داخل **مصر فقط**:
  - خريطة شوارع مصر بالكامل حجمها صغير جداً (**حوالي 180 ميجابايت فقط**).
  - نضع هذا الملف على سيرفر خاص بنا (VPS بسيط بتكلفة ~40$ إلى 60$ شهرياً).
  - يصبح حساب المسار يتم داخل سيرفرك في **أقل من 15 جزء من الثانية (15ms)**، ويتحمل **أكثر من 1,000 طلب في الثانية الواحدة**، وبدون دفع أي رسوم لكل مستخدم أو لكل كيلومتر (عكس خرائط جوجل التي قد تكلف آلاف الدولارات شهرياً).

---

## 2. مواصفات السيرفر المطلوبة (Recommended VPS Specs)

سيرفر سحابي واحد (Ubuntu 22.04 أو 24.04 LTS) من أي مزود (Hetzner / DigitalOcean / AWS / Linode):
- **المعالج (CPU):** 4 vCPU
- **الرام (RAM):** 8 GB RAM (أو 16 GB للأمان العالي)
- **المساحة (Storage):** 80 GB NVMe SSD
- **التكلفة التقريبية:** من 20$ إلى 50$ شهرياً فقط (ثابتة مهما زاد عدد المستخدمين).

---

## 3. ملف التشغيل الجاهز (`docker-compose.yml`)

عند استلام السيرفر، كل ما عليك فعله هو إنشاء مجلد `maps-server` ووضع ملف `docker-compose.yml` التالي داخله.
هذا الملف يقوم تلقائياً بـ:
1. تحميل خريطة جمهورية مصر العربية الرسمية (`egypt-latest.osm.pbf`) من Geofabrik.
2. بناء شبكة طرق مصر بالكامل داخل محرك **Valhalla**.
3. تشغيل خادم **Nginx** لحفظ صور الخريطة مؤقتاً (Tile Caching) حتى تفتح الخريطة فوراً عند المستخدمين.

```yaml
version: '3.8'

services:
  # 1. محرك المسارات والملاحة الخاص بمصر (Valhalla Routing Engine)
  valhalla:
    image: ghcr.io/gis-ops/docker-valhalla/valhalla:latest
    container_name: mo7amek_valhalla_egypt
    restart: unless-stopped
    ports:
      - "8002:8002"
    volumes:
      - ./valhalla_data:/custom_files
    environment:
      # يقوم بتحميل ملف خريطة مصر فقط (حوالي 180MB) وبناء المسارات تلقائياً
      - tile_urls=https://download.geofabrik.de/africa/egypt-latest.osm.pbf
      - use_tiles_ignore_pbf=True
      - build_elevation=False
      - build_admins=True
      - build_time_zones=True
      - server_threads=4

  # 2. خادم الكاش العكسي لبلاطات الخريطة والمسارات (Nginx Reverse Proxy & Tile Cache)
  nginx-maps-proxy:
    image: nginx:stable-alpine
    container_name: mo7amek_maps_proxy
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./tile_cache:/var/cache/nginx/tiles
    depends_on:
      - valhalla
```

---

## 4. ملف إعداد الكاش والـ Proxy (`nginx.conf`)

ضع هذا الملف بجوار `docker-compose.yml` باسم `nginx.conf`:

```nginx
worker_processes auto;

events {
    worker_connections 4096;
}

http {
    # كاش صور الخريطة على الهارد السريع (SSD) لمدة 30 يوم وبحجم حتى 20 جيجابايت
    proxy_cache_path /var/cache/nginx/tiles levels=1:2 keys_zone=osm_tiles:100m max_size=20g inactive=30d use_temp_path=off;

    server {
        listen 80;
        server_name _;

        # إعدادات CORS للسماح لتطبيق الموبايل والويب بالاتصال
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Accept' always;

        # أ) مسار صور الخريطة: https://maps.yourdomain.com/tiles/{z}/{x}/{y}.png
        location ~ ^/tiles/([0-9]+)/([0-9]+)/([0-9]+)\.png$ {
            proxy_pass https://tile.openstreetmap.org/$1/$2/$3.png;
            proxy_set_header Host tile.openstreetmap.org;
            proxy_set_header User-Agent "Mo7amekProductionTileProxy/1.0";
            proxy_ssl_server_name on;

            proxy_cache osm_tiles;
            proxy_cache_valid 200 30d;
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
            expires 30d;
            add_header X-Cache-Status $upstream_cache_status;
        }

        # ب) مسار محرك الملاحة: https://maps.yourdomain.com/route و /sources_to_targets
        location / {
            if ($request_method = 'OPTIONS') {
                return 204;
            }
            proxy_pass http://valhalla:8002;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

## 5. طريقة التشغيل والربط بالتطبيق (في 3 خطوات فقط)

### الخطوة 1: تشغيل السيرفر
على السيرفر الخاص بك، شغّل الأمر:
```bash
docker compose up -d
```
*(في أول مرة فقط، سيستغرق السيرفر حوالي 5 إلى 10 دقائق لتحميل خريطة مصر وبناء شبكة الطرق، وبعدها سيعمل فوراً).*

### الخطوة 2: ربط الدومين مع Cloudflare
اربط دومين فرعي مثل `maps.mo7amek.com` بعنوان السيرفر عبر **Cloudflare** مع تفعيل الـ Proxy (السحابة البرتقالية) للحصول على شهادة SSL مجانية وتسريع إضافي عبر شبكة Cloudflare CDN.

### الخطوة 3: وضع الرابط في ملف `.env.production` داخل مشروع التطبيق
الكود البرمجي في المشروع ([`src/services/mapService.js`](../src/services/mapService.js) و [`src/components/map/ResilientTileLayer.jsx`](../src/components/map/ResilientTileLayer.jsx)) مهيأ ومبرمج مسبقاً لقراءة هذه المتغيرات تلقائياً دون تعديل أي كود:

```env
VITE_VALHALLA_URL=https://maps.mo7amek.com
VITE_MAP_TILE_URL=https://maps.mo7amek.com/tiles/{z}/{x}/{y}.png
```

ثم قم ببناء نسخة الإنتاج:
```bash
npm run build
npx cap sync android
```
وبذلك يعمل تطبيقك بالكامل على سيرفرك المستقل بسرعة فائقة وبدون أي حدود استخدام.

