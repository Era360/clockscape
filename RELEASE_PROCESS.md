# ClockScape Release Process

This document describes the process for creating new releases of ClockScape.

## Release Workflow

ClockScape uses GitHub Actions to automate the release process. The workflow is defined in `.github/workflows/release.yml`.

## Current Release Configuration

- **Target Platforms**: Windows only (MSI and NSIS installers)
- **Release Type**: Draft releases (requires manual publishing)
- **Versioning**: Follows semantic versioning (MAJOR.MINOR.PATCH)

## Creating a New Release

1. Make sure all your changes are committed and pushed to the main branch.

2. Use one of the following commands to create a new version tag:

```bash
# For patch releases (bug fixes)
npm run release:patch

# For minor releases (new features)
npm run release:minor

# For major releases (breaking changes)
npm run release:major
```

These commands will:

- Update the version in package.json
- Create a new Git tag with the version
- Push the tag to GitHub

3. The GitHub Actions workflow will automatically trigger when the tag is pushed and:

   - Build the Windows installers (MSI and NSIS)
   - Create a draft release on GitHub
   - Attach the installers to the release

4. Go to the GitHub Releases page, edit the draft release:
   - Add detailed release notes
   - Verify the attached artifacts
   - Publish the release when ready

## Future Enhancements

To support additional platforms in the future:

1. Update the `matrix.platform` array in `.github/workflows/release.yml` to include:

   - `macos-latest` for macOS builds
   - `ubuntu-20.04` for Linux builds

2. Update the `targets` array in `src-tauri/tauri.conf.json` to include:
   - `"dmg"`, `"app"` for macOS
   - `"appimage"`, `"deb"` for Linux

## Troubleshooting

If the GitHub Actions workflow fails:

1. Check the workflow logs on GitHub for errors
2. Verify that your code builds locally with `npm run tauri build`
3. Ensure the version tag follows the format `v*.*.*` (e.g., `v0.1.0`)
