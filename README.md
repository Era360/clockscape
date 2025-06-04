# ClockScape

![ClockScape Screenshot](./screenshot.png)

ClockScape is a beautiful FLiqlo-inspired flip clock screensaver application built with Tauri, React, and TypeScript. It offers a sleek, customizable flip clock display that fills your screen with an elegant time display.

## Features

- **Realistic Flip Animation**: Smooth card-flip animation similar to the popular FLiqlo screensaver
- **Full-Screen Clock**: Beautiful time display that fills your screen
- **Customization Options**:
  - Adjustable clock size
  - Toggle seconds display
  - Date display
  - System information widgets
  - Music player controls
- **System Integration**:
  - Battery status monitoring
  - CPU/RAM usage statistics
  - Music player integration

## Usage

### Basic Controls

- **ESC**: Toggle the widgets panel
- **Size Options**: Choose between Small, Medium, and Fullscreen modes
- **Widget Toggle**: Access system information and controls

## Development

This project is built using:

- [Tauri](https://tauri.app/) - For creating lightweight desktop applications
- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

### Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/clockscape.git
   cd clockscape
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run tauri dev
   ```

4. Build for production:
   ```bash
   npm run tauri build
   ```

## System Requirements

- Windows 10/11, macOS 10.15+, or Linux
- 64-bit architecture

## Release Process

ClockScape uses GitHub Actions to automate the release process. Here's how to create a new release:

1. Make sure all your changes are committed and pushed to the main branch.

2. Use one of the following commands to create a new version tag, depending on the type of release:

   ```bash
   # For patch releases (bug fixes)
   npm run release:patch

   # For minor releases (new features)
   npm run release:minor

   # For major releases (breaking changes)
   npm run release:major
   ```

3. The GitHub Actions workflow will automatically:
   - Build the application for Windows
   - Create a draft release on GitHub with Windows installers
   - Attach the MSI and NSIS installer files to the release

4. Go to the GitHub releases page, review the draft release, add release notes, and publish it.

## Acknowledgements

- Inspired by the [FLiqlo Clock Screensaver](https://fliqlo.com/)
- Built with [Tauri](https://tauri.app/)

## License

This project is licensed under the [MIT License](./LICENSE).
