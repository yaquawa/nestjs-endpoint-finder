import * as vscode from 'vscode'

export interface NestJSEndpointsConfig {
  filePatterns: string[]
  excludePatterns: string[]
}

export class SettingsManager {
  private static readonly CONFIG_SECTION = 'nestjsEndpoints'

  static getConfig(): NestJSEndpointsConfig {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION)

    return {
      // Remove default values - use package.json defaults
      filePatterns: config.get<string[]>('filePatterns') || [],
      excludePatterns: config.get<string[]>('excludePatterns') || [],
    }
  }

  static getFilePatterns(): string[] {
    return this.getConfig().filePatterns
  }

  static getExcludePatterns(): string[] {
    return this.getConfig().excludePatterns
  }

  static onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(this.CONFIG_SECTION)) {
        console.log('🔧 NestJS Endpoints configuration changed')
        callback()
      }
    })
  }
}
