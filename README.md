# NestJS Endpoint Finder

A powerful VS Code extension that helps you quickly find and navigate to NestJS endpoints in your codebase. With fuzzy search capabilities and an intuitive interface, you can instantly locate any controller endpoint.

![Demo](resources/images/demo.gif)

## ✨ Features

- **🔍 Fast Fuzzy Search**: Quickly find endpoints using fuzzy search with fzf integration
- **🎯 Instant Navigation**: Jump directly to endpoint definitions with a single click
- **📋 Copy Endpoint Paths**: Copy HTTP endpoint paths to clipboard
- **🔄 Real-time Updates**: Automatic detection of file changes and endpoint updates
- **⚙️ Configurable**: Customize file patterns and exclude directories
- **🎨 Beautiful UI**: Clean, responsive interface with syntax highlighting

## 🚀 Getting Started

### Installation

1. Install the extension from the VS Code Marketplace
2. Open a NestJS project in VS Code
3. The extension will automatically activate and scan your project

### Usage

#### Method 1: Activity Bar

1. Click on the "NestJS Endpoints" icon in the Activity Bar
2. Use the search box to find endpoints
3. Click on any endpoint to navigate to its definition
4. Right-click on any endpoint to copy its path to clipboard

#### Method 2: Command Palette

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Search NestJS Endpoints"
3. Use the search interface to find and navigate to endpoints

#### Method 3: Keyboard Shortcut

- Press `Ctrl+Shift+\` to open the search interface directly

## 🎯 What It Finds

The extension automatically detects and indexes:

- **Controllers**: Classes decorated with `@Controller()`
- **HTTP Methods**: `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`, `@Options()`, `@Head()`
- **Route Parameters**: Dynamic route segments like `:id`, `:userId`
- **Path Prefixes**: Controller-level route prefixes
- **Full Endpoint Paths**: Complete HTTP paths for easy reference

## ⚙️ Configuration

Configure the extension through VS Code settings:

### File Patterns

Specify which files to scan for NestJS endpoints:

```json
{
  "nestjsEndpoints.filePatterns": ["src/**/*.controller.ts"]
}
```

### Exclude Patterns

Specify directories and files to exclude from scanning:

```json
{
  "nestjsEndpoints.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/coverage/**",
    "**/*.spec.ts",
    "**/*.test.ts"
  ]
}
```

## 🛠️ Technical Details

### Architecture

- **AST Parsing**: Uses TypeScript AST for accurate endpoint detection
- **File Watching**: Real-time monitoring of file changes
- **Fuzzy Search**: Powered by fzf for fast, intelligent search
- **React UI**: Modern, responsive interface built with React

### Performance

- **Caching**: Intelligent caching system for fast repeated searches
- **Incremental Updates**: Only re-scans changed files
- **Background Processing**: Non-blocking endpoint detection

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Reporting bugs
- Suggesting features
- Submitting pull requests
- Development setup

## 📝 License

This extension is licensed under the MIT License. See the LICENSE file for details.

## 🙋‍♂️ Support

If you encounter any issues or have questions:

1. Check the [FAQ](#faq) section below
2. Search existing [GitHub Issues](https://github.com/nestjs-tools/nestjs-endpoint-finder/issues)
3. Create a new issue with detailed information

## 🔧 FAQ

### Q: The extension doesn't find my endpoints

**A:** Make sure your controller files match the configured file patterns in settings. By default, it looks for `**/*.controller.ts` files.

### Q: How do I exclude test files?

**A:** Add patterns like `**/*.spec.ts` and `**/*.test.ts` to the `nestjsEndpoints.excludePatterns` setting.

### Q: Can I search in other file types?

**A:** Yes! Modify the `nestjsEndpoints.filePatterns` setting to include additional file patterns like `**/*.service.ts` or `**/*.module.ts`.

### Q: The search is slow in my large project

**A:** Use more specific file patterns and exclude unnecessary directories like `node_modules`, `dist`, and test directories in your settings.

## 🎉 What's New

### Version 0.0.1

- Initial release
- Fast fuzzy search for NestJS endpoints
- Real-time file watching and updates
- Configurable file patterns and exclusions
- Beautiful React-based UI
- One-click navigation and copying

---

**Happy coding with NestJS! 🚀**
