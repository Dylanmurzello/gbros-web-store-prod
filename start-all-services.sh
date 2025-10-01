#!/bin/bash

# start-all-services.sh - The ultimate service launcher that goes absolutely HAM 🔥
# This script is for the homies who got tired of opening 47 terminals just to start their app
# Usage: ./start-all-services.sh
# Created: September 22, 2025
# Vibes: Chaotic good energy with a dash of efficiency ✨

echo "🚀 Starting all services - bout to make this whole setup GO BRRRR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Define the base directory (where this script is located)
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📂 Base directory: $BASE_DIR"

# Create log directory if it doesn't exist because we're organized like that
LOG_DIR="$BASE_DIR/logs"
mkdir -p "$LOG_DIR"

echo ""
echo "🎯 Starting services in parallel - multitasking like a Gen Z boss:"
echo ""

# Function to start a service - because we don't repeat ourselves, we're not savages
start_service() {
    local service_name="$1"
    local service_dir="$2" 
    local service_command="$3"
    local log_file="$LOG_DIR/${service_name}.log"
    
    echo "🔄 Starting $service_name in $service_dir..."
    echo "   Command: $service_command"
    echo "   Logs: $log_file"
    
    # Start the service in background with proper logging
    (
        cd "$service_dir"
        echo "$(date): Starting $service_name - LET'S GOOOOO 🎉" > "$log_file"
        $service_command >> "$log_file" 2>&1
    ) &
    
    # Store the PID because we're responsible adults who clean up after themselves
    echo $! > "$LOG_DIR/${service_name}.pid"
    echo "   PID: $(cat "$LOG_DIR/${service_name}.pid")"
    echo ""
}

# Start Frontend - Next.js doing its thing like the reliable friend it is
start_service "frontend" "$BASE_DIR/frontend" "npm run start"

# Start Backend - Vendure backend serving up that sweet API goodness 
start_service "backend" "$BASE_DIR/backend" "npm run start"

# Start Proxy - Envoy proxy handling traffic like a bouncer at an exclusive club
start_service "proxy" "$BASE_DIR/proxy" "docker compose up"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎊 ALL SERVICES LAUNCHED! Your app is about to be ABSOLUTELY FIRE! 🔥"
echo ""
echo "📊 Service Status:"
echo "   🌐 Frontend: http://localhost:3001 (Next.js storefront)"
echo "   🔌 Backend:  http://localhost:3000 (Vendure API + Admin)"  
echo "   🌍 Proxy:    http://localhost:8080 (Envoy load balancer)"
echo ""
echo "📝 Logs are being written to: $LOG_DIR/"
echo "   frontend.log - Next.js output (all the React magic happening)"
echo "   backend.log  - Vendure API logs (database queries and business logic)"
echo "   proxy.log    - Envoy proxy logs (traffic routing and load balancing)"
echo ""
echo "🛑 To stop all services: ./stop-all-services.sh"
echo "👀 To view logs in real-time: tail -f $LOG_DIR/[service-name].log"
echo ""
echo "💡 Pro tip: Give the services 30-60 seconds to fully boot up"
echo "    Backend takes the longest because databases are divas 💅"
echo ""
echo "🎯 Happy coding! May your builds be fast and your bugs be few! ✨"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Keep the script running so you can see what's happening
# Also prevents the terminal from closing if run with double-click
echo ""
echo "⏳ Services are starting... Press Ctrl+C to stop monitoring (services will keep running)"
echo ""

# Monitor the services - because we care about our digital children
while true; do
    sleep 5
    echo "$(date '+%H:%M:%S') - Services running... 💚"
    
    # Check if any service died (because sometimes things go sideways)
    for service in frontend backend proxy; do
        if [ -f "$LOG_DIR/${service}.pid" ]; then
            pid=$(cat "$LOG_DIR/${service}.pid")
            if ! kill -0 "$pid" 2>/dev/null; then
                echo "⚠️  WARNING: $service (PID $pid) has stopped!"
            fi
        fi
    done
done



