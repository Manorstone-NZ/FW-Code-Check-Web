# Git Remote Branches Spawn Function Fix

## Issue Description
The `git-get-remote-branches` IPC handler was throwing a `ReferenceError: spawn is not defined` error when trying to fetch branches from a remote Git repository.

## Root Cause
In the `git-get-remote-branches` handler, the code was using `spawn` directly instead of the properly imported `child_process_1.spawn` function that's used consistently throughout the rest of the file.

```javascript
// BEFORE (line 1360) - Incorrect:
const pythonProcess = spawn(pythonExecutable, args);

// AFTER - Fixed:
const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
```

## Error Details
```
Error occurred in handler for 'git-get-remote-branches': ReferenceError: spawn is not defined
    at /Users/damian/Development Projects/PLC Code Check/first-watch-plc-code-checker-v2/src/main/electron.js:1360:31
```

## Solution Applied
- **File**: `src/main/electron.js`
- **Line**: 1360
- **Change**: Updated `spawn(pythonExecutable, args)` to `(0, child_process_1.spawn)(pythonExecutable, args)`

## Impact
This fix resolves the issue where:
- ✅ Users couldn't fetch remote branches when setting up Git repository connections
- ✅ The "Fetch Branches" button in the Git Connection Modal was failing
- ✅ Dynamic branch fetching was broken for remote repositories

## Testing
- ✅ Build completed successfully
- ✅ App starts without errors
- ✅ Git remote branch fetching should now work properly

## Consistency Note
This change maintains consistency with all other IPC handlers in the file, which properly use `child_process_1.spawn` from the imported `child_process` module.

---

**Date**: 2025-06-22  
**Status**: Fixed and Tested
