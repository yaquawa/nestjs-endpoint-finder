import * as vscode from 'vscode'
import { ASTParser } from './ast-parser'
import type { EndpointInfo, ControllerInfo, ParseResult } from '../types'
import { SettingsManager } from '../config/settings'

export class EndpointScanner {
  private readonly parser: ASTParser
  private readonly cache: Map<string, ControllerInfo> = new Map()

  constructor() {
    this.parser = new ASTParser()
  }

  async scanWorkspace(): Promise<ParseResult> {
    const controllers: ControllerInfo[] = []
    const endpoints: EndpointInfo[] = []

    if (!vscode.workspace.workspaceFolders) {
      return { controllers, endpoints }
    }

    const config = SettingsManager.getConfig()

    for (const folder of vscode.workspace.workspaceFolders) {
      // Use configurable file patterns
      const patterns = config.filePatterns

      // Build exclude pattern
      const excludePattern = `{${config.excludePatterns.join(',')}}`

      let allFiles: vscode.Uri[] = []
      for (const pattern of patterns) {
        console.log(`🔍 Scanning pattern: ${pattern}, excluding: ${excludePattern}`)
        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(folder, pattern),
          excludePattern
        )
        allFiles = allFiles.concat(files)
      }

      // Remove duplicates
      const uniqueFiles = Array.from(new Set(allFiles.map(f => f.fsPath))).map(path =>
        vscode.Uri.file(path)
      )
      console.log(
        `🔍 Found ${uniqueFiles.length} controller/service files in ${folder.uri.fsPath}:`
      )
      for (const f of uniqueFiles) console.log(`  📄 ${f.fsPath}`)

      for (const file of uniqueFiles) {
        console.log(`🔎 Scanning file: ${file.fsPath}`)
        const controllerInfo = await this.scanFile(file.fsPath)
        if (controllerInfo) {
          console.log(
            `✅ Found controller: ${controllerInfo.name} with ${controllerInfo.endpoints.length} endpoints`
          )
          controllers.push(controllerInfo)
          endpoints.push(...controllerInfo.endpoints)
        } else {
          console.log(`❌ No controller found in: ${file.fsPath}`)
        }
      }
    }

    return { controllers, endpoints }
  }

  async scanFile(filePath: string, forceRefresh: boolean = false): Promise<ControllerInfo | null> {
    if (!forceRefresh) {
      const cachedInfo = this.cache.get(filePath)
      if (cachedInfo) {
        console.log(`📋 Using cached info for: ${filePath}`)
        return cachedInfo
      }
    } else {
      console.log(`🔄 Force refreshing cache for: ${filePath}`)
      this.invalidateCache(filePath)
    }

    try {
      console.log(`🔍 Parsing file: ${filePath}`)
      const controllerInfo = this.parser.parseFile(filePath)
      if (controllerInfo) {
        console.log(`✅ Found controller info for: ${filePath}, caching result`)
        this.cache.set(filePath, controllerInfo)
      } else {
        console.log(`❌ No controller found in: ${filePath}`)
      }
      return controllerInfo
    } catch (error) {
      console.error(`❌ Error scanning file ${filePath}:`, error)
      return null
    }
  }

  invalidateCache(filePath: string): void {
    console.log(`🗑️ Invalidating cache for: ${filePath}`)
    this.cache.delete(filePath)
  }

  dispose(): void {
    this.cache.clear()
  }
}
