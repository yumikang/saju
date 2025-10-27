#!/bin/bash

# =============================================================================
# Production Deployment Script for Saju Naming Platform
# =============================================================================
#
# 사용법: ./deploy.sh
#
# 이 스크립트는 서버에서 실행됩니다 (VPS: 141.164.60.51)
# 로컬에서 실행하지 마세요!
#
# =============================================================================

set -e  # 에러 발생 시 즉시 중단

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="saju-naming"
PROJECT_DIR="$(pwd)"
BRANCH="main"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# =============================================================================
# Pre-deployment checks
# =============================================================================

echo ""
log_info "==================================================================="
log_info "🚀 Starting deployment for ${PROJECT_NAME}"
log_info "==================================================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    log_error ".env.production file not found!"
    log_error "Please create it from .env.production.template"
    exit 1
fi

log_success "Environment file found"

# =============================================================================
# Step 1: Pull latest code
# =============================================================================

echo ""
log_info "📥 Step 1/7: Pulling latest code from ${BRANCH} branch..."
echo ""

git fetch origin
git pull origin ${BRANCH}

if [ $? -eq 0 ]; then
    log_success "Code pulled successfully"
else
    log_error "Failed to pull code"
    exit 1
fi

# =============================================================================
# Step 2: Install dependencies
# =============================================================================

echo ""
log_info "📦 Step 2/7: Installing dependencies..."
echo ""

npm ci

if [ $? -eq 0 ]; then
    log_success "Dependencies installed"
else
    log_error "Failed to install dependencies"
    exit 1
fi

# =============================================================================
# Step 3: Database backup (production safety)
# =============================================================================

echo ""
log_info "💾 Step 3/7: Creating database backup..."
echo ""

BACKUP_DIR="./backups"
mkdir -p ${BACKUP_DIR}

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Note: Adjust this command based on your actual database setup
# pg_dump -h localhost -U saju_user saju_naming > ${BACKUP_FILE}

log_warning "Database backup skipped (manual backup recommended)"
# Uncomment above line when database credentials are configured

# =============================================================================
# Step 4: Run database migrations
# =============================================================================

echo ""
log_info "🗄️  Step 4/7: Running database migrations..."
echo ""

npx prisma migrate deploy

if [ $? -eq 0 ]; then
    log_success "Database migrations completed"
else
    log_error "Database migration failed"
    log_warning "Consider rolling back if needed"
    exit 1
fi

# =============================================================================
# Step 5: Build application
# =============================================================================

echo ""
log_info "🔨 Step 5/7: Building application..."
echo ""

npm run build

if [ $? -eq 0 ]; then
    log_success "Build completed successfully"
else
    log_error "Build failed"
    exit 1
fi

# =============================================================================
# Step 6: Restart PM2
# =============================================================================

echo ""
log_info "🔄 Step 6/7: Restarting PM2 process..."
echo ""

pm2 restart ${PROJECT_NAME}

if [ $? -eq 0 ]; then
    log_success "PM2 restarted successfully"
else
    log_warning "PM2 restart failed, trying to start..."
    pm2 start npm --name "${PROJECT_NAME}" -- start

    if [ $? -eq 0 ]; then
        log_success "PM2 started successfully"
    else
        log_error "Failed to start PM2"
        exit 1
    fi
fi

# =============================================================================
# Step 7: Health check
# =============================================================================

echo ""
log_info "🏥 Step 7/7: Running health check..."
echo ""

sleep 5  # Wait for app to start

# Check if process is running
pm2 list | grep -q ${PROJECT_NAME}

if [ $? -eq 0 ]; then
    log_success "Process is running"
else
    log_error "Process not found"
    exit 1
fi

# =============================================================================
# Deployment summary
# =============================================================================

echo ""
log_info "==================================================================="
log_success "🎉 Deployment completed successfully!"
log_info "==================================================================="
echo ""

# Show PM2 status
pm2 status

echo ""
log_info "📊 Recent logs:"
echo ""
pm2 logs ${PROJECT_NAME} --lines 15 --nostream

echo ""
log_info "🌐 Application URL: https://saju-naming.one-q.xyz"
log_info "📝 To view logs: pm2 logs ${PROJECT_NAME}"
log_info "📊 To view status: pm2 status"
log_info "🔄 To restart: pm2 restart ${PROJECT_NAME}"
echo ""

log_success "Deployment script finished!"
