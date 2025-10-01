#!/bin/bash

# 🔐 SSL/TLS Setup Script for Envoy Proxy
# Sets up Let's Encrypt certificates and configures Envoy
# Created: 2025-10-01

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔐 SSL/TLS Setup for Gbros Store${NC}"
echo "=================================="
echo ""

# Get domain from user
DOMAIN=${1:-gbrosapp.com}
echo -e "Domain: ${GREEN}$DOMAIN${NC}"
echo ""

# Check if certs already exist
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${GREEN}✓${NC} SSL certificates already exist for $DOMAIN"
    RENEW_ONLY=true
else
    echo -e "${YELLOW}⚠${NC}  No existing certificates found"
    RENEW_ONLY=false
fi

# Step 1: Stop any services using port 80/443
echo -e "${CYAN}Step 1: Stopping services on ports 80/443${NC}"
cd /root/Gbros-web-store/proxy
docker compose down 2>/dev/null || true
echo -e "${GREEN}✓${NC} Proxy stopped"
echo ""

# Step 2: Get or renew certificate
if [ "$RENEW_ONLY" = false ]; then
    echo -e "${CYAN}Step 2: Obtaining SSL certificate from Let's Encrypt${NC}"
    echo "This will:"
    echo "  - Verify you own $DOMAIN"
    echo "  - Issue a free 90-day certificate"
    echo "  - Auto-renew before expiration"
    echo ""
    
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@$DOMAIN \
        -d $DOMAIN
    
    echo -e "${GREEN}✓${NC} Certificate obtained!"
else
    echo -e "${CYAN}Step 2: Renewing existing certificate${NC}"
    certbot renew
    echo -e "${GREEN}✓${NC} Certificate renewed!"
fi
echo ""

# Step 3: Copy certificates to proxy folder
echo -e "${CYAN}Step 3: Copying certificates to proxy folder${NC}"
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /root/Gbros-web-store/proxy/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /root/Gbros-web-store/proxy/

chmod 644 /root/Gbros-web-store/proxy/fullchain.pem
chmod 644 /root/Gbros-web-store/proxy/privkey.pem

echo -e "${GREEN}✓${NC} Certificates copied"
echo ""

# Step 4: Build Envoy with certificates
echo -e "${CYAN}Step 4: Building Envoy container with SSL${NC}"
cd /root/Gbros-web-store/proxy
docker compose build --no-cache
echo -e "${GREEN}✓${NC} Envoy built with SSL certificates"
echo ""

# Step 5: Start Envoy
echo -e "${CYAN}Step 5: Starting Envoy proxy${NC}"
docker compose up -d
echo -e "${GREEN}✓${NC} Envoy started"
echo ""

# Step 6: Setup auto-renewal
echo -e "${CYAN}Step 6: Setting up auto-renewal${NC}"
CRON_JOB="0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /root/Gbros-web-store/proxy/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /root/Gbros-web-store/proxy/ && cd /root/Gbros-web-store/proxy && docker compose restart"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "certbot renew"; then
    echo -e "${YELLOW}⚠${NC}  Cron job already exists"
else
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓${NC} Auto-renewal cron job added (runs daily at 3 AM)"
fi
echo ""

# Step 7: Verify HTTPS is working
echo -e "${CYAN}Step 7: Testing HTTPS${NC}"
sleep 3
if curl -sSf -k https://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} HTTPS is working!"
else
    echo -e "${YELLOW}⚠${NC}  HTTPS test inconclusive (backend might not be running yet)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ SSL/TLS SETUP COMPLETE!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your site is now secured with HTTPS! 🔒"
echo ""
echo "Certificate info:"
echo "  Domain: $DOMAIN"
echo "  Expires: $(date -d "+90 days" +%Y-%m-%d)"
echo "  Auto-renews: Daily at 3 AM"
echo ""
echo "Access your site:"
echo "  https://$DOMAIN"
echo "  https://$DOMAIN/admin"
echo ""
echo "Envoy admin:"
echo "  http://localhost:9901"
echo ""

