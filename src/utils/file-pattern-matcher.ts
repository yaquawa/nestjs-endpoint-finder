import { SettingsManager } from '../config/settings'

export class FilePatternMatcher {
  /**
   * ファイルがコントローラーファイルかどうかを判定します
   * @param filePath 判定対象のファイルパス
   * @returns コントローラーファイルの場合はtrue
   */
  static isControllerFile(filePath: string): boolean {
    const config = SettingsManager.getConfig()

    // 除外パターンを先にチェック
    if (this.matchesAnyPattern(filePath, config.excludePatterns)) {
      return false
    }

    // filePatterns でマッチしたファイルは全て対象
    // 実際の @Controller decorator の存在確認は AST parsing で行う
    return true
  }

  /**
   * ファイルパスが指定されたパターンのいずれかにマッチするかチェック
   * @param filePath チェック対象のファイルパス
   * @param patterns マッチパターンの配列
   * @returns いずれかのパターンにマッチする場合はtrue
   */
  private static matchesAnyPattern(filePath: string, patterns: string[]): boolean {
    return patterns.some(pattern => this.matchesGlobPattern(filePath, pattern))
  }

  /**
   * シンプルなglob パターンマッチング
   * @param filePath 対象ファイルパス
   * @param pattern globパターン
   * @returns マッチする場合はtrue
   */
  private static matchesGlobPattern(filePath: string, pattern: string): boolean {
    // VSCode の workspace.findFiles が複雑なパターンを処理するので
    // ここでは基本的なパターンマッチングのみ実装

    if (pattern.includes('**')) {
      // ** パターンの処理
      const simplifiedPattern = pattern.replace(/\*\*/g, '.*')
      const regex = new RegExp(simplifiedPattern.replace(/\*/g, '[^/]*'))
      return regex.test(filePath)
    }

    if (pattern.includes('*')) {
      // * パターンの処理
      const regex = new RegExp(pattern.replace(/\*/g, '[^/]*'))
      return regex.test(filePath)
    }

    // 完全一致またはサブストリング一致
    return filePath.includes(pattern)
  }
}
