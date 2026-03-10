# Port 3000 Already in Use - Quick Fix Guide

## 🚀 Quick Solutions

### Option 1: Kill the Process (Recommended)
Run this command in your terminal:
```bash
# Windows (PowerShell/CMD)
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or use this PowerShell command directly:
powershell -Command "$port = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue; if ($port) { Stop-Process -Id $port.OwningProcess -Force }"
```

### Option 2: Use a Different Port
Use the alternate port command:
```bash
npm run dev:port
```
This will start the server on port 3001 instead.

### Option 3: Auto-Kill Before Starting (New!)
Use the clean-start command:
```bash
npm run clean-start
```
This automatically kills any process on port 3000 before starting the server.

## 📋 Available Commands

- `npm run dev` - Start server on port 3000
- `npm run dev:port` - Start server on port 3001 (alternative port)
- `npm run kill-port` - Kill any process using port 3000
- `npm run clean-start` - Kill port 3000 process and start server
- `npm start` - Same as `npm run dev`

## 🔍 Find What's Using Port 3000

```bash
# Windows
netstat -ano | findstr :3000

# The last column is the PID (Process ID)
# Use it to kill: taskkill /PID <PID> /F
```

## ✅ Fixed!

The server should now be running. Visit: **http://localhost:3000**
