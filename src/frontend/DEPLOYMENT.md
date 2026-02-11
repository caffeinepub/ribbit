# Deployment Guide

This guide explains how to deploy and update your Ribbit application on the Internet Computer.

## Prerequisites

Before deploying, ensure you have:

1. **DFX installed** - The Internet Computer SDK
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

2. **Node.js and npm** - For building the frontend
   ```bash
   node --version  # Should be v18 or higher
   npm --version
   ```

3. **Dependencies installed** - Run in the frontend directory:
   ```bash
   cd frontend && npm install && cd ..
   ```

4. **DFX running** - For local deployment:
   ```bash
   dfx start --background --clean
   ```

## Single-Command Deployment

### Quick Start

To deploy or update your application, run:

