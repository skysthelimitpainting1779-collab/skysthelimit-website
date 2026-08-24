import os
import json

def setup_graphify_ignore():
    # Scaffold .graphifyignore to prevent Graphify from wasting tokens on generated files
    ignore_path = '.graphifyignore'
    if not os.path.exists(ignore_path):
        with open(ignore_path, 'w') as f:
            f.write("""# Graphify Ignore File
node_modules/
__pycache__/
venv/
env/
.venv/
dist/
build/
.next/
graphify-out/
*.log
.gemini/
.agents/scratch/
""")
        print('Created .graphifyignore to prevent token bloat.')

def define_graphify_out():
    # The user requested 'define graphify-out'. We programmatically ensure it is excluded from git.
    # graphify-out contains massive structural and semantic graphs. Pushing it to Git bloats the repo.
    gitignore_path = '.gitignore'
    graphify_entry = 'graphify-out/'
    
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            content = f.read()
        if graphify_entry not in content:
            with open(gitignore_path, 'a') as f:
                f.write(f'\n# Graphify Cache (Do not track massive graphs)\n{graphify_entry}\n')
            print('Added graphify-out/ to .gitignore')
    else:
        with open(gitignore_path, 'w') as f:
            f.write(f'node_modules/\n__pycache__/\n.env\n# Graphify Cache\n{graphify_entry}\n')
        print('Created .gitignore and defined graphify-out exclusion.')

def scaffold_github_actions(stack):
    os.makedirs('.github/workflows', exist_ok=True)
    ci_path = '.github/workflows/ci.yml'
    
    if stack == 'node':
        yaml_content = """name: CI Pipeline
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test --if-present
"""
    else:
        yaml_content = """name: Python CI
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'
    - run: pip install -r requirements.txt
    - run: pytest
"""
        
    with open(ci_path, 'w') as f:
        f.write(yaml_content)
    print(f'Scaffolded {ci_path} for {stack} stack.')

def audit_project():
    stack = 'python' # default fallback
    
    if os.path.exists('package.json'):
        stack = 'node'
        with open('package.json', 'r') as f:
            pkg = json.load(f)
            deps = str(pkg.get('dependencies', {})) + str(pkg.get('devDependencies', {}))
            if 'next' in deps:
                print('Detected Next.js / Vercel tech stack.')
                if not os.path.exists('vercel.json'):
                    with open('vercel.json', 'w') as vf:
                        json.dump({"framework": "nextjs", "buildCommand": "npm run build"}, vf, indent=2)
                    print('Scaffolded vercel.json')
                    
    scaffold_github_actions(stack)

def main():
    print("Starting Universal Project Auditor...")
    define_graphify_out()
    setup_graphify_ignore()
    audit_project()
    print("Auditing and standardization complete!")

if __name__ == '__main__':
    main()
