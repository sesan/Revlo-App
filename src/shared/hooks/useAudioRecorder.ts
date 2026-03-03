import { useCallback, useEffect, useRef, useState } from 'react';

interface StartAudioRecordingOptions {
  onComplete: (audio: Blob) => Promise<void> | void;
}

interface StopAudioRecordingOptions {
  process?: boolean;
}

function getAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;

  const preferred = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ];

  return preferred.find((type) => MediaRecorder.isTypeSupported(type));
}

export function useAudioRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onCompleteRef = useRef<StartAudioRecordingOptions['onComplete'] | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const shouldProcessRef = useRef(true);

  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasSupport =
      typeof window !== 'undefined' &&
      typeof MediaRecorder !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia;
    setIsSupported(hasSupport);
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback((options?: StopAudioRecordingOptions) => {
    shouldProcessRef.current = options?.process ?? true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const startRecording = useCallback(async ({ onComplete }: StartAudioRecordingOptions): Promise<boolean> => {
    if (!isSupported) {
      setError('Audio recording is not supported on this browser.');
      return false;
    }

    try {
      clearError();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      onCompleteRef.current = onComplete;
      chunksRef.current = [];
      shouldProcessRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError('Unable to continue recording. Please try again.');
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        const blobType = recorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: blobType });
        cleanupStream();

        const shouldProcess = shouldProcessRef.current;
        shouldProcessRef.current = true;
        if (!shouldProcess) {
          chunksRef.current = [];
          return;
        }

        if (audioBlob.size === 0) {
          setError('No audio captured. Please try recording again.');
          return;
        }

        try {
          await onCompleteRef.current?.(audioBlob);
        } catch (err) {
          console.error('Audio completion handler failed:', err);
          setError('Failed to process recorded audio.');
        } finally {
          chunksRef.current = [];
        }
      };

      recorder.start();
      setIsRecording(true);
      return true;
    } catch (err: any) {
      console.error('Failed to start audio recording:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow mic access and try again.');
      } else {
        setError('Unable to start recording. Please try again.');
      }
      cleanupStream();
      setIsRecording(false);
      return false;
    }
  }, [clearError, cleanupStream, isSupported]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    isSupported,
    isRecording,
    error,
    clearError,
    startRecording,
    stopRecording
  };
}
