#!/bin/bash

# VPS DNS 설정 스크립트
# VPS 서버(141.164.60.51)에서 실행하세요
# Usage: ssh root@141.164.60.51 'bash -s' < setup-vps-dns.sh

set -e

DOMAIN="one-q.xyz"
SUBDOMAIN="saju-naming"
FULL_DOMAIN="saju-naming.one-q.xyz"
VPS_IP="141.164.60.51"

echo "🚀 VPS DNS 설정 시작..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "도메인: $FULL_DOMAIN"
echo "VPS IP: $VPS_IP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# OS 확인
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo "📋 OS: $PRETTY_NAME"
else
    echo "❌ OS를 확인할 수 없습니다."
    exit 1
fi

# DNS 서버 확인
echo ""
echo "🔍 DNS 서버 확인 중..."

if systemctl is-active --quiet named; then
    DNS_SERVER="bind"
    echo "✅ BIND9 DNS 서버 감지"
elif systemctl is-active --quiet bind9; then
    DNS_SERVER="bind"
    echo "✅ BIND9 DNS 서버 감지"
elif systemctl is-active --quiet dnsmasq; then
    DNS_SERVER="dnsmasq"
    echo "✅ dnsmasq DNS 서버 감지"
else
    echo "⚠️  DNS 서버가 설치되어 있지 않습니다."
    echo ""
    read -p "DNS 서버를 설치하시겠습니까? (BIND9) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 BIND9 설치 중..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            apt-get update
            apt-get install -y bind9 bind9utils bind9-doc
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
            dnf install -y bind bind-utils
        else
            echo "❌ 지원하지 않는 OS입니다."
            exit 1
        fi
        DNS_SERVER="bind"
        echo "✅ BIND9 설치 완료"
    else
        echo "❌ DNS 서버 설치가 취소되었습니다."
        echo ""
        echo "💡 대안: DNS 제공업체(Cloudflare, Route53 등)에서 A 레코드를 추가하세요."
        echo "   Type: A"
        echo "   Name: saju-naming"
        echo "   Value: $VPS_IP"
        exit 0
    fi
fi

# BIND9 설정
if [ "$DNS_SERVER" = "bind" ]; then
    echo ""
    echo "⚙️  BIND9 설정 중..."

    # Zone 파일 경로 확인
    if [ -d "/etc/bind" ]; then
        BIND_DIR="/etc/bind"
        ZONES_DIR="/etc/bind/zones"
    elif [ -d "/etc/named" ]; then
        BIND_DIR="/etc/named"
        ZONES_DIR="/var/named"
    else
        echo "❌ BIND 설정 디렉토리를 찾을 수 없습니다."
        exit 1
    fi

    echo "📁 BIND 디렉토리: $BIND_DIR"

    # zones 디렉토리 생성
    mkdir -p "$ZONES_DIR"

    # Zone 파일이 있는지 확인
    ZONE_FILE="$ZONES_DIR/db.$DOMAIN"

    if [ ! -f "$ZONE_FILE" ]; then
        echo "📝 Zone 파일 생성: $ZONE_FILE"

        # Zone 파일 생성
        cat > "$ZONE_FILE" << EOF
\$TTL    3600
@       IN      SOA     ns1.$DOMAIN. admin.$DOMAIN. (
                        $(date +%Y%m%d%H) ; Serial
                        3600              ; Refresh
                        1800              ; Retry
                        604800            ; Expire
                        3600 )            ; Negative Cache TTL
