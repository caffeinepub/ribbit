#!/bin/bash
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==== $1 ====${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to cleanup on failure
cleanup_on_failure() {
    print_error "Deployment failed at step: $1"
    print_warning "You can safely re-run this script to retry"
    exit 1
}

# Trap errors and call cleanup
trap 'cleanup_on_failure "$CURRENT_STEP"' ERR

echo ""
print_step "Starting Combined Update Pipeline"
echo ""

# Step 1: Generate backend bindings
CURRENT_STEP="Generate Backend Bindings"
print_step "$CURRENT_STEP"
dfx generate backend || cleanup_on_failure "$CURRENT_STEP"
print_success "Backend bindings generated"
echo ""

# Step 2: Build frontend assets
CURRENT_STEP="Build Frontend Assets"
print_step "$CURRENT_STEP"
cd frontend
npm run build:skip-bindings || cleanup_on_failure "$CURRENT_STEP"
cd ..
print_success "Frontend assets built"
echo ""

# Step 3: Deploy/upgrade canisters
CURRENT_STEP="Deploy Canisters"
print_step "$CURRENT_STEP"
dfx deploy || cleanup_on_failure "$CURRENT_STEP"
print_success "Canisters deployed successfully"
echo ""

# Success message
echo ""
print_success "========================================="
print_success "  Combined Update Completed Successfully"
print_success "========================================="
echo ""
print_step "Your application is now live!"
echo ""
