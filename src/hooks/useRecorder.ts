import { useCallback, useEffect, useRef, useState } from 'react'

interface RecorderState {
  isRecording: boolean
  isMicrophoneActive: boolean
  recordedBlob: Blob | null
  error: string | null
  durationSeconds: number
  waveformLevels: number[]
}

interface UseRecorderResult {
  state: RecorderState
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  resetRecording: () => void
  retryRecording: () => Promise<void>
}

const WAVEFORM_BARS = 16

export function useRecorder(): UseRecorderResult {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const durationIntervalRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    isMicrophoneActive: false,
    recordedBlob: null,
    error: null,
    durationSeconds: 0,
    waveformLevels: Array.from({ length: WAVEFORM_BARS }, () => 4),
  })

  const stopVisualizers = useCallback(() => {
    if (durationIntervalRef.current !== null) {
      window.clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    startTimeRef.current = null
  }, [])

  const updateWaveform = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) {
      return
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)

    const chunkSize = Math.max(1, Math.floor(dataArray.length / WAVEFORM_BARS))
    const nextLevels = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, dataArray.length)
      let sum = 0

      for (let j = start; j < end; j += 1) {
        sum += dataArray[j]
      }

      const average = sum / Math.max(1, end - start)
      return Math.max(4, Math.min(100, Math.round((average / 255) * 100)))
    })

    setState((prev) => ({ ...prev, waveformLevels: nextLevels }))
    animationFrameRef.current = window.requestAnimationFrame(updateWaveform)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        error: null,
        recordedBlob: null,
        durationSeconds: 0,
      }))

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

      const mimeType = getPreferredMimeType()
      const mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined)

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
          isMicrophoneActive: false,
        }))
        stopVisualizers()
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      startTimeRef.current = Date.now()

      durationIntervalRef.current = window.setInterval(() => {
        if (startTimeRef.current === null) {
          return
        }
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setState((prev) => ({ ...prev, durationSeconds: elapsedSeconds }))
      }, 250)

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 64
      const source = audioContext.createMediaStreamSource(mediaStream)
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      animationFrameRef.current = window.requestAnimationFrame(updateWaveform)

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isMicrophoneActive: true,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isMicrophoneActive: false,
        error: error instanceof Error ? error.message : 'Failed to start recording.',
      }))
      stopVisualizers()
    }
  }, [stopVisualizers, updateWaveform])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      const mediaStream = mediaStreamRef.current

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        setState((prev) => ({
          ...prev,
          isRecording: false,
          isMicrophoneActive: false,
        }))
        stopVisualizers()
        resolve(null)
        return
      }

      mediaRecorder.onstop = () => {
        mediaStream?.getTracks().forEach((track) => track.stop())

        const mimeType = getPreferredMimeType() || 'audio/webm'
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType })

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isMicrophoneActive: false,
          recordedBlob,
          waveformLevels: Array.from({ length: WAVEFORM_BARS }, () => 4),
        }))

        stopVisualizers()
        resolve(recordedBlob)
      }

      mediaRecorder.stop()
    })
  }, [stopVisualizers])

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

    stopVisualizers()

    setState({
      isRecording: false,
      isMicrophoneActive: false,
      recordedBlob: null,
      error: null,
      durationSeconds: 0,
      waveformLevels: Array.from({ length: WAVEFORM_BARS }, () => 4),
    })
  }, [stopVisualizers])

  const retryRecording = useCallback(async () => {
    resetRecording()
    await startRecording()
  }, [resetRecording, startRecording])

  useEffect(() => {
    return () => {
      resetRecording()
    }
  }, [resetRecording])

  return {
    state,
    startRecording,
    stopRecording,
    resetRecording,
    retryRecording,
  }
}

function getPreferredMimeType(): string {
  const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType
    }
  }

  return ''
}

