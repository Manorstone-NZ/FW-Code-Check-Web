"""
Git integration module for PLC Code Checker
Provides functionality to connect to Git repositories, browse files, and manage branches
"""

import git
import os
import json
import tempfile
import shutil
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GitRepository:
    """Git repository management class"""
    
    def __init__(self, repo_path: str = None):
        """Initialize with optional repository path"""
        self.repo = None
        self.repo_path = repo_path
        if repo_path and os.path.exists(repo_path):
            try:
                self.repo = git.Repo(repo_path)
            except git.InvalidGitRepositoryError:
                logger.error(f"Invalid Git repository at {repo_path}")
    
    def clone_repository(self, url: str, local_path: str, branch: str = None, username: str = None, password: str = None) -> Dict:
        """Clone a repository from URL to local path with optional authentication"""
        try:
            if os.path.exists(local_path):
                shutil.rmtree(local_path)
            
            clone_kwargs = {}
            if branch:
                clone_kwargs['branch'] = branch
            
            # Handle authentication for private repositories
            if username and password:
                # Parse the URL to inject credentials
                from urllib.parse import urlparse, urlunparse
                parsed = urlparse(url)
                
                # Reconstruct URL with credentials
                netloc = f"{username}:{password}@{parsed.netloc}"
                auth_url = urlunparse((
                    parsed.scheme, netloc, parsed.path, 
                    parsed.params, parsed.query, parsed.fragment
                ))
                url = auth_url
            
            self.repo = git.Repo.clone_from(url, local_path, **clone_kwargs)
            self.repo_path = local_path
            
            return {
                'success': True,
                'message': f'Repository cloned successfully to {local_path}',
                'path': local_path
            }
        except Exception as e:
            logger.error(f"Failed to clone repository: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to clone repository: {str(e)}'
            }
    
    def connect_to_repository(self, repo_path: str) -> Dict:
        """Connect to an existing local repository"""
        try:
            if not os.path.exists(repo_path):
                return {
                    'success': False,
                    'error': f'Repository path does not exist: {repo_path}'
                }
            
            self.repo = git.Repo(repo_path)
            self.repo_path = repo_path
            
            return {
                'success': True,
                'message': f'Connected to repository at {repo_path}',
                'path': repo_path
            }
        except git.InvalidGitRepositoryError:
            return {
                'success': False,
                'error': f'Invalid Git repository at {repo_path}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to connect to repository: {str(e)}'
            }
    
    def get_remote_branches(self, url: str) -> Dict:
        """Get list of remote branches from a Git URL without cloning"""
        try:
            # Use git ls-remote to list remote branches
            result = subprocess.run([
                'git', 'ls-remote', '--heads', url
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return {
                    'success': False,
                    'error': f'Failed to list remote branches: {result.stderr}'
                }
            
            branches = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split('\t')
                    if len(parts) == 2:
                        commit_hash = parts[0]
                        ref = parts[1]
                        # Extract branch name from refs/heads/branch_name
                        if ref.startswith('refs/heads/'):
                            branch_name = ref.replace('refs/heads/', '')
                            branches.append({
                                'name': branch_name,
                                'type': 'remote',
                                'commit': commit_hash[:8]
                            })
            
            return {
                'success': True,
                'branches': branches,
                'url': url
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Timeout while fetching remote branches'
            }
        except Exception as e:
            logger.error(f"Failed to get remote branches: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get remote branches: {str(e)}'
            }

    def get_branches(self) -> Dict:
        """Get list of all branches in the repository"""
        if not self.repo:
            return {'success': False, 'error': 'No repository connected'}
        
        try:
            branches = []
            
            # Get local branches
            try:
                for branch in self.repo.branches:
                    branches.append({
                        'name': branch.name,
                        'type': 'local',
                        'active': branch == self.repo.active_branch,
                        'commit': str(branch.commit)[:8]
                    })
            except Exception as e:
                logger.warning(f"Error getting local branches: {str(e)}")
            
            # Get remote branches
            try:
                for remote in self.repo.remotes:
                    for ref in remote.refs:
                        if not ref.name.endswith('/HEAD'):
                            branch_name = ref.name.replace(f'{remote.name}/', '')
                            if not any(b['name'] == branch_name for b in branches):
                                branches.append({
                                    'name': branch_name,
                                    'type': 'remote',
                                    'remote': remote.name,
                                    'active': False,
                                    'commit': str(ref.commit)[:8]
                                })
            except Exception as e:
                logger.warning(f"Error getting remote branches: {str(e)}")
            
            current_branch = None
            try:
                current_branch = self.repo.active_branch.name if self.repo.active_branch else None
            except Exception as e:
                logger.warning(f"Error getting current branch: {str(e)}")
            
            return {
                'success': True,
                'branches': branches,
                'current_branch': current_branch
            }
        except Exception as e:
            logger.error(f"Failed to get branches: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get branches: {str(e)}'
            }
    
    def checkout_branch(self, branch_name: str) -> Dict:
        """Checkout a specific branch"""
        if not self.repo:
            return {'success': False, 'error': 'No repository connected'}
        
        try:
            # Check if branch exists locally
            if branch_name in [b.name for b in self.repo.branches]:
                self.repo.git.checkout(branch_name)
            else:
                # Try to checkout remote branch
                try:
                    self.repo.git.checkout(f'origin/{branch_name}', b=branch_name)
                except git.GitCommandError:
                    return {
                        'success': False,
                        'error': f'Branch {branch_name} not found locally or remotely'
                    }
            
            return {
                'success': True,
                'message': f'Checked out branch {branch_name}',
                'current_branch': branch_name
            }
        except Exception as e:
            logger.error(f"Failed to checkout branch: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to checkout branch: {str(e)}'
            }
    
    def get_files(self, branch: str = None, file_extensions: List[str] = None) -> Dict:
        """Get list of files in the repository, optionally filtered by extension"""
        if not self.repo:
            return {'success': False, 'error': 'No repository connected'}
        
        try:
            # Default to PLC file extensions
            if file_extensions is None:
                file_extensions = ['.l5x', '.l5k', '.acd', '.txt', '.json', '.xml']
            
            files = []
            
            # If branch specified, get files from that branch
            if branch:
                try:
                    # Try different ways to resolve the branch
                    commit = None
                    
                    # First try as a local branch
                    try:
                        commit = self.repo.commit(branch)
                    except:
                        pass
                    
                    # If not found, try as remote branch
                    if not commit:
                        try:
                            commit = self.repo.commit(f'origin/{branch}')
                        except:
                            pass
                    
                    # If still not found, try to find it in all refs
                    if not commit:
                        for ref in self.repo.refs:
                            if ref.name == branch or ref.name.endswith(f'/{branch}'):
                                commit = ref.commit
                                break
                    
                    if not commit:
                        raise Exception(f"Branch '{branch}' not found")
                    
                    tree = commit.tree
                    
                    def traverse_tree(tree, path=""):
                        for item in tree:
                            if item.type == 'blob':  # File
                                file_path = os.path.join(path, item.name)
                                if any(file_path.lower().endswith(ext.lower()) for ext in file_extensions):
                                    files.append({
                                        'path': file_path,
                                        'name': item.name,
                                        'size': item.size,
                                        'last_modified': commit.committed_datetime.isoformat(),
                                        'sha': item.hexsha
                                    })
                            elif item.type == 'tree':  # Directory
                                traverse_tree(item, os.path.join(path, item.name))
                    
                    traverse_tree(tree)
                    
                except Exception as e:
                    return {
                        'success': False,
                        'error': f'Failed to get files from branch {branch}: {str(e)}'
                    }
            else:
                # Get files from working directory
                for root, dirs, files_in_dir in os.walk(self.repo_path):
                    # Skip .git directory
                    if '.git' in root:
                        continue
                    
                    for file_name in files_in_dir:
                        if any(file_name.lower().endswith(ext.lower()) for ext in file_extensions):
                            file_path = os.path.join(root, file_name)
                            rel_path = os.path.relpath(file_path, self.repo_path)
                            
                            files.append({
                                'path': rel_path,
                                'name': file_name,
                                'size': os.path.getsize(file_path),
                                'last_modified': os.path.getmtime(file_path),
                                'full_path': file_path
                            })
            
            return {
                'success': True,
                'files': files,
                'branch': branch or (self.repo.active_branch.name if self.repo.active_branch else 'working')
            }
            
        except Exception as e:
            logger.error(f"Failed to get files: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get files: {str(e)}'
            }
    
    def get_file_content(self, file_path: str, branch: str = None) -> Dict:
        """Get content of a specific file"""
        if not self.repo:
            return {'success': False, 'error': 'No repository connected'}
        
        try:
            if branch:
                # Get file from specific branch
                try:
                    commit = self.repo.commit(branch)
                    content = commit.tree[file_path].data_stream.read().decode('utf-8')
                except Exception as e:
                    return {
                        'success': False,
                        'error': f'Failed to get file from branch {branch}: {str(e)}'
                    }
            else:
                # Get file from working directory
                full_path = os.path.join(self.repo_path, file_path)
                if not os.path.exists(full_path):
                    return {
                        'success': False,
                        'error': f'File not found: {file_path}'
                    }
                
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            
            return {
                'success': True,
                'content': content,
                'file_path': file_path,
                'branch': branch or (self.repo.active_branch.name if self.repo.active_branch else 'working')
            }
            
        except Exception as e:
            logger.error(f"Failed to get file content: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get file content: {str(e)}'
            }
    
    def create_temporary_file(self, file_path: str, branch: str = None) -> Dict:
        """Create a temporary file with content from repository"""
        if not self.repo:
            return {'success': False, 'error': 'No repository connected'}
        
        try:
            # Get file content
            content_result = self.get_file_content(file_path, branch)
            if not content_result['success']:
                return content_result
            
            # Create temporary file
            temp_dir = tempfile.mkdtemp(prefix='plc_git_')
            temp_file_path = os.path.join(temp_dir, os.path.basename(file_path))
            
            with open(temp_file_path, 'w', encoding='utf-8') as f:
                f.write(content_result['content'])
            
            return {
                'success': True,
                'temp_path': temp_file_path,
                'temp_dir': temp_dir,
                'original_path': file_path,
                'branch': branch or (self.repo.active_branch.name if self.repo.active_branch else 'working')
            }
            
        except Exception as e:
            logger.error(f"Failed to create temporary file: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to create temporary file: {str(e)}'
            }
    
    def commit_file(self, file_path: str, commit_message: str, branch: str = None) -> Dict:
        """Commit a file to the repository"""
        if not self.repo:
            return {'success': False, 'error': 'No repository connected'}
        
        try:
            # Ensure we're on the correct branch
            if branch and self.repo.active_branch.name != branch:
                checkout_result = self.checkout_branch(branch)
                if not checkout_result['success']:
                    return checkout_result
            
            # Add file to staging
            self.repo.index.add([file_path])
            
            # Commit
            commit = self.repo.index.commit(commit_message)
            
            return {
                'success': True,
                'message': f'File committed successfully: {commit_message}',
                'commit_hash': str(commit)[:8],
                'branch': self.repo.active_branch.name
            }
            
        except Exception as e:
            logger.error(f"Failed to commit file: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to commit file: {str(e)}'
            }
    
    def push_to_remote(self, branch: str = None, remote: str = 'origin') -> Dict:
        """Push changes to remote repository"""
        if not self.repo:
            return {'success': False, 'error': 'No repository connected'}
        
        try:
            if branch is None:
                branch = self.repo.active_branch.name
            
            # Push to remote
            remote_obj = self.repo.remote(remote)
            push_info = remote_obj.push(f'{branch}:{branch}')
            
            return {
                'success': True,
                'message': f'Successfully pushed {branch} to {remote}',
                'push_info': [str(info) for info in push_info]
            }
            
        except Exception as e:
            logger.error(f"Failed to push to remote: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to push to remote: {str(e)}'
            }
    
    def get_repository_status(self) -> Dict:
        """Get current repository status"""
        if not self.repo:
            return {'success': False, 'error': 'No repository connected'}
        
        try:
            # Get repository info
            repo_info = {
                'path': self.repo_path,
                'current_branch': self.repo.active_branch.name if self.repo.active_branch else None,
                'is_dirty': self.repo.is_dirty(),
                'untracked_files': self.repo.untracked_files,
                'modified_files': [item.a_path for item in self.repo.index.diff(None)],
                'staged_files': [item.a_path for item in self.repo.index.diff('HEAD')],
                'remotes': [remote.name for remote in self.repo.remotes],
                'last_commit': {
                    'hash': str(self.repo.head.commit)[:8],
                    'message': self.repo.head.commit.message.strip(),
                    'author': str(self.repo.head.commit.author),
                    'date': self.repo.head.commit.committed_datetime.isoformat()
                } if self.repo.head.commit else None
            }
            
            return {
                'success': True,
                'status': repo_info
            }
            
        except Exception as e:
            logger.error(f"Failed to get repository status: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get repository status: {str(e)}'
            }
    
    def copy_file_from_branch(self, file_path: str, source_branch: str, target_path: str = None) -> Dict:
        """Copy a file from a specific branch to the working directory"""
        if not self.repo:
            return {'success': False, 'error': 'No repository connected'}
        
        try:
            # Get file content from source branch
            file_result = self.get_file_content(file_path, source_branch)
            if not file_result['success']:
                return file_result
            
            # Determine target path
            if target_path is None:
                target_path = file_path
            
            # Create directory if it doesn't exist
            target_full_path = os.path.join(self.repo_path, target_path)
            os.makedirs(os.path.dirname(target_full_path), exist_ok=True)
            
            # Write file content
            with open(target_full_path, 'w', encoding='utf-8') as f:
                f.write(file_result['content'])
            
            return {
                'success': True,
                'message': f'File copied from {source_branch} to working directory',
                'target_path': target_path
            }
            
        except Exception as e:
            logger.error(f"Failed to copy file from branch: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to copy file from branch: {str(e)}'
            }

def cleanup_temp_directory(temp_dir: str):
    """Clean up temporary directory"""
    try:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
    except Exception as e:
        logger.error(f"Failed to cleanup temp directory {temp_dir}: {str(e)}")

# Global repository instance
git_repo = GitRepository()

# Persistent state file for CLI usage
STATE_FILE = os.path.join(tempfile.gettempdir(), 'plc_git_state.json')

def save_repository_state(repo_path: str):
    """Save current repository path to state file"""
    try:
        state = {'repo_path': repo_path}
        with open(STATE_FILE, 'w') as f:
            json.dump(state, f)
    except Exception as e:
        logger.error(f"Failed to save repository state: {str(e)}")

def load_repository_state() -> str:
    """Load repository path from state file"""
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                state = json.load(f)
                return state.get('repo_path')
    except Exception as e:
        logger.error(f"Failed to load repository state: {str(e)}")
    return None

def ensure_repository_connection():
    """Ensure git_repo is connected, loading from state if needed"""
    global git_repo
    if not git_repo.repo:
        saved_path = load_repository_state()
        if saved_path and os.path.exists(saved_path):
            git_repo.connect_to_repository(saved_path)

# CLI functions for testing
def main():
    """Main function for CLI testing"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python git_integration.py <command> [args...]")
        print("Commands:")
        print("  --clone <url> <path> [branch]")
        print("  --connect <path>")
        print("  --remote-branches <url>")
        print("  --branches")
        print("  --checkout <branch>")
        print("  --files [branch]")
        print("  --status")
        print("  --create-temp-file <file_path> [branch]")
        return
    
    command = sys.argv[1]
    
    if command == '--clone':
        if len(sys.argv) < 4:
            print("Usage: --clone <url> <path> [branch] [username] [password]")
            return
        url = sys.argv[2]
        path = sys.argv[3]
        branch = sys.argv[4] if len(sys.argv) > 4 else None
        username = sys.argv[5] if len(sys.argv) > 5 else None
        password = sys.argv[6] if len(sys.argv) > 6 else None
        result = git_repo.clone_repository(url, path, branch, username, password)
        if result['success']:
            save_repository_state(path)
        print(json.dumps(result, indent=2))
    
    elif command == '--connect':
        if len(sys.argv) < 3:
            print("Usage: --connect <path>")
            return
        path = sys.argv[2]
        result = git_repo.connect_to_repository(path)
        if result['success']:
            save_repository_state(path)
        print(json.dumps(result, indent=2))
    
    elif command == '--remote-branches':
        if len(sys.argv) < 3:
            print("Usage: --remote-branches <url>")
            return
        url = sys.argv[2]
        result = git_repo.get_remote_branches(url)
        print(json.dumps(result, indent=2))
    
    elif command == '--branches':
        ensure_repository_connection()
        result = git_repo.get_branches()
        print(json.dumps(result, indent=2))
    
    elif command == '--checkout':
        if len(sys.argv) < 3:
            print("Usage: --checkout <branch>")
            return
        branch = sys.argv[2]
        ensure_repository_connection()
        result = git_repo.checkout_branch(branch)
        print(json.dumps(result, indent=2))
    
    elif command == '--files':
        branch = sys.argv[2] if len(sys.argv) > 2 else None
        ensure_repository_connection()
        result = git_repo.get_files(branch)
        print(json.dumps(result, indent=2))
    
    elif command == '--status':
        ensure_repository_connection()
        result = git_repo.get_repository_status()
        print(json.dumps(result, indent=2))
    
    elif command == '--create-temp-file':
        if len(sys.argv) < 3:
            print("Usage: --create-temp-file <file_path> [branch]")
            return
        file_path = sys.argv[2]
        branch = sys.argv[3] if len(sys.argv) > 3 else None
        ensure_repository_connection()
        result = git_repo.create_temporary_file(file_path, branch)
        print(json.dumps(result, indent=2))
    
    elif command == '--commit-file':
        if len(sys.argv) < 4:
            print("Usage: --commit-file <file_path> <commit_message> [branch]")
            return
        file_path = sys.argv[2]
        commit_message = sys.argv[3]
        branch = sys.argv[4] if len(sys.argv) > 4 else None
        result = git_repo.commit_file(file_path, commit_message, branch)
        print(json.dumps(result, indent=2))
    
    elif command == '--push-to-remote':
        branch = sys.argv[2] if len(sys.argv) > 2 else None
        remote = sys.argv[3] if len(sys.argv) > 3 else 'origin'
        result = git_repo.push_to_remote(branch, remote)
        print(json.dumps(result, indent=2))
    
    elif command == '--copy-file-from-branch':
        if len(sys.argv) < 4:
            print("Usage: --copy-file-from-branch <file_path> <source_branch> [target_path]")
            return
        file_path = sys.argv[2]
        source_branch = sys.argv[3]
        target_path = sys.argv[4] if len(sys.argv) > 4 else None
        result = git_repo.copy_file_from_branch(file_path, source_branch, target_path)
        print(json.dumps(result, indent=2))
    
    else:
        print("Git Integration CLI")
        print("Available commands:")
        print("  --clone <url> <local_path> [branch]")
        print("  --connect <repo_path>")
        print("  --remote-branches <url>")
        print("  --branches")
        print("  --checkout <branch>")
        print("  --files [branch]")
        print("  --status")
        print("  --create-temp-file <file_path> [branch]")
        print("  --commit-file <file_path> <commit_message> [branch]")
        print("  --push-to-remote [branch] [remote]")
        print("  --copy-file-from-branch <file_path> <source_branch> [target_path]")

if __name__ == "__main__":
    main()
