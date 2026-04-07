import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type InterviewSocketConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'

export type InterviewSessionEventType =
  | 'session:start'
  | 'session:end'
  | 'session:evaluating'
  | 'session:feedback-ready'

export interface InterviewSocketMessage<TPayload = unknown> {
  type: string
  payload?: TPayload
  [key: string]: unknown
}

export interface InterviewSessionEvent<TPayload = unknown> {
  type: InterviewSessionEventType
  payload?: TPayload
  receivedAtIso: string
}

export interface UseInterviewSocketOptions {
  url: string
  protocols?: string | string[]
  enabled?: boolean
  reconnectIntervalMs?: number
  maxReconnectIntervalMs?: number
  maxReconnectAttempts?: number
  onMessage?: (message: InterviewSocketMessage, event: MessageEvent) => void
  onSessionEvent?: (event: InterviewSessionEvent) => void
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
}

export interface UseInterviewSocketResult {
  connectionState: InterviewSocketConnectionState
  isConnected: boolean
  reconnectAttempt: number
  lastMessage: InterviewSocketMessage | null
  sendMessage: (message: InterviewSocketMessage | string) => boolean
  disconnect: () => void
  reconnect: () => void
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const mapToSessionEventType = (message: InterviewSocketMessage): InterviewSessionEventType | null => {
  if (message.type === 'session:start') {
    return 'session:start'
  }

  if (message.type === 'session:end') {
    return 'session:end'
  }

  if (message.type === 'session:evaluating') {
    return 'session:evaluating'
  }

  if (message.type === 'session:feedback-ready') {
    return 'session:feedback-ready'
  }

  if (message.type === 'session:event' && typeof message.event === 'string') {
    if (message.event === 'start') {
      return 'session:start'
    }

    if (message.event === 'end') {
      return 'session:end'
    }

    if (message.event === 'evaluating') {
      return 'session:evaluating'
    }

    if (message.event === 'feedback-ready') {
      return 'session:feedback-ready'
    }
  }

  return null
}

const parseIncomingMessage = (rawData: unknown): InterviewSocketMessage => {
  if (typeof rawData === 'string') {
    try {
      const parsedData = JSON.parse(rawData) as unknown
      if (isRecord(parsedData) && typeof parsedData.type === 'string') {
        return parsedData as InterviewSocketMessage
      }

      return { type: 'message:text', payload: rawData }
    } catch {
      return { type: 'message:text', payload: rawData }
    }
  }

  if (isRecord(rawData) && typeof rawData.type === 'string') {
    return rawData as InterviewSocketMessage
  }

  return { type: 'message:unknown', payload: rawData }
}

export function useInterviewSocket({
  url,
  protocols,
  enabled = true,
  reconnectIntervalMs = 1000,
  maxReconnectIntervalMs = 12000,
  maxReconnectAttempts = 10,
  onMessage,
  onSessionEvent,
  onOpen,
  onClose,
  onError,
}: UseInterviewSocketOptions): UseInterviewSocketResult {
  const [connectionState, setConnectionState] = useState<InterviewSocketConnectionState>('idle')
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const [lastMessage, setLastMessage] = useState<InterviewSocketMessage | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const connectRef = useRef<() => void>(() => undefined)
  const reconnectTimerRef = useRef<number | null>(null)
  const manuallyClosedRef = useRef(false)
  const reconnectAttemptRef = useRef(0)

  const onMessageRef = useRef(onMessage)
  const onSessionEventRef = useRef(onSessionEvent)
  const onOpenRef = useRef(onOpen)
  const onCloseRef = useRef(onClose)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onMessageRef.current = onMessage
    onSessionEventRef.current = onSessionEvent
    onOpenRef.current = onOpen
    onCloseRef.current = onClose
    onErrorRef.current = onError
  }, [onClose, onError, onMessage, onOpen, onSessionEvent])

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    manuallyClosedRef.current = true
    clearReconnectTimer()

    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    setConnectionState('closed')
  }, [clearReconnectTimer])

  const connect = useCallback(() => {
    if (!enabled || !url) {
      return
    }

    clearReconnectTimer()

    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    const nextState: InterviewSocketConnectionState =
      reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting'
    setConnectionState(nextState)

    const socket = new WebSocket(url, protocols)
    socketRef.current = socket

    socket.onopen = (event) => {
      reconnectAttemptRef.current = 0
      setReconnectAttempt(0)
      setConnectionState('open')
      onOpenRef.current?.(event)
    }

    socket.onmessage = (event) => {
      const parsedMessage = parseIncomingMessage(event.data)
      setLastMessage(parsedMessage)
      onMessageRef.current?.(parsedMessage, event)

      const sessionEventType = mapToSessionEventType(parsedMessage)
      if (sessionEventType) {
        onSessionEventRef.current?.({
          type: sessionEventType,
          payload: parsedMessage.payload,
          receivedAtIso: new Date().toISOString(),
        })
      }
    }

    socket.onerror = (event) => {
      onErrorRef.current?.(event)
    }

    socket.onclose = (event) => {
      onCloseRef.current?.(event)
      socketRef.current = null

      if (manuallyClosedRef.current || !enabled) {
        setConnectionState('closed')
        return
      }

      if (reconnectAttemptRef.current >= maxReconnectAttempts) {
        setConnectionState('closed')
        return
      }

      reconnectAttemptRef.current += 1
      setReconnectAttempt(reconnectAttemptRef.current)

      const reconnectDelay = Math.min(
        reconnectIntervalMs * 2 ** (reconnectAttemptRef.current - 1),
        maxReconnectIntervalMs,
      )

      setConnectionState('reconnecting')
      reconnectTimerRef.current = window.setTimeout(() => {
        connectRef.current()
      }, reconnectDelay)
    }
  }, [
    clearReconnectTimer,
    enabled,
    maxReconnectAttempts,
    maxReconnectIntervalMs,
    protocols,
    reconnectIntervalMs,
    url,
  ])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const reconnect = useCallback(() => {
    manuallyClosedRef.current = false
    reconnectAttemptRef.current = 0
    setReconnectAttempt(0)
    connectRef.current()
  }, [])

  const sendMessage = useCallback((message: InterviewSocketMessage | string) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message)
    socket.send(payload)
    return true
  }, [])

  useEffect(() => {
    manuallyClosedRef.current = false

    if (enabled && url) {
      connectRef.current()
    }

    return () => {
      disconnect()
    }
  }, [disconnect, enabled, url])

  return useMemo(
    () => ({
      connectionState,
      isConnected: connectionState === 'open',
      reconnectAttempt,
      lastMessage,
      sendMessage,
      disconnect,
      reconnect,
    }),
    [connectionState, disconnect, lastMessage, reconnect, reconnectAttempt, sendMessage],
  )
}