;
@       IN      NS      ns1.$DOMAIN.
@       IN      A       $VPS_IP
ns1     IN      A       $VPS_IP
$SUBDOMAIN IN   A       $VPS_IP
www     IN      A       $VPS_IP
EOF

        echo "✅ Zone 파일 생성 완료"
    else
        echo "📝 기존 Zone 파일 발견: $ZONE_FILE"

        # A 레코드가 있는지 확인
        if grep -q "^$SUBDOMAIN" "$ZONE_FILE"; then
            echo "⚠️  $SUBDOMAIN A 레코드가 이미 존재합니다."
            echo "   기존 레코드 업데이트..."
            sed -i.bak "s/^$SUBDOMAIN.*/$SUBDOMAIN IN   A       $VPS_IP/" "$ZONE_FILE"
        else
            echo "➕ $SUBDOMAIN A 레코드 추가..."
            # Serial 번호 증가
            SERIAL=$(date +%Y%m%d%H)
            sed -i.bak "s/[0-9]\{10,\} ; Serial/$SERIAL ; Serial/" "$ZONE_FILE"
            # A 레코드 추가
            echo "$SUBDOMAIN IN   A       $VPS_IP" >> "$ZONE_FILE"
        fi
        echo "✅ A 레코드 추가/업데이트 완료"
    fi

    # named.conf 설정 확인
    if [ -f "$BIND_DIR/named.conf.local" ]; then
        NAMED_CONF="$BIND_DIR/named.conf.local"
    elif [ -f "$BIND_DIR/named.conf" ]; then
        NAMED_CONF="$BIND_DIR/named.conf"
    else
        echo "❌ named.conf를 찾을 수 없습니다."
        exit 1
    fi

    # Zone 설정이 있는지 확인
    if ! grep -q "zone \"$DOMAIN\"" "$NAMED_CONF"; then
        echo "📝 named.conf에 zone 추가..."
        cat >> "$NAMED_CONF" << EOF

zone "$DOMAIN" {
    type master;
    file "$ZONE_FILE";
    allow-transfer { any; };
};
EOF
        echo "✅ Zone 설정 추가 완료"
    else
        echo "✅ Zone 설정이 이미 존재합니다."
    fi

    # 설정 검증
    echo ""
    echo "🔍 BIND 설정 검증 중..."
    if command -v named-checkconf &> /dev/null; then
        if named-checkconf "$NAMED_CONF"; then
            echo "✅ named.conf 검증 성공"
        else
            echo "❌ named.conf 검증 실패"
            exit 1
        fi
    fi

    if command -v named-checkzone &> /dev/null; then
        if named-checkzone "$DOMAIN" "$ZONE_FILE"; then
            echo "✅ Zone 파일 검증 성공"
        else
            echo "❌ Zone 파일 검증 실패"
            exit 1
        fi
    fi

    # BIND 재시작
    echo ""
    echo "🔄 BIND 서비스 재시작..."
    if systemctl restart named 2>/dev/null || systemctl restart bind9 2>/dev/null; then
        echo "✅ BIND 서비스 재시작 완료"
    else
        echo "❌ BIND 서비스 재시작 실패"
        exit 1
    fi

    # 서비스 활성화
    systemctl enable named 2>/dev/null || systemctl enable bind9 2>/dev/null

fi

# 방화벽 설정
echo ""
echo "🔒 방화벽 설정 확인..."

if systemctl is-active --quiet firewalld; then
    echo "🔥 Firewalld 감지"
    firewall-cmd --permanent --add-service=dns 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo "✅ DNS 포트 열림 (53/tcp, 53/udp)"
elif command -v ufw &> /dev/null; then
    echo "🔥 UFW 감지"
    ufw allow 53/tcp 2>/dev/null || true
    ufw allow 53/udp 2>/dev/null || true
    echo "✅ DNS 포트 열림 (53/tcp, 53/udp)"
else
    echo "⚠️  방화벽이 감지되지 않았습니다. 필요시 수동으로 포트 53을 여세요."
fi

# DNS 테스트
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 DNS 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v dig &> /dev/null; then
    echo "🔍 로컬 DNS 조회 (dig @localhost):"
    dig @localhost "$FULL_DOMAIN" +short || echo "⚠️  아직 응답 없음"
elif command -v nslookup &> /dev/null; then
    echo "🔍 로컬 DNS 조회 (nslookup):"
    nslookup "$FULL_DOMAIN" localhost || echo "⚠️  아직 응답 없음"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DNS 설정 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 설정 정보:"
echo "   도메인: $FULL_DOMAIN"
echo "   IP: $VPS_IP"
echo "   DNS 서버: $DNS_SERVER"
echo ""
echo "📝 다음 단계:"
echo "   1. 도메인 등록업체에서 네임서버 설정:"
echo "      - NS1: ns1.$DOMAIN (또는 $VPS_IP)"
echo "      - NS2: (선택사항)"
echo ""
echo "   2. DNS 전파 대기 (1-48시간)"
echo ""
echo "   3. DNS 전파 확인:"
echo "      dig $FULL_DOMAIN"
echo "      nslookup $FULL_DOMAIN"
echo ""
echo "🔗 Zone 파일 경로: $ZONE_FILE"
echo "🔗 BIND 설정: $NAMED_CONF"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
