#!/bin/bash

# DNS 전파 확인 스크립트
# Usage: ./scripts/check-dns.sh

DOMAIN="saju-naming.one-q.xyz"
EXPECTED_IP="141.164.60.51"

echo "🔍 DNS 전파 확인: $DOMAIN"
echo "🎯 예상 IP: $EXPECTED_IP"
echo ""

# nslookup 확인
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 nslookup 결과:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
nslookup $DOMAIN

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 dig 결과:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
dig $DOMAIN +short

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 여러 DNS 서버에서 확인:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Google DNS
GOOGLE_RESULT=$(dig @8.8.8.8 $DOMAIN +short | tail -1)
echo "Google DNS (8.8.8.8):     $GOOGLE_RESULT"

# Cloudflare DNS
CLOUDFLARE_RESULT=$(dig @1.1.1.1 $DOMAIN +short | tail -1)
echo "Cloudflare DNS (1.1.1.1): $CLOUDFLARE_RESULT"

# OpenDNS
OPENDNS_RESULT=$(dig @208.67.222.222 $DOMAIN +short | tail -1)
echo "OpenDNS (208.67.222.222): $OPENDNS_RESULT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 검증 결과:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# IP 비교
CURRENT_IP=$(dig $DOMAIN +short | tail -1)
if [ "$CURRENT_IP" = "$EXPECTED_IP" ]; then
    echo "✅ DNS 전파 완료! ($CURRENT_IP)"
    echo "✅ https://$DOMAIN 으로 접속 가능합니다."

    # HTTPS 접속 테스트
    echo ""
    echo "🌐 HTTPS 연결 테스트..."
    if curl -Is https://$DOMAIN | head -1 | grep "200\|301\|302" > /dev/null; then
        echo "✅ HTTPS 연결 성공!"
    else
        echo "⚠️  HTTPS 연결 실패 (SSL 인증서 미설정 또는 서버 미실행)"
    fi
else
    echo "⏳ DNS 전파 대기 중..."
    echo "   현재 IP: $CURRENT_IP"
    echo "   예상 IP: $EXPECTED_IP"
    echo ""
    echo "💡 DNS 전파는 최대 48시간 소요될 수 있습니다."
    echo "💡 평균적으로 1-4시간 내에 전파됩니다."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 유용한 링크:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 DNS Checker: https://dnschecker.org/#A/$DOMAIN"
echo "🌍 What's My DNS: https://www.whatsmydns.net/#A/$DOMAIN"
echo "🔍 MX Toolbox: https://mxtoolbox.com/SuperTool.aspx?action=a:$DOMAIN"
