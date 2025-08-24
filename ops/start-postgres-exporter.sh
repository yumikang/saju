#!/bin/bash

# postgres_exporter 시작 스크립트
# 환경 변수 로드
source /Users/dongeuncheon/blee_project/saju/ops/prometheus/postgres_exporter.env

# postgres_exporter 실행
echo "Starting postgres_exporter on port 9187..."
export DATA_SOURCE_NAME
/Users/dongeuncheon/blee_project/saju/ops/postgres_exporter \
  --web.listen-address=":9187" \
  --web.telemetry-path="/metrics" \
  --log.level=info