import * as typescript from 'typescript'
import * as fs from 'fs'
import * as vscode from 'vscode'
import type { EndpointInfo, ControllerInfo, ParameterInfo } from '../types'

export class ASTParser {
  private readonly httpMethods: Set<string> = new Set([
    'Get',
    'Post',
    'Put',
    'Delete',
    'Patch',
    'Head',
    'Options',
    'All',
  ])

  parseFile(filePath: string): ControllerInfo | null {
    try {
      console.log(`🔍 AST Parser: Parsing file: ${filePath}`)
      console.log(`⏰ Parse timestamp: ${new Date().toISOString()}`)

      // Use VSCode API to get the most current content
      let content: string
      let sourceType = 'unknown'
      try {
        const document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filePath)
        console.log(`📋 Found ${vscode.workspace.textDocuments.length} open documents in VSCode`)
        console.log(`🔍 Looking for document: ${filePath}`)
        console.log(
          `📄 Available documents:`,
          vscode.workspace.textDocuments.map(
            d => `${d.uri.fsPath} (isDirty: ${d.isDirty}, isClosed: ${d.isClosed})`
          )
        )

        if (document && !document.isClosed) {
          // If file is open in VSCode, use the in-memory content
          content = document.getText()
          sourceType = `VSCode in-memory (isDirty: ${document.isDirty}, version: ${document.version})`
          console.log(`📝 Using in-memory content from VSCode`)
          console.log(
            `📝 Document details: isDirty=${document.isDirty}, isClosed=${document.isClosed}, version=${document.version}`
          )
          console.log(`📝 Content length: ${content.length}`)
          console.log(`📝 Content preview (first 200 chars): ${content.substring(0, 200)}...`)
        } else {
          // Otherwise read from disk
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          content = fs.readFileSync(filePath, 'utf-8')
          sourceType = 'disk file'
          console.log(`💾 Reading from disk`)
          console.log(`💾 Content length: ${content.length}`)
          console.log(`💾 Content preview (first 200 chars): ${content.substring(0, 200)}...`)
        }
      } catch (fsError) {
        console.log(`⚠️ Could not read file, using fs fallback: ${fsError}`)
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        content = fs.readFileSync(filePath, 'utf-8')
        sourceType = 'fs fallback'
      }

      console.log(`📖 Content source: ${sourceType}`)

      const sourceFile = typescript.createSourceFile(
        filePath,
        content,
        typescript.ScriptTarget.Latest,
        true
      )

      const result = this.extractControllerInfo(sourceFile, filePath)
      console.log(`Parse result for ${filePath}:`, result)
      return result
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error)
      return null
    }
  }

  private extractControllerInfo(
    sourceFile: typescript.SourceFile,
    filePath: string
  ): ControllerInfo | null {
    let controllerInfo: ControllerInfo | null = null
    console.log(`Extracting controller info from ${filePath}`)

    const visit = (node: typescript.Node) => {
      if (typescript.isClassDeclaration(node)) {
        console.log(`Found class declaration: ${node.name?.text}`)
        const controllerDecorator = this.findControllerDecorator(node)
        console.log(`Controller decorator found:`, !!controllerDecorator)

        if (controllerDecorator) {
          const basePath = this.extractPathFromDecorator(controllerDecorator)
          const controllerName = node.name?.text || 'UnknownController'
          console.log(`Creating controller info: ${controllerName}, basePath: ${basePath}`)

          controllerInfo = {
            name: controllerName,
            basePath,
            filePath,
            endpoints: [],
          }

          const endpoints = this.extractEndpoints(node, controllerInfo, sourceFile)
          console.log(`Extracted ${endpoints.length} endpoints`)
          controllerInfo.endpoints = endpoints
          return
        }
      }
      typescript.forEachChild(node, visit)
    }

    visit(sourceFile)
    return controllerInfo
  }

  private findControllerDecorator(
    classNode: typescript.ClassDeclaration
  ): typescript.Decorator | null {
    const decorators =
      (classNode as typescript.ClassDeclaration & { decorators?: readonly typescript.Decorator[] })
        .decorators ||
      (classNode.modifiers?.filter(mod => mod.kind === typescript.SyntaxKind.Decorator) as
        | typescript.Decorator[]
        | undefined)
    console.log(`Class decorators:`, decorators?.length || 0)

    if (!decorators) return null

    for (const decorator of decorators) {
      console.log(`Checking decorator:`, decorator)
      if (typescript.isCallExpression(decorator.expression)) {
        const expression = decorator.expression.expression
        console.log(`Call expression:`, expression)
        if (typescript.isIdentifier(expression)) {
          console.log(`Identifier text:`, expression.text)
          if (expression.text === 'Controller') {
            return decorator
          }
        }
      }
    }
    return null
  }

  private extractPathFromDecorator(decorator: typescript.Decorator): string {
    if (
      typescript.isCallExpression(decorator.expression) &&
      decorator.expression.arguments.length > 0
    ) {
      const firstArg = decorator.expression.arguments[0]

      // Handle string literal: @Controller('path')
      if (typescript.isStringLiteral(firstArg)) {
        return firstArg.text
      }

      // Handle object literal: @Controller({ path: 'path' })
      if (typescript.isObjectLiteralExpression(firstArg)) {
        return this.extractPathFromObjectLiteral(firstArg)
      }
    }
    return ''
  }

  private extractPathFromObjectLiteral(objectLiteral: typescript.ObjectLiteralExpression): string {
    for (const property of objectLiteral.properties) {
      if (typescript.isPropertyAssignment(property)) {
        const name = property.name

        // Check if property name is 'path'
        if (typescript.isIdentifier(name) && name.text === 'path') {
          const initializer = property.initializer
          if (typescript.isStringLiteral(initializer)) {
            return initializer.text
          }
        }

        // Also check for quoted property names
        if (typescript.isStringLiteral(name) && name.text === 'path') {
          const initializer = property.initializer
          if (typescript.isStringLiteral(initializer)) {
            return initializer.text
          }
        }
      }
    }
    return ''
  }

  private extractEndpoints(
    classNode: typescript.ClassDeclaration,
    controllerInfo: ControllerInfo,
    sourceFile: typescript.SourceFile
  ): EndpointInfo[] {
    const endpoints: EndpointInfo[] = []
    console.log(`Extracting endpoints from ${classNode.members.length} class members`)

    for (const [index, member] of classNode.members.entries()) {
      console.log(`Member ${index}: ${typescript.SyntaxKind[member.kind]}`)

      if (typescript.isMethodDeclaration(member)) {
        console.log(
          `Found method declaration: ${typescript.isIdentifier(member.name) ? member.name.text : 'unknown'}`
        )

        const decorators =
          (
            member as typescript.MethodDeclaration & {
              decorators?: readonly typescript.Decorator[]
            }
          ).decorators ||
          (member.modifiers?.filter(mod => mod.kind === typescript.SyntaxKind.Decorator) as
            | typescript.Decorator[]
            | undefined)
        console.log(`Method has ${decorators?.length || 0} decorators`)

        const httpDecorator = this.findHttpMethodDecorator(member)
        console.log(`HTTP decorator found:`, !!httpDecorator)

        if (httpDecorator) {
          const method = this.extractHttpMethod(httpDecorator)
          const path = this.extractPathFromDecorator(httpDecorator)
          const methodName = typescript.isIdentifier(member.name) ? member.name.text : 'unknown'

          const fullPath = this.combinePaths(controllerInfo.basePath, path)

          // Extract parameter information
          const parameters = this.extractParameters(member)
          const pathParameters = this.extractPathParameters(fullPath)

          // Get position of method name, not the start of decorators
          const methodNamePosition = typescript.isIdentifier(member.name)
            ? sourceFile.getLineAndCharacterOfPosition(member.name.getStart(sourceFile))
            : sourceFile.getLineAndCharacterOfPosition(member.getStart(sourceFile))

          console.log(
            `Creating endpoint: ${method} ${fullPath} -> ${methodName} at line ${methodNamePosition.line + 1}`
          )
          console.log(`Parameters:`, parameters)
          console.log(`Path parameters:`, pathParameters)

          endpoints.push({
            method: method.toUpperCase(),
            path,
            fullPath,
            filePath: controllerInfo.filePath,
            line: methodNamePosition.line + 1,
            column: methodNamePosition.character,
            controllerName: controllerInfo.name,
            methodName,
            parameters,
            pathParameters,
          })
        }
      }
    }

    return endpoints
  }

  private findHttpMethodDecorator(
    method: typescript.MethodDeclaration
  ): typescript.Decorator | null {
    const decorators =
      (method as typescript.MethodDeclaration & { decorators?: readonly typescript.Decorator[] })
        .decorators ||
      (method.modifiers?.filter(mod => mod.kind === typescript.SyntaxKind.Decorator) as
        | typescript.Decorator[]
        | undefined)
    console.log(`findHttpMethodDecorator: found ${decorators?.length || 0} decorators`)

    if (!decorators) return null

    for (const decorator of decorators) {
      console.log(`Checking decorator expression type:`, decorator.expression.kind)

      if (typescript.isCallExpression(decorator.expression)) {
        const expression = decorator.expression.expression
        console.log(
          `Call expression identifier:`,
          typescript.isIdentifier(expression) ? expression.text : 'not identifier'
        )

        if (typescript.isIdentifier(expression)) {
          console.log(
            `Checking if '${expression.text}' is in httpMethods:`,
            this.httpMethods.has(expression.text)
          )
          if (this.httpMethods.has(expression.text)) {
            return decorator
          }
        }
      } else if (typescript.isIdentifier(decorator.expression)) {
        console.log(`Direct identifier:`, decorator.expression.text)
        console.log(
          `Checking if '${decorator.expression.text}' is in httpMethods:`,
          this.httpMethods.has(decorator.expression.text)
        )

        if (this.httpMethods.has(decorator.expression.text)) {
          return decorator
        }
      }
    }
    return null
  }

  private extractHttpMethod(decorator: typescript.Decorator): string {
    if (typescript.isCallExpression(decorator.expression)) {
      const expression = decorator.expression.expression
      if (typescript.isIdentifier(expression)) {
        return expression.text
      }
    } else if (typescript.isIdentifier(decorator.expression)) {
      return decorator.expression.text
    }
    return 'GET'
  }

  private extractParameters(method: typescript.MethodDeclaration): ParameterInfo[] {
    const parameters: ParameterInfo[] = []

    if (!method.parameters) return parameters

    for (const param of method.parameters) {
      if (!typescript.isIdentifier(param.name)) continue

      const paramName = param.name.text
      let paramType: 'path' | 'query' | 'body' = 'query' // default
      let dataType: string | undefined

      // Check parameter decorators
      const decorators =
        (
          param as typescript.ParameterDeclaration & {
            decorators?: readonly typescript.Decorator[]
          }
        ).decorators ||
        (param.modifiers?.filter(mod => mod.kind === typescript.SyntaxKind.Decorator) as
          | typescript.Decorator[]
          | undefined)

      if (decorators) {
        for (const decorator of decorators) {
          if (typescript.isCallExpression(decorator.expression)) {
            const expression = decorator.expression.expression
            if (typescript.isIdentifier(expression)) {
              switch (expression.text) {
                case 'Param':
                  paramType = 'path'
                  break
                case 'Query':
                  paramType = 'query'
                  break
                case 'Body':
                  paramType = 'body'
                  break
              }
            }
          }
        }
      }

      // Extract data type
      if (param.type) {
        dataType = param.type.getText()
      }

      parameters.push({
        name: paramName,
        type: paramType,
        dataType,
        isOptional: !!param.questionToken,
      })
    }

    return parameters
  }

  private extractPathParameters(fullPath: string): string[] {
    const pathParams: string[] = []
    const paramRegex = /:([A-Z_a-z]\w*)/g
    let match

    while ((match = paramRegex.exec(fullPath)) !== null) {
      pathParams.push(match[1])
    }

    return pathParams
  }

  private combinePaths(basePath: string, endpointPath: string): string {
    const base = basePath.startsWith('/') ? basePath : `/${basePath}`
    const endpoint = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`

    if (endpointPath === '') {
      return base === '/' ? '/' : base
    }

    return base === '/' ? endpoint : `${base}${endpoint}`
  }
}
