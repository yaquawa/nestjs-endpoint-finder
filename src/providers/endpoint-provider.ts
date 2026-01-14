import { EventEmitter } from 'events'
import type { EndpointInfo, ControllerInfo } from '../types'
import type { EndpointScanner } from '../core/endpoint-scanner'

export class EndpointProvider extends EventEmitter {
  private allEndpoints: EndpointInfo[] = []
  private allControllers: ControllerInfo[] = []
  private static _instance: EndpointProvider | null = null

  private constructor(private readonly scanner: EndpointScanner) {
    super()
  }

  get endpoints(): EndpointInfo[] {
    return this.allEndpoints
  }

  get controllers(): ControllerInfo[] {
    return this.allControllers
  }

  static async getInstance(scanner: EndpointScanner): Promise<EndpointProvider> {
    if (!EndpointProvider._instance) {
      EndpointProvider._instance = new EndpointProvider(scanner)
      await EndpointProvider._instance.refreshEndpoints()
      return EndpointProvider._instance
    }

    return EndpointProvider._instance
  }

  async refreshEndpoints(): Promise<void> {
    console.log('🔄 EndpointProvider: Refreshing endpoints...')
    console.log('⏰ Current timestamp:', new Date().toISOString())

    try {
      const result = await this.scanner.scanWorkspace()
      console.log(
        `📊 Scanner returned: ${result.controllers.length} controllers, ${result.endpoints.length} endpoints`
      )

      // Compare with previous endpoints to see what changed
      const oldEndpointPaths = this.allEndpoints.map(ep => `${ep.method} ${ep.fullPath}`)
      const newEndpointPaths = result.endpoints.map(ep => `${ep.method} ${ep.fullPath}`)

      console.log('🔄 Endpoint comparison:')
      console.log('  Old endpoints:', oldEndpointPaths)
      console.log('  New endpoints:', newEndpointPaths)

      this.allEndpoints = result.endpoints
      this.allControllers = result.controllers

      // Check if endpoints actually changed
      const endpointsChanged = JSON.stringify(oldEndpointPaths) !== JSON.stringify(newEndpointPaths)

      if (endpointsChanged) {
        console.log('🔔 EndpointProvider: Endpoints changed, emitting endpointsChange event')
        this.emit('endpointsChange', this.allEndpoints)
      }

      console.log(`✅ EndpointProvider: Found ${this.allEndpoints.length} endpoints total`)

      if (this.allEndpoints.length > 0) {
        console.log('📋 Current endpoints list:')
        for (const [i, ep] of this.allEndpoints.entries()) {
          console.log(
            `  ${i + 1}. ${ep.method} ${ep.fullPath} (${ep.controllerName}.${ep.methodName}) from ${ep.filePath}`
          )
        }
      }
    } catch (error) {
      console.error('❌ Error during endpoint refresh:', error)
    }
  }

  dispose(): void {
    this.scanner.dispose()
  }
}
