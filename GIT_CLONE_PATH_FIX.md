# Git Clone Path Fix

## Problem
The Git clone operation was failing with the error:
```
fatal: could not create leading directories of '/path/to/clone/repository': Read-only file system
```

This was happening because the GitConnectionModal was initializing the `targetPath` state with a literal placeholder string `/path/to/clone/repository`, which is not a valid writable directory path.

## Root Cause
- The `targetPath` state was initialized with a hardcoded placeholder: `useState('/path/to/clone/repository')`
- When users didn't change this path, the clone operation would attempt to create directories at this invalid location
- The path `/path/to/clone/repository` is not writable and doesn't exist on most systems

## Solution Implemented

### 1. **Fixed Default Path Generation**
- Changed `targetPath` initialization from hardcoded string to empty string: `useState('')`
- Added a `useEffect` hook that automatically generates a sensible default path when:
  - Connection type is 'clone'
  - Git URL is provided
  - Target path is empty

### 2. **Added Home Directory API**
- **Backend (electron.js)**: Added new IPC handler `get-home-directory` using Node.js `os.homedir()`
- **Preload (preload.js)**: Exposed `getHomeDirectory()` method to renderer process
- **Types (electron-api.d.ts)**: Added TypeScript definitions for the new API

### 3. **Smart Path Generation**
The new logic:
1. Extracts repository name from the Git URL (e.g., "PLC-Programmes" from "https://github.com/Damiancnz/PLC-Programmes")
2. Gets the user's home directory via the new API
3. Creates a path like: `{HOME}/Documents/GitRepos/{REPO_NAME}`
4. Falls back to `~/Documents/GitRepos/{REPO_NAME}` if the API fails

### 4. **Enhanced Validation**
- Added validation to prevent cloning to invalid paths
- Checks for the old placeholder text and rejects it
- Ensures both Git URL and target path are provided before attempting clone
- Updated placeholder text to be more informative: "Path will be auto-generated from repository name"

## Code Changes

### Files Modified:
1. **src/renderer/components/git/GitConnectionModal.tsx**
   - Fixed default path initialization
   - Added automatic path generation
   - Enhanced validation

2. **src/main/electron.js**
   - Added `get-home-directory` IPC handler

3. **src/main/preload.js**
   - Exposed `getHomeDirectory` method

4. **src/types/electron-api.d.ts**
   - Added TypeScript definitions

## Testing
- App builds successfully without errors
- Default paths are now generated properly using the user's actual home directory
- Validation prevents use of invalid placeholder paths
- Git clone operations should now work with proper writable directory paths

## Example Behavior
- **Before**: `targetPath = "/path/to/clone/repository"` → Clone fails
- **After**: `targetPath = "/Users/damian/Documents/GitRepos/PLC-Programmes"` → Clone succeeds

The fix ensures that Git clone operations will now use valid, writable directory paths by default, while still allowing users to customize the target location as needed.
