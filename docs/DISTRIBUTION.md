# Binary Distribution Best Practices

This document explains the binary distribution strategy for the Grab application and the rationale behind our approach.

## Summary

**We DO NOT commit built binaries to the git repository.** Instead, we use:
1. **GitHub Actions Artifacts** for development builds (90-day retention)
2. **GitHub Releases** for stable, versioned releases (permanent)

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

### Development Builds (main branch)

**Location**: GitHub Actions Artifacts  
**Retention**: 90 days  
**Access**: Actions tab → Workflow run → Artifacts section

**Advantages:**
- ✅ Available immediately after every commit
- ✅ Automatically built by CI/CD
- ✅ Verified to match source code
- ✅ No repository bloat
- ✅ 90-day retention for recent development

**How to Download:**
```
1. Visit: https://github.com/akv004/grab/actions/workflows/build.yml
2. Click on latest successful run (green checkmark)
3. Scroll to "Artifacts" section
4. Download for your platform
```

### Stable Releases (tagged versions)

**Location**: GitHub Releases  
**Retention**: Permanent  
**Access**: Releases page

**Advantages:**
- ✅ Permanent storage
- ✅ Versioned and tagged
- ✅ Release notes included
- ✅ Easy discovery
- ✅ Direct download links

**How to Download:**
```
1. Visit: https://github.com/akv004/grab/releases
2. Find the desired version
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
3. **Artifact Upload**: Stores builds in GitHub Actions (90 days)
4. **Release**: Attaches binaries to GitHub Releases (for tags)

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

**Q: Why 90 days instead of 7 days?**  
A: 90 days provides a better balance between storage and accessibility. Users have more time to download development builds.

**Q: Can I download old development builds?**  
A: Only builds from the last 90 days are available. For older versions, use tagged releases.

**Q: How do I download artifacts programmatically?**  
A: Use the GitHub API or the `gh` CLI tool:
```bash
gh run download <run-id> --name macos-binaries
```

**Q: Why not use a `dist/` directory in the repository?**  
A: Committing to `dist/` still causes repository bloat. It's better to use GitHub's built-in artifact and release features.

**Q: What about users who don't have GitHub accounts?**  
A: Development builds require a GitHub account to download. For public access, use tagged releases on the Releases page (no account required).

## References

- [GitHub Actions Artifacts Documentation](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Git Best Practices: Don't Commit Large Files](https://git-scm.com/docs/gitattributes)
