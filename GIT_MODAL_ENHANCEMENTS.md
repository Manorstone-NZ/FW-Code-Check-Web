# Git Connection Modal Updates

## Summary

Successfully enhanced the Git Connection Modal with folder browsing for target directory and branch browsing for repository branch selection. The implementation includes both UI improvements and backend functionality to fetch remote branches without cloning.

## New Features Added

### 1. Remote Branch Fetching
- **Backend**: Added `get_remote_branches()` method in `git_integration.py` using `git ls-remote --heads`
- **IPC Handler**: Added `git-get-remote-branches` handler in `electron.js`
- **API**: Exposed `gitGetRemoteBranches(url)` in preload.js and TypeScript definitions

### 2. Enhanced UI Components

#### Target Directory Browser
- Added folder icon button next to target directory input
- Uses existing `showDirectoryPicker()` API for both local and clone paths
- Provides visual feedback for directory selection

#### Branch Selection Dropdown
- Real-time branch fetching from remote repository URL
- Dropdown with clickable branch options
- Auto-selection of 'main' or 'master' branch when available
- Loading spinner while fetching branches
- Fallback to common branch names if fetch fails

### 3. Improved User Experience
- Click-outside-to-close functionality for branch dropdown
- Visual indicators for loading states
- Better error handling and fallback options
- Consistent styling with existing modal design

## Technical Implementation

### Python Backend (`src/python/git_integration.py`)
```python
def get_remote_branches(self, url: str) -> Dict:
    """Get list of remote branches from a Git URL without cloning"""
    # Uses subprocess to run: git ls-remote --heads <url>
    # Parses output to extract branch names and commit hashes
    # Returns formatted branch data
```

### Electron IPC Handler (`src/main/electron.js`)
```javascript
ipcMain.handle('git-get-remote-branches', async (event, url) => {
    // Executes Python script with --remote-branches flag
    // Returns branch data to renderer process
});
```

### React Component (`src/renderer/components/git/GitConnectionModal.tsx`)
```typescript
// Enhanced with:
// - Folder browser for target directory
// - Dynamic branch fetching and dropdown
// - Click-outside handling
// - Loading states and error handling
```

## Testing Results

### Backend Testing
✅ Successfully tested with multiple repositories:
- `https://github.com/Damiancnz/PLC-Programmes` (3 branches found)
- `https://github.com/octocat/Hello-World` (3 branches found)

### Integration Testing
✅ Fixed IPC handler issues:
- Added missing `pythonExecutable` definition
- Fixed `dialog` import reference
- Verified no runtime errors in Electron app

### UI Testing
✅ Modal functionality:
- Folder browser working for both local and clone paths
- Branch dropdown populated with real remote branches
- Auto-selection of main/master branches
- Proper loading states and error handling

## Files Modified

1. **`src/python/git_integration.py`**
   - Added `get_remote_branches()` method
   - Added CLI command `--remote-branches`
   - Updated help text

2. **`src/main/electron.js`**
   - Added `git-get-remote-branches` IPC handler
   - Fixed `pythonExecutable` and `dialog` reference issues

3. **`src/main/preload.js`**
   - Added `gitGetRemoteBranches()` API method

4. **`src/types/electron-api.d.ts`**
   - Added TypeScript definition for remote branches API

5. **`src/renderer/components/git/GitConnectionModal.tsx`**
   - Enhanced target directory input with folder browser
   - Added dynamic branch fetching and dropdown
   - Improved UX with loading states and click-outside handling

## Key Benefits

1. **No More Manual Branch Entry**: Uses real branch data from remote repository
2. **Better Directory Selection**: Visual folder browser instead of manual path entry
3. **Improved UX**: Loading indicators, auto-selection, and error handling
4. **Performance**: Fetches branches without cloning (lightweight git ls-remote)
5. **Reliability**: Fallback options ensure functionality even if remote fetch fails

## Usage

Users can now:
1. Enter a Git repository URL
2. Click folder icon to browse for target directory
3. See real branches automatically populated in dropdown
4. Select branch from dropdown or type custom branch name
5. Proceed with clone/connect operation

The modal provides a much more intuitive and reliable Git workflow for PLC file analysis.
