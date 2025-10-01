#!/bin/bash

# stop-all-services.sh - The service terminator that ends the chaos gracefully 🛑
# When you need to shut it all down and touch grass 🌱
# Usage: ./stop-all-services.sh 
# Created: September 22, 2025
# Vibes: Orderly shutdown energy with maximum respect for running processes ✨

echo "🛑 Stopping all services - time to put this beast to sleep"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Define the base directory and log directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$BASE_DIR/logs"

# Function to stop a service gracefully - because we're not animals
stop_service() {
    local service_name="$1"
    local pid_file="$LOG_DIR/${service_name}.pid"
    
    echo "🔄 Stopping $service_name..."
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        
        # Check if process is actually running
        if kill -0 "$pid" 2>/dev/null; then
            echo "   Found PID: $pid - sending graceful shutdown signal"
            
            # Try graceful shutdown first (SIGTERM)
            kill "$pid"
            
            # Wait up to 10 seconds for graceful shutdown
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
                echo "   Waiting for graceful shutdown... (${count}/10)"
            done
            
            # If still running, force kill (SIGKILL)
            if kill -0 "$pid" 2>/dev/null; then
                echo "   Process didn't stop gracefully, sending SIGKILL (sorry not sorry)"
                kill -9 "$pid"
                sleep 1
            fi
            
            # Verify it's actually dead
            if kill -0 "$pid" 2>/dev/null; then
                echo "   ❌ ERROR: Process $pid refuses to die! You might need to handle this manually"
            else
                echo "   ✅ $service_name stopped successfully"
            fi
        else
            echo "   ⚠️  Process $pid was already stopped (probably died on its own)"
        fi
        
        # Clean up PID file
        rm -f "$pid_file"
    else
        echo "   ℹ️  No PID file found for $service_name (wasn't started with start script?)"
    fi
    
    echo ""
}

# Stop each service with style
echo "🎯 Stopping services in reverse order (because order matters in this house):"
echo ""

# Stop proxy first (it's the front door, close it first)
stop_service "proxy"

# Stop backend (let it finish any ongoing requests) 
stop_service "backend"

# Stop frontend last (it's usually the quickest to stop)
stop_service "frontend"

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



