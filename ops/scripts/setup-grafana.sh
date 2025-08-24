#!/bin/bash

echo "🎨 Setting up Grafana..."

# Create necessary directories
mkdir -p /opt/homebrew/var/lib/grafana/dashboards
mkdir -p /opt/homebrew/etc/grafana/provisioning/datasources
mkdir -p /opt/homebrew/etc/grafana/provisioning/dashboards

# Copy datasource configuration
cp ops/grafana/grafana-datasources.yml /opt/homebrew/etc/grafana/provisioning/datasources/

# Copy dashboard configurations
cp ops/grafana/dashboards/*.json /opt/homebrew/var/lib/grafana/dashboards/

# Create dashboard provisioning config
cat > /opt/homebrew/etc/grafana/provisioning/dashboards/default.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /opt/homebrew/var/lib/grafana/dashboards
EOF

# Start Grafana
echo "Starting Grafana..."
brew services start grafana

echo "✅ Grafana setup complete!"
echo "📊 Access Grafana at: http://localhost:3000"
echo "   Default login: admin/admin"
echo ""
echo "📈 Available dashboards:"
echo "   - PostgreSQL Database Metrics"
echo "   - Saju Naming Application Metrics"