#!/bin/bash

# SQLite 백업 스크립트
# 사용법: ./scripts/backup-sqlite.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 경로 설정
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DB_PATH="${PROJECT_ROOT}/prisma/dev.db"
BACKUP_DIR="${PROJECT_ROOT}/prisma/backups"

# 백업 디렉토리 생성
mkdir -p "${BACKUP_DIR}"

# 타임스탬프
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DATESTAMP=$(date +%Y%m%d)

echo -e "${GREEN}=== SQLite 백업 시작 ===${NC}"
echo "원본 DB: ${DB_PATH}"
echo "백업 위치: ${BACKUP_DIR}"

# DB 파일 존재 확인
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}오류: SQLite 데이터베이스를 찾을 수 없습니다: ${DB_PATH}${NC}"
    exit 1
fi

# 원본 파일 크기
ORIGINAL_SIZE=$(ls -lh "${DB_PATH}" | awk '{print $5}')
echo "원본 크기: ${ORIGINAL_SIZE}"

# 백업 1: SQLite .backup 명령 사용
echo -e "\n${YELLOW}백업 1: SQLite .backup 명령${NC}"
BACKUP1="${BACKUP_DIR}/backup-${TIMESTAMP}.db"
sqlite3 "${DB_PATH}" ".backup '${BACKUP1}'"
echo -e "${GREEN}✓${NC} ${BACKUP1} 생성 완료"

# 백업 2: tar.gz 압축
echo -e "\n${YELLOW}백업 2: tar.gz 압축${NC}"
BACKUP2="${BACKUP_DIR}/backup-full-${DATESTAMP}.tar.gz"
tar -czf "${BACKUP2}" -C "${PROJECT_ROOT}/prisma" dev.db
echo -e "${GREEN}✓${NC} ${BACKUP2} 생성 완료 ($(ls -lh "${BACKUP2}" | awk '{print $5}'))"

# 백업 3: 원본 복사
echo -e "\n${YELLOW}백업 3: 원본 파일 복사${NC}"
BACKUP3="${BACKUP_DIR}/backup-raw-${TIMESTAMP}.db"
cp "${DB_PATH}" "${BACKUP3}"
echo -e "${GREEN}✓${NC} ${BACKUP3} 생성 완료"

# 체크섬 생성
echo -e "\n${YELLOW}체크섬 생성 중...${NC}"
CHECKSUM_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.sha256"
cd "${PROJECT_ROOT}/prisma"
shasum -a 256 dev.db > "${CHECKSUM_FILE}"
shasum -a 256 "backups/backup-${TIMESTAMP}.db" >> "${CHECKSUM_FILE}"
shasum -a 256 "backups/backup-raw-${TIMESTAMP}.db" >> "${CHECKSUM_FILE}"
echo -e "${GREEN}✓${NC} 체크섬 파일 생성: ${CHECKSUM_FILE}"

# 백업 검증
echo -e "\n${YELLOW}백업 무결성 검증 중...${NC}"
cd "${PROJECT_ROOT}/prisma"
if shasum -a 256 -c "${CHECKSUM_FILE}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 체크섬 검증 통과"
else
    echo -e "${RED}✗ 체크섬 검증 실패${NC}"
    exit 1
fi

# SQLite 무결성 검사
echo -e "\n${YELLOW}SQLite 무결성 검사 중...${NC}"
if sqlite3 "${BACKUP1}" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo -e "${GREEN}✓${NC} SQLite 백업 무결성 검사 통과"
else
    echo -e "${RED}✗ SQLite 백업 무결성 검사 실패${NC}"
    exit 1
fi

# 테이블 수 확인
TABLE_COUNT_ORIGINAL=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
TABLE_COUNT_BACKUP=$(sqlite3 "${BACKUP1}" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")

if [ "${TABLE_COUNT_ORIGINAL}" -eq "${TABLE_COUNT_BACKUP}" ]; then
    echo -e "${GREEN}✓${NC} 테이블 수 일치: ${TABLE_COUNT_ORIGINAL}개"
else
    echo -e "${RED}✗ 테이블 수 불일치 - 원본: ${TABLE_COUNT_ORIGINAL}, 백업: ${TABLE_COUNT_BACKUP}${NC}"
    exit 1
fi

# 오래된 백업 정리 (30일 이상)
echo -e "\n${YELLOW}오래된 백업 정리 중...${NC}"
find "${BACKUP_DIR}" -name "backup-*.db" -mtime +30 -delete
find "${BACKUP_DIR}" -name "backup-*.tar.gz" -mtime +30 -delete
echo -e "${GREEN}✓${NC} 30일 이상 된 백업 파일 삭제"

# 백업 요약
echo -e "\n${GREEN}=== 백업 완료 ===${NC}"
echo "백업 위치: ${BACKUP_DIR}"
echo "생성된 백업:"
echo "  1. ${BACKUP1}"
echo "  2. ${BACKUP2}"
echo "  3. ${BACKUP3}"
echo "  4. ${CHECKSUM_FILE}"
echo ""
echo -e "${GREEN}모든 백업이 성공적으로 생성되었습니다!${NC}"
echo ""
echo "복구 방법:"
echo "  sqlite3 prisma/dev.db \".restore '${BACKUP1}'\""
echo "  또는"
echo "  tar -xzf ${BACKUP2} -C ${PROJECT_ROOT}/prisma/"