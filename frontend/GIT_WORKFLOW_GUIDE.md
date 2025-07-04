# ElithPharmacy - Git Workflow Guide

## Overview
This guide outlines the Git workflow for the ElithPharmacy project. Following these conventions ensures clean commit history, easy collaboration, and streamlined feature development.

## 📋 Table of Contents
- [Branch Strategy](#branch-strategy)
- [Feature Development Workflow](#feature-development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Common Commands Reference](#common-commands-reference)
- [Troubleshooting](#troubleshooting)

## 🌟 Branch Strategy

### Main Branches
- **`main`** - Production-ready code. Always stable and deployable.
- **`develop`** (optional) - Integration branch for features (if using GitFlow)

### Feature Branches
- **Naming Convention**: `feature/feature-name` or `feature/issue-number-description`
- **Examples**: 
  - `feature/edit-product`
  - `feature/categories`
  - `feature/user-authentication`
  - `feature/123-inventory-dashboard`

### Other Branch Types
- **`hotfix/`** - Critical fixes for production
- **`bugfix/`** - Non-critical bug fixes
- **`refactor/`** - Code refactoring without new features
- **`docs/`** - Documentation updates

## 🚀 Feature Development Workflow

### 1. Start a New Feature

```bash
# Ensure you're on main and it's up to date
git checkout main
git pull origin main

# Create and switch to new feature branch
git checkout -b feature/your-feature-name

# Verify you're on the correct branch
git branch --show-current
```

### 2. Development Process

```bash
# Make your changes
# ... code, code, code ...

# Stage your changes
git add .

# Or stage specific files
git add src/pages/EditProduct.jsx
git add src/components/NewComponent.jsx

# Check what will be committed
git status
```

### 3. Commit Your Changes

```bash
# Commit with descriptive message
git commit -m "Add new feature: brief description

- Detailed point 1
- Detailed point 2
- Fixes issue #123"
```

### 4. Push Your Feature Branch

```bash
# Push feature branch to remote
git push origin feature/your-feature-name

# If it's your first push of this branch
git push -u origin feature/your-feature-name
```

### 5. Merge to Main (Direct Merge)

```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Merge your feature branch
git merge feature/your-feature-name

# Push updated main
git push origin main
```

### 6. Clean Up and Start Next Feature

```bash
# Delete local feature branch (optional)
git branch -d feature/your-feature-name

# Delete remote feature branch (optional)
git push origin --delete feature/your-feature-name

# Create next feature branch
git checkout -b feature/next-feature-name
```

## 📝 Commit Guidelines

### Commit Message Format
```
Type: Brief description (50 chars or less)

Detailed explanation of what and why (if needed):
- Point 1
- Point 2
- Point 3

Closes #issue-number (if applicable)
```

### Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples of Good Commit Messages

```bash
# Feature addition
git commit -m "feat: Add product editing functionality

- Implement EditProduct component with form validation
- Add update API endpoint integration
- Include error handling for database operations
- Fix location field database compatibility issue"

# Bug fix
git commit -m "fix: Resolve edit product location field error

- Remove unsupported location field from database update
- Keep location field in UI for future implementation
- Fixes PGRST204 error in product updates"

# Documentation
git commit -m "docs: Add Git workflow guide for team collaboration"

# Refactoring
git commit -m "refactor: Extract product form validation into reusable hook"
```

## 🔄 Pull Request Process

### Creating a Pull Request

1. **Push your feature branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub/GitLab**:
   - Go to your repository
   - Click "New Pull Request"
   - Select `feature/your-feature-name` → `main`
   - Fill out the PR template

### PR Template
```markdown
## Description
Brief description of changes

## Changes Made
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## Testing
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Responsive design verified

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #issue-number
```

### Code Review Process

1. **Assign reviewers**
2. **Address feedback**
3. **Update branch if needed**:
   ```bash
   git add .
   git commit -m "address PR feedback: update validation logic"
   git push origin feature/your-feature-name
   ```

4. **Merge after approval**

## 📚 Common Commands Reference

### Daily Workflow Commands
```bash
# Check current status
git status
git branch --show-current

# Update main branch
git checkout main
git pull origin main

# Create new feature branch
git checkout -b feature/new-feature

# Stage and commit changes
git add .
git commit -m "commit message"

# Push changes
git push origin feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature
git push origin main
```

### Collaboration Commands
```bash
# Get latest changes from remote
git fetch origin
git pull origin main

# Rebase your feature branch on latest main
git checkout feature/your-feature
git rebase main

# Sync your feature branch with remote changes
git pull origin feature/your-feature

# Stash uncommitted changes temporarily
git stash
git stash pop
```

### Branch Management
```bash
# List all branches
git branch -a

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Rename current branch
git branch -m new-branch-name
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. Merge Conflicts
```bash
# When conflicts occur during merge
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git commit -m "resolve merge conflicts"
```

#### 2. Accidental Commits to Main
```bash
# Move last commit to a new branch
git branch feature/accidental-work
git reset --hard HEAD~1
git checkout feature/accidental-work
```

#### 3. Forgot to Create Feature Branch
```bash
# Move uncommitted changes to new branch
git stash
git checkout -b feature/new-branch
git stash pop
```

#### 4. Need to Update Feature Branch with Latest Main
```bash
git checkout main
git pull origin main
git checkout feature/your-branch
git rebase main
# or
git merge main
```

#### 5. Wrong Commit Message
```bash
# Amend last commit message
git commit --amend -m "corrected commit message"

# Only if you haven't pushed yet!
```

## 🎯 Best Practices

### Do's ✅
- Always work on feature branches
- Write descriptive commit messages
- Keep commits atomic (one logical change per commit)
- Pull latest main before creating new branches
- Test your changes before committing
- Use consistent naming conventions
- Document breaking changes

### Don'ts ❌
- Don't commit directly to main
- Don't commit broken code
- Don't use generic commit messages like "fix stuff"
- Don't commit large binary files
- Don't force push to shared branches
- Don't leave commented-out code

## 📋 Pre-commit Checklist

Before every commit, ensure:
- [ ] Code compiles without errors
- [ ] No console errors in browser
- [ ] Functionality works as expected
- [ ] Code follows project style guidelines
- [ ] Commit message is descriptive
- [ ] No sensitive data (API keys, passwords) included

## 🔧 Project-Specific Notes

### ElithPharmacy Frontend
- **Framework**: React + Vite
- **Key directories**: `/src`, `/public`
- **Important files**: `package.json`, `vite.config.js`
- **Database**: Supabase integration

### Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📞 Getting Help

If you encounter issues:
1. Check this guide first
2. Search existing GitHub issues
3. Ask in team chat/Slack
4. Create new issue if problem persists

**Remember**: When in doubt, ask! It's better to clarify than to break something.

---

*This guide is a living document. Update it as our workflow evolves!* 