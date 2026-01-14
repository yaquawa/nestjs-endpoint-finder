import { useCallback, useMemo } from 'react'
import type {
  WebViewMessage,
  WebViewMessageType,
  ExtensionMessage,
  ExtensionMessageType,
  VSCodeAPI,
} from '../types'

// Singleton instance of VSCodeAPI
// This ensures we only call `acquireVsCodeApi` once.
let vscodeApi: VSCodeAPI | null = null

const getVSCodeAPI = (): VSCodeAPI => {
  if (!vscodeApi && typeof acquireVsCodeApi !== 'undefined') {
    vscodeApi = acquireVsCodeApi()
  }
  return vscodeApi!
}

export const useVSCodeAPI = () => {
  const api = getVSCodeAPI()

  const postMessage = useCallback(
    <T extends WebViewMessageType>(type: T, payload: WebViewMessage<T>['payload']) => {
      const message: WebViewMessage<T> = { type, payload }
      api.postMessage(message)
    },
    [api]
  )

  const onMessage = useCallback(
    <T extends ExtensionMessageType>(
      messageType: T,
      handler: (payload: ExtensionMessage<T>['payload']) => void
    ) => {
      const messageHandler = (event: MessageEvent) => {
        const message = event.data as ExtensionMessage
        if (message.type === messageType) {
          handler(message.payload as ExtensionMessage<T>['payload'])
        }
      }

      window.addEventListener('message', messageHandler)
      return () => window.removeEventListener('message', messageHandler)
    },
    []
  )

  return useMemo(
    () => ({
      postMessage,
      onMessage,
    }),
    [postMessage, onMessage]
  )
}
