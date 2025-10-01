#!/bin/bash

# stop-all-services.sh - The service terminator that ends the chaos gracefully 🛑
# FIX: 2025-10-01 - More reliable process killing using pkill instead of PID files
# When you need to shut it all down and touch grass 🌱
# Usage: ./stop-all-services.sh 
# Vibes: Orderly shutdown energy with maximum respect for running processes ✨

echo "🛑 Stopping all services - time to put this beast to sleep"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Define the base directory and log directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$BASE_DIR/logs"

# Function to stop services by process name - more reliable than PID files
stop_by_pattern() {
    local service_name="$1"
    local pattern="$2"
    
    echo "🔄 Stopping $service_name..."
    
    # Find processes matching pattern
    PIDS=$(pgrep -f "$pattern" 2>/dev/null)
    
    if [ -z "$PIDS" ]; then
        echo "   ℹ️  No $service_name processes found (already stopped)"
        echo ""
        return
    fi
    
    echo "   Found PIDs: $PIDS"
    
    # Try graceful shutdown (SIGTERM)
    pkill -TERM -f "$pattern" 2>/dev/null
    
    # Wait up to 10 seconds
    local count=0
    while pgrep -f "$pattern" >/dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
        echo "   Waiting for graceful shutdown... (${count}/10)"
    done
    
    # If still running, force kill (SIGKILL)
    if pgrep -f "$pattern" >/dev/null 2>&1; then
        echo "   Process didn't stop gracefully, sending SIGKILL 💀"
        pkill -9 -f "$pattern" 2>/dev/null
        sleep 1
    fi
    
    # Verify stopped
    if pgrep -f "$pattern" >/dev/null 2>&1; then
        echo "   ❌ ERROR: Some processes still running!"
        pgrep -af "$pattern"
    else
        echo "   ✅ $service_name stopped successfully"
    fi
    
    # Clean up PID file if exists
    rm -f "$LOG_DIR/${service_name}.pid"
    
    echo ""
}

# Stop each service with style
echo "🎯 Stopping services (graceful first, force if needed):"
echo ""

# Stop Docker proxy first (close the front door)
echo "🔄 Stopping Envoy proxy (Docker)..."
cd "$BASE_DIR/proxy"
if docker ps | grep -q "gbros-envoy"; then
    docker compose down 2>/dev/null || docker stop gbros-envoy 2>/dev/null
    echo "   ✅ Envoy proxy stopped"
else
    echo "   ℹ️  Envoy proxy not running"
fi
echo ""

# Stop backend Vendure processes
stop_by_pattern "backend" "$BASE_DIR/backend.*node"

# Stop frontend Next.js processes  
stop_by_pattern "frontend" "$BASE_DIR/frontend.*next"

# Nuclear option: Clean up any remaining node processes in project directory
echo "🧹 Final cleanup - killing any orphaned processes..."
ORPHANS=$(pgrep -f "$BASE_DIR" | grep -v "$$" | grep -v "cursor-server")
if [ -n "$ORPHANS" ]; then
    echo "   Found orphaned processes: $ORPHANS"
    kill -9 $ORPHANS 2>/dev/null
    echo "   ✅ Orphaned processes terminated"
else
    echo "   ✅ No orphaned processes found"
fi
echo ""

# Additional cleanup for Docker containers that might still be hanging around
echo "🧹 Cleaning up any lingering Docker containers from proxy..."
(
    cd "$BASE_DIR/proxy"
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose down 2>/dev/null || echo "   No docker-compose containers were running"
    elif command -v docker >/dev/null 2>&1 && [ -f "docker-compose.yml" ]; then
        docker compose down 2>/dev/null || echo "   No docker compose containers were running"
    else
        echo "   Docker not available or no compose file found"
    fi
)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL SERVICES STOPPED! Your machine can finally breathe again 😌"
echo ""
echo "📂 Logs are preserved in: $LOG_DIR/"
echo "   (In case you need to debug what went wrong or just reminisce)"
echo ""
echo "🌱 Time to touch grass! Your services are peacefully sleeping 💤"
echo "🔄 To start them again: ./start-all-services.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"



