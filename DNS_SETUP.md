# DNS 설정 가이드

## 🌐 도메인 정보
- **도메인**: `one-q.xyz`
- **서브도메인**: `saju-naming.one-q.xyz`
- **VPS IP**: `141.164.60.51`

## 📋 DNS A 레코드 설정

### 설정할 레코드
```
Type: A
Name: saju-naming
Value: 141.164.60.51
TTL: 3600 (1 hour) 또는 Auto
```

---

## DNS 제공업체별 설정 방법

### 1️⃣ Cloudflare

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com 로그인
   - `one-q.xyz` 도메인 선택

2. **DNS 레코드 추가**
   - 좌측 메뉴에서 **DNS** → **Records** 클릭
   - **Add record** 버튼 클릭

3. **레코드 정보 입력**
   ```
   Type: A
   Name: saju-naming
   IPv4 address: 141.164.60.51
   Proxy status: DNS only (회색 구름 아이콘)
   TTL: Auto
   ```

4. **Save** 클릭

5. **프록시 설정 (선택)**
   - 프록시 활성화 (주황색 구름): Cloudflare CDN 사용
   - 프록시 비활성화 (회색 구름): 직접 연결

---

### 2️⃣ AWS Route53

1. **Route53 Console 접속**
   - AWS Console → Route53 → Hosted zones
   - `one-q.xyz` zone 선택

2. **Create record** 클릭

3. **레코드 정보 입력**
   ```
   Record name: saju-naming
   Record type: A
   Value: 141.164.60.51
   TTL: 300 (5분) 또는 3600 (1시간)
   Routing policy: Simple routing
   ```

4. **Create records** 클릭

---

### 3️⃣ GoDaddy

1. **GoDaddy 계정 로그인**
   - https://dcc.godaddy.com/domains

2. **도메인 관리**
   - `one-q.xyz` 옆의 **DNS** 버튼 클릭

3. **레코드 추가**
   - DNS Management 페이지에서 **Add** 클릭

4. **레코드 정보 입력**
   ```
   Type: A
   Host: saju-naming
   Points to: 141.164.60.51
   TTL: 1 Hour (Custom 가능)
   ```

5. **Save** 클릭

---

### 4️⃣ Namecheap

1. **Namecheap 로그인**
   - https://www.namecheap.com/myaccount/login

2. **Domain List**
   - Dashboard → Domain List
   - `one-q.xyz` 옆의 **Manage** 클릭

3. **Advanced DNS**
   - **Advanced DNS** 탭 클릭
   - **Add New Record** 클릭

4. **레코드 정보 입력**
   ```
   Type: A Record
   Host: saju-naming
   Value: 141.164.60.51
   TTL: Automatic
   ```

5. **Save All Changes** 클릭

---

### 5️⃣ 가비아 (Gabia)

1. **가비아 로그인**
   - https://www.gabia.com 로그인

2. **My가비아 → 서비스 관리**
   - 도메인 → `one-q.xyz` 관리

3. **DNS 정보**
   - **DNS 관리** 클릭
   - **레코드 추가** 클릭

4. **레코드 정보 입력**
   ```
   타입: A
   호스트: saju-naming
   값/위치: 141.164.60.51
   TTL: 3600
   ```

5. **확인** 클릭

---

### 6️⃣ Cafe24

1. **Cafe24 로그인**
   - https://www.cafe24.com 로그인

2. **나의 서비스 관리**
   - 도메인 관리 → `one-q.xyz`

3. **DNS 설정**
   - **네임서버 설정** → **DNS 레코드 관리**

4. **레코드 추가**
   ```
   레코드 타입: A
   호스트명: saju-naming
   값: 141.164.60.51
   TTL: 3600
   ```

5. **저장** 클릭

---

## 🔍 DNS 전파 확인

### 1. 명령줄에서 확인
```bash
# nslookup 사용
nslookup saju-naming.one-q.xyz

# dig 사용 (macOS/Linux)
dig saju-naming.one-q.xyz

# 특정 DNS 서버로 확인 (Google DNS)
dig @8.8.8.8 saju-naming.one-q.xyz
```

### 2. 온라인 도구 사용
- https://dnschecker.org
- https://www.whatsmydns.net
- https://mxtoolbox.com/DNSLookup.aspx

입력: `saju-naming.one-q.xyz`

---

## ⏱️ DNS 전파 시간

- **일반적인 전파 시간**: 5분 ~ 48시간
- **평균 전파 시간**: 1 ~ 4시간
- **TTL 설정에 따라 변동**: 낮은 TTL = 빠른 전파

---

## ✅ 설정 확인 체크리스트

- [ ] DNS 제공업체 로그인
- [ ] A 레코드 추가 (saju-naming → 141.164.60.51)
- [ ] 레코드 저장 완료
- [ ] DNS 전파 확인 (nslookup 또는 온라인 도구)
- [ ] VPS 서버 방화벽 설정 (포트 80, 443 열림)
- [ ] Nginx 설정 업데이트 (도메인 적용)
- [ ] SSL 인증서 발급 (Let's Encrypt)

---

## 🔒 SSL 인증서 발급 (DNS 설정 후)

DNS 전파가 완료되면 VPS 서버에서 실행:

```bash
# Certbot 설치 (RHEL/CentOS/Fedora)
sudo dnf install -y certbot python3-certbot-nginx

# 또는 Ubuntu/Debian
sudo apt-get install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d saju-naming.one-q.xyz

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

---

## 🌍 Nginx 설정 예시

```nginx
# /etc/nginx/conf.d/saju.conf
server {
    listen 80;
    server_name saju-naming.one-q.xyz;

    # HTTP to HTTPS 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name saju-naming.one-q.xyz;

    # SSL 인증서 (certbot이 자동으로 추가)
    ssl_certificate /etc/letsencrypt/live/saju-naming.one-q.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/saju-naming.one-q.xyz/privkey.pem;

    # 프록시 설정
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🆘 문제 해결

### DNS가 전파되지 않는 경우
```bash
# DNS 캐시 초기화 (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# DNS 캐시 초기화 (Windows)
ipconfig /flushdns

# DNS 캐시 초기화 (Linux)
sudo systemd-resolve --flush-caches
```

### 특정 DNS 서버로 테스트
```bash
# Google DNS
dig @8.8.8.8 saju-naming.one-q.xyz

# Cloudflare DNS
dig @1.1.1.1 saju-naming.one-q.xyz

# OpenDNS
dig @208.67.222.222 saju-naming.one-q.xyz
```

### TTL 확인
```bash
dig saju-naming.one-q.xyz | grep TTL
```

---

## 📞 DNS 제공업체 지원 연락처

- **Cloudflare**: https://support.cloudflare.com
- **AWS Route53**: AWS Support Console
- **GoDaddy**: https://www.godaddy.com/help
- **Namecheap**: https://www.namecheap.com/support
- **가비아**: 1544-4755
- **Cafe24**: 1544-7775
