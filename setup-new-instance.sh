#!/bin/bash

# 🚀 Gbros Store Setup Script - The Ultimate One-Command Deploy
# Created: 2025-10-01
# Makes deploying to a new server actually enjoyable fr fr

set -e  # Exit on any error

# Colors for that aesthetic terminal experience 🎨
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Fancy banner cuz we're not basic
print_banner() {
    clear
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║        🏆 GBROS STORE - ONE-COMMAND SETUP 🏆              ║"
    echo "║                                                            ║"
    echo "║        Premium Trophy & Awards E-Commerce Platform         ║"
    echo "║        Carson, California                                  ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

# Progress indicator that doesn't suck
print_step() {
    echo -e "${BLUE}${BOLD}[$(date +'%H:%M:%S')]${NC} ${CYAN}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}${BOLD}✓${NC} $1"
}

print_error() {
    echo -e "${RED}${BOLD}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}${BOLD}⚠${NC}  $1"
}

# Spinner for long operations (cuz watching paint dry is boring)
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    while ps -p $pid > /dev/null 2>&1; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Ask user for input with default value
ask() {
    local prompt="$1"
    local default="$2"
    local response
    
    if [ -n "$default" ]; then
        echo -ne "${WHITE}${prompt}${NC} ${PURPLE}[${default}]${NC}: "
    else
        echo -ne "${WHITE}${prompt}${NC}: "
    fi
    
    read response
    echo "${response:-$default}"
}

# Ask for secret (password, API key, etc) - hidden input
ask_secret() {
    local prompt="$1"
    local response
    
    echo -ne "${WHITE}${prompt}${NC}: "
    read -s response
    echo ""  # New line after hidden input
    echo "$response"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup flow
main() {
    print_banner
    
    echo -e "${BOLD}Welcome to the Gbros Store setup wizard!${NC}"
    echo "This script will guide you through setting up your store on a fresh server."
    echo ""
    echo -e "${YELLOW}Estimated time: 5-10 minutes${NC}"
    echo ""
    read -p "Press Enter to begin..."
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 1: Check Prerequisites
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    echo ""
    print_step "Checking prerequisites..."
    echo ""
    
    MISSING_DEPS=()
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION installed"
    else
        print_error "Node.js not found"
        MISSING_DEPS+=("nodejs (v18+)")
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION installed"
    else
        print_error "npm not found"
        MISSING_DEPS+=("npm")
    fi
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        print_success "Docker $DOCKER_VERSION installed"
    else
        print_warning "Docker not found (optional - needed for Envoy proxy)"
    fi
    
    # Check PostgreSQL client
    if command_exists psql; then
        PSQL_VERSION=$(psql --version | cut -d' ' -f3)
        print_success "PostgreSQL client $PSQL_VERSION installed"
    else
        print_warning "psql not found (optional - for database verification)"
    fi
    
    # If critical dependencies missing, abort
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        echo ""
        print_error "Missing required dependencies:"
        for dep in "${MISSING_DEPS[@]}"; do
            echo "  - $dep"
        done
        echo ""
        echo "Please install missing dependencies and try again."
        exit 1
    fi
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 2: Environment Configuration
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    echo ""
    print_step "Configuring environment variables..."
    echo ""
    
    # Backend environment
    if [ ! -f backend/.env ]; then
        echo -e "${CYAN}Setting up backend environment...${NC}"
        echo ""
        
        # Database configuration
        echo -e "${BOLD}Database Configuration:${NC}"
        DB_HOST=$(ask "Database host" "10.116.0.3")
        DB_PORT=$(ask "Database port" "5432")
        DB_NAME=$(ask "Database name" "vendure")
        DB_USERNAME=$(ask "Database username" "vendure")
        DB_PASSWORD=$(ask_secret "Database password")
        
        echo ""
        
        # Admin credentials
        echo -e "${BOLD}Admin Account:${NC}"
        SUPERADMIN_USERNAME=$(ask "Admin username" "superadmin")
        SUPERADMIN_PASSWORD=$(ask_secret "Admin password")
        
        echo ""
        
        # Cookie secret
        echo -e "${BOLD}Security:${NC}"
        COOKIE_SECRET=$(ask "Cookie secret (or press Enter to generate)" "")
        if [ -z "$COOKIE_SECRET" ]; then
            COOKIE_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
            print_success "Generated random cookie secret"
        fi
        
        echo ""
        
        # Square credentials
        echo -e "${BOLD}Square Payment Configuration:${NC}"
        echo -e "${YELLOW}Get these from https://developer.squareup.com/apps${NC}"
        SQUARE_ACCESS_TOKEN=$(ask_secret "Square access token")
        SQUARE_ENVIRONMENT=$(ask "Square environment (sandbox/production)" "sandbox")
        SQUARE_LOCATION_ID=$(ask "Square location ID" "")
        
        echo ""
        
        # App environment
        APP_ENV=$(ask "App environment (dev/production)" "production")
        PORT=$(ask "Backend port" "3000")
        
        # Create .env file
        cat > backend/.env << EOF
# Database Configuration
DB_TYPE=postgres
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD

# Admin Account
SUPERADMIN_USERNAME=$SUPERADMIN_USERNAME
SUPERADMIN_PASSWORD=$SUPERADMIN_PASSWORD

# Security
COOKIE_SECRET=$COOKIE_SECRET

# Square Payment Configuration
SQUARE_ACCESS_TOKEN=$SQUARE_ACCESS_TOKEN
SQUARE_ENVIRONMENT=$SQUARE_ENVIRONMENT
SQUARE_LOCATION_ID=$SQUARE_LOCATION_ID

# Application
APP_ENV=$APP_ENV
PORT=$PORT

# Timezone
TZ=America/Los_Angeles
EOF
        
        print_success "Backend .env created"
    else
        print_success "Backend .env already exists (skipping)"
    fi
    
    # Frontend environment
    if [ ! -f frontend/.env.local ]; then
        echo ""
        echo -e "${CYAN}Setting up frontend environment...${NC}"
        echo ""
        
        NEXT_PUBLIC_API_URL=$(ask "Vendure API URL" "https://gbrosapp.com/shop-api")
        NEXT_PUBLIC_SQUARE_APP_ID=$(ask_secret "Square Application ID (for Web SDK)")
        NEXT_PUBLIC_SQUARE_LOCATION_ID=$(ask "Square Location ID (frontend)" "$SQUARE_LOCATION_ID")
        NEXT_PUBLIC_SQUARE_ENV=$(ask "Square environment (sandbox/production)" "$SQUARE_ENVIRONMENT")
        
        cat > frontend/.env.local << EOF
# Vendure API
NEXT_PUBLIC_VENDURE_API_URL=$NEXT_PUBLIC_API_URL

# Square Web Payments SDK
NEXT_PUBLIC_SQUARE_APPLICATION_ID=$NEXT_PUBLIC_SQUARE_APP_ID
NEXT_PUBLIC_SQUARE_LOCATION_ID=$NEXT_PUBLIC_SQUARE_LOCATION_ID
NEXT_PUBLIC_SQUARE_ENVIRONMENT=$NEXT_PUBLIC_SQUARE_ENV
EOF
        
        print_success "Frontend .env.local created"
    else
        print_success "Frontend .env.local already exists (skipping)"
    fi
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 3: Install Dependencies
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    echo ""
    print_step "Installing dependencies..."
    echo ""
    
    # Backend dependencies
    echo -e "${CYAN}Installing backend dependencies...${NC}"
    (cd backend && npm install > /dev/null 2>&1) &
    spinner $!
    print_success "Backend dependencies installed"
    
    # Frontend dependencies
    echo -e "${CYAN}Installing frontend dependencies...${NC}"
    (cd frontend && npm install > /dev/null 2>&1) &
    spinner $!
    print_success "Frontend dependencies installed"
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 4: Build Applications
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    echo ""
    print_step "Building applications..."
    echo ""
    
    # Build backend
    echo -e "${CYAN}Building backend...${NC}"
    (cd backend && npm run build > /dev/null 2>&1) &
    spinner $!
    print_success "Backend built successfully"
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 5: Database Connection Test
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    echo ""
    print_step "Testing database connection..."
    echo ""
    
    if command_exists psql; then
        if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "Database connection successful"
        else
            print_warning "Could not connect to database"
            echo "  This might be okay if database is behind firewall"
            echo "  Backend will test connection on startup"
        fi
    else
        print_warning "Skipping database test (psql not installed)"
    fi
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 6: Setup Proxy (if Docker available)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    if command_exists docker; then
        echo ""
        print_step "Setting up Envoy proxy..."
        echo ""
        
        USE_PROXY=$(ask "Do you want to set up the Envoy proxy? (yes/no)" "yes")
        
        if [ "$USE_PROXY" = "yes" ] || [ "$USE_PROXY" = "y" ]; then
            if [ -d "proxy" ]; then
                echo -e "${CYAN}Building Envoy proxy container...${NC}"
                (cd proxy && docker compose build > /dev/null 2>&1) &
                spinner $!
                print_success "Proxy container built"
            else
                print_warning "Proxy directory not found (skipping)"
            fi
        else
            print_warning "Skipping proxy setup"
        fi
    fi
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 7: SSL/HTTPS Setup (Production Only)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    if [ "$APP_ENV" = "production" ]; then
        echo ""
        print_step "SSL Certificate Setup..."
        echo ""
        
        DOMAIN=$(ask "Your domain name (e.g., gbrosapp.com)" "gbrosapp.com")
        
        echo -e "${YELLOW}SSL certificates are required for production.${NC}"
        echo "Options:"
        echo "  1. Let's Encrypt (free, auto-renewal)"
        echo "  2. Skip (setup manually later)"
        echo ""
        
        SSL_CHOICE=$(ask "Choose option" "1")
        
        if [ "$SSL_CHOICE" = "1" ]; then
            if command_exists certbot; then
                print_warning "SSL setup requires stopping services temporarily"
                read -p "Continue? (yes/no): " CONTINUE
                
                if [ "$CONTINUE" = "yes" ]; then
                    echo "Running certbot for $DOMAIN..."
                    sudo certbot certonly --standalone -d $DOMAIN
                    print_success "SSL certificate obtained"
                fi
            else
                print_warning "Certbot not installed"
                echo "  Install: sudo apt-get install certbot"
                echo "  Then run: sudo certbot certonly --standalone -d $DOMAIN"
            fi
        else
            print_warning "SSL setup skipped - remember to configure before production!"
        fi
    fi
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 8: Create Logs Directory
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    echo ""
    print_step "Setting up logging..."
    echo ""
    
    mkdir -p logs
    chmod 755 logs
    print_success "Logs directory created"
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 9: Final Configuration Summary
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    echo ""
    echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║                                                        ║${NC}"
    echo -e "${GREEN}${BOLD}║              ✓ SETUP COMPLETE! ✓                      ║${NC}"
    echo -e "${GREEN}${BOLD}║                                                        ║${NC}"
    echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BOLD}Configuration Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${CYAN}Database:${NC}        $DB_USERNAME@$DB_HOST:$DB_PORT/$DB_NAME"
    echo -e "${CYAN}Backend:${NC}         Port $PORT ($APP_ENV mode)"
    echo -e "${CYAN}Square:${NC}          $SQUARE_ENVIRONMENT environment"
    echo -e "${CYAN}Admin User:${NC}      $SUPERADMIN_USERNAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    echo -e "${BOLD}Next Steps:${NC}"
    echo ""
    echo -e "  ${CYAN}1.${NC} Start all services:"
    echo -e "     ${WHITE}./start-all-services.sh${NC}"
    echo ""
    echo -e "  ${CYAN}2.${NC} Access your store:"
    echo -e "     ${WHITE}Frontend: http://localhost:3001${NC}"
    echo -e "     ${WHITE}Backend:  http://localhost:3000/admin${NC}"
    echo ""
    echo -e "  ${CYAN}3.${NC} Check logs:"
    echo -e "     ${WHITE}tail -f logs/backend.log${NC}"
    echo -e "     ${WHITE}tail -f logs/frontend.log${NC}"
    echo ""
    echo -e "  ${CYAN}4.${NC} Stop services:"
    echo -e "     ${WHITE}./stop-all-services.sh${NC}"
    echo ""
    
    echo -e "${PURPLE}${BOLD}🎉 Happy selling! Your store is ready to process real payments! 🎉${NC}"
    echo ""
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 10: Optional Auto-Start
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    AUTO_START=$(ask "Start services now? (yes/no)" "yes")
    
    if [ "$AUTO_START" = "yes" ] || [ "$AUTO_START" = "y" ]; then
        echo ""
        print_step "Starting services..."
        echo ""
        
        if [ -x "./start-all-services.sh" ]; then
            ./start-all-services.sh
        else
            print_error "start-all-services.sh not found or not executable"
            echo "Start manually with: ./start-all-services.sh"
        fi
    else
        echo -e "${CYAN}Services not started.${NC}"
        echo "Run ${WHITE}./start-all-services.sh${NC} when you're ready!"
    fi
}

# Run the magic
main

exit 0
