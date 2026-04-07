import { useCallback, useRef, useState } from 'react'

export interface AudioRecorderState {
  isRecording: boolean
  recordedBlob: Blob | null
  error: string | null
}

export interface AudioRecorderControls {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  resetRecording: () => void
  state: AudioRecorderState
}

/**
 * Hook to handle audio recording using Browser MediaRecorder API.
 * Records audio as WebM/Ogg format compatible with the Q&A API.
 *
 * @returns AudioRecorderControls with start/stop/reset functions and state
 */
export function useAudioRecorder(): AudioRecorderControls {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    recordedBlob: null,
    error: null,
  })

  const startRecording = useCallback(async () => {
    try {
      // Clear previous error state
      setState((prev) => ({ ...prev, error: null }))

      // Request microphone access
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      mediaStreamRef.current = mediaStream
      audioChunksRef.current = []

      // Create MediaRecorder with best available codec
      const mimeType = getPreferredMimeType()
      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        setState((prev) => ({
          ...prev,
          error: `Recording error: ${event.error}`,
          isRecording: false,
        }))
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder

      setState((prev) => ({
        ...prev,
        isRecording: true,
        recordedBlob: null,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording.'
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isRecording: false,
      }))
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      const mediaStream = mediaStreamRef.current

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        setState((prev) => ({
          ...prev,
          isRecording: false,
        }))
        resolve(null)
        return
      }

      mediaRecorder.onstop = () => {
        // Stop all media stream tracks
        mediaStream?.getTracks().forEach((track) => track.stop())

        // Combine audio chunks into a single blob
        const mimeType = getPreferredMimeType()
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType })

        setState((prev) => ({
          ...prev,
          isRecording: false,
          recordedBlob,
        }))

        resolve(recordedBlob)
      }

      mediaRecorder.stop()
    })
  }, [])

  const resetRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current
    const mediaStream = mediaStreamRef.current

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }

    mediaStream?.getTracks().forEach((track) => track.stop())

    mediaRecorderRef.current = null
    mediaStreamRef.current = null
    audioChunksRef.current = []

    setState({
      isRecording: false,
      recordedBlob: null,
      error: null,
    })
  }, [])

  return {
    startRecording,
    stopRecording,
    resetRecording,
    state,
  }
}

/**
 * Get the best supported MIME type for audio recording.
 * Falls back to common formats if specific one is not supported.
 */
function getPreferredMimeType(): string {
  const mimeTypes = [
    'audio/webm', // Preferred: widely supported, good compression
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType
    }
  }

  // Fallback to default (browser will choose codec)
  return ''
}

