# Binary Distribution Best Practices

This document explains the binary distribution strategy for the Grab application and the rationale behind our approach.

## Summary

**We DO NOT commit built binaries to the git repository.** Instead, we use:
1. **GitHub Releases** for both development builds (from main branch) and stable releases (from version tags)
2. **GitHub Actions Artifacts** as a backup for contributors/developers (90-day retention)

This approach ensures binaries are publicly accessible without requiring GitHub authentication while avoiding repository bloat.

## Why Not Commit Binaries to Git?

### Problems with Committing Binaries to Git

1. **Repository Bloat**
   - Binary files are large (100-200 MB per platform)
   - Git stores the full history of every binary version
   - A few binary commits can balloon the repository to gigabytes
   - Example: 10 commits × 3 platforms × 150 MB = ~4.5 GB repository

2. **Git Performance Issues**
   - Slower clones (downloading gigabytes)
   - Slower pulls and fetches
   - Increased storage costs
   - Poor experience for contributors

3. **Version Control Inefficiency**
   - Git is optimized for text diffs, not binaries
   - Binary diffs are inefficient
   - Cannot meaningfully review binary changes

4. **Build Reproducibility**
   - Committing binaries bypasses CI/CD validation
   - Risk of committing untested or malicious binaries
   - No guarantee binaries match source code

## Our Distribution Strategy

### Public Access for End Users

**Development Builds (Latest from main branch)**

**Primary Location**: GitHub Releases (special "latest" pre-release)  
**Fallback Location**: GitHub Actions Artifacts (for contributors)  
**Retention**: Permanent (overwrites previous "latest" release)  
**Access**: No GitHub authentication required

**Advantages:**
- ✅ Publicly accessible without GitHub account
- ✅ Available immediately after every commit
- ✅ Automatically built and verified by CI/CD
- ✅ No repository bloat
- ✅ Always points to the latest development build
- ✅ Easy discovery on Releases page

**How to Download (For End Users):**
```
1. Visit: https://github.com/akv004/grab/releases
2. Find "Latest Development Build" (marked as pre-release)
3. Download from "Assets" section
```

**How to Download (For Contributors - Artifacts):**
```
1. Visit: https://github.com/akv004/grab/actions/workflows/build.yml
2. Click on latest successful run (green checkmark)
3. Scroll to "Artifacts" section
4. Download for your platform (requires GitHub authentication)
```

**Note**: The "latest" development release is automatically updated with each push to the main branch, providing a stable download URL that always points to the most recent build.

### Stable Releases (tagged versions)

**Location**: GitHub Releases  
**Retention**: Permanent  
**Access**: Releases page (no authentication required)

**Advantages:**
- ✅ Permanent storage
- ✅ Versioned and tagged
- ✅ Release notes included
- ✅ Easy discovery
- ✅ Direct download links
- ✅ Publicly accessible

**How to Download:**
```
1. Visit: https://github.com/akv004/grab/releases
2. Find the desired version (e.g., v1.0.0)
3. Download from "Assets" section
```

## Distribution Formats by Platform

### macOS
- **`.dmg`** (Disk Image)
  - Standard macOS installer format
  - Drag-and-drop installation
  - Recommended for most users
  
- **`.zip`** (Archive)
  - Portable format
  - Manual extraction required
  - For advanced users or automation

### Linux
- **`.AppImage`** (Portable)
  - Universal format, works on most distributions
  - No installation required
  - Single executable file
  - Recommended for portability
  
- **`.deb`** (Debian Package)
  - For Debian, Ubuntu, and derivatives
  - System-level installation
  - Package manager integration
  - Recommended for Debian-based systems

### Windows
- **`.exe`** (NSIS Installer)
  - Standard Windows installer
  - Guided installation process
  - Start menu shortcuts
  - Recommended for most users
  
- **`.zip`** (Archive)
  - Portable format
  - No installation required
  - For advanced users or automation

## Alternative Distribution Methods

If you need different distribution approaches, consider:

### 1. GitHub Pages (gh-pages branch)
```yaml
# Publish to gh-pages branch for permanent hosting
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./release
```

**Pros**: Permanent, direct download URLs  
**Cons**: Still uses git, but in separate branch

### 2. External CDN/Storage
- Amazon S3
- Google Cloud Storage
- Azure Blob Storage
- DigitalOcean Spaces

**Pros**: Scalable, fast, doesn't use git  
**Cons**: Costs money, additional infrastructure

### 3. Package Managers
- Homebrew (macOS)
- Scoop/Chocolatey (Windows)
- APT/RPM repositories (Linux)
- npm (if packaging as CLI tool)

**Pros**: User-friendly, automatic updates  
**Cons**: Setup overhead, maintenance burden

## Workflow Configuration

Our current workflow (`build.yml`) handles:

1. **Build**: Compiles for all platforms (macOS, Linux, Windows)
2. **Test**: Ensures builds complete successfully
3. **Artifact Upload**: Stores builds in GitHub Actions (90 days) as a fallback for contributors
4. **Development Release**: Updates the "latest" pre-release on GitHub Releases (for main branch pushes)
5. **Stable Release**: Creates versioned releases on GitHub Releases (for version tags)

### Adjusting Retention Period

The artifact retention can be adjusted in `.github/workflows/build.yml`:

```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    retention-days: 90  # Change this value (1-90 days)
```

**Note**: Maximum retention is 90 days for GitHub Actions artifacts.

## FAQ

**Q: Why publish development builds to GitHub Releases instead of just using Artifacts?**  
A: GitHub Actions Artifacts require authentication to download, making them inaccessible to end users who don't have GitHub accounts. Publishing to Releases provides public access without authentication while maintaining all other benefits.

**Q: Can I download old development builds?**  
A: The "latest" development release is continuously updated with each main branch commit. For older specific builds, use GitHub Actions Artifacts (90-day retention) or create versioned releases with tags.

**Q: What's the difference between the "Latest Development Build" and versioned releases?**  
A: The "Latest Development Build" is automatically updated with each main branch commit and contains the newest features but may be unstable. Versioned releases (e.g., v1.0.0) are stable, tested releases intended for production use.

**Q: How do I download artifacts programmatically?**  
A: For GitHub Releases, use direct download URLs or the GitHub API. For Artifacts, use the `gh` CLI tool:
```bash
# Download from GitHub Releases (public)
curl -L -o grab-macos.dmg https://github.com/akv004/grab/releases/download/latest/grab-1.0.0.dmg

# Download from GitHub Actions Artifacts (requires authentication)
gh run download <run-id> --name macos-binaries
```

**Q: Why not use a `dist/` directory in the repository?**  
A: Committing to `dist/` still causes repository bloat. It's better to use GitHub's built-in artifact and release features.

**Q: What about users who don't have GitHub accounts?**  
A: With our updated strategy, both development builds ("Latest Development Build" pre-release) and stable releases are available on the Releases page without requiring a GitHub account. GitHub Actions Artifacts still require authentication but are primarily for contributors/developers.

## References

- [GitHub Actions Artifacts Documentation](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Git Best Practices: Don't Commit Large Files](https://git-scm.com/docs/gitattributes)
