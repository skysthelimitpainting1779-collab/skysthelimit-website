import os
import subprocess
import sys

def log(msg):
    print(f"[Auto-Commit] {msg}")

def get_test_command():
    if os.path.exists("package.json"):
        return ["npm.cmd" if os.name == "nt" else "npm", "run", "test", "--if-present"]
    elif os.path.exists("requirements.txt"):
        return ["pytest"]
    return None

def main():
    log("Checking for uncommitted changes...")
    status_res = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    
    if status_res.returncode == 0 and status_res.stdout.strip():
        log("Changes detected. Validating codebase...")
        test_cmd = get_test_command()
        
        if test_cmd:
            log(f"Executing pre-commit hook: {' '.join(test_cmd)}")
            test_res = subprocess.run(test_cmd, capture_output=True, text=True)
            if test_res.returncode != 0:
                log("Validation FAILED! Aborting commit.")
                sys.stderr.write(test_res.stderr)
                sys.exit(1)
        
        log("Validation passed. Auto-committing...")
        subprocess.run(["git", "add", "-A"])
        subprocess.run(["git", "commit", "-m", "chore(auto): autonomous sidecar snapshot"])
        log("Pushing to remote...")
        push_res = subprocess.run(["git", "push"])
        if push_res.returncode == 0:
            log("Success!")
            sys.exit(0)
        else:
            log("Failed to push.")
            sys.exit(1)
    else:
        log("No changes detected. Repository is clean.")
        sys.exit(0)

if __name__ == '__main__':
    main()
