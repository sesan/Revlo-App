import { useCallback, useEffect, useRef, useState } from 'react';

interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type RecognitionCtor = new () => RecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  }
}

interface StartListeningOptions {
  language?: string;
  onFinalTranscript: (transcript: string) => void;
}

interface StopListeningOptions {
  process?: boolean;
}

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function getSpeechErrorMessage(errorCode?: string): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission was denied. Enable mic access and try again.';
    case 'audio-capture':
      return 'No microphone was found. Connect a microphone and try again.';
    case 'network':
      return 'Network error while transcribing. Check connection and retry.';
    case 'no-speech':
      return 'No speech detected. Try speaking closer to your microphone.';
    default:
      return 'Voice transcription failed. Please try again.';
  }
}

export function useSpeechToText() {
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const onFinalTranscriptRef = useRef<((transcript: string) => void) | null>(null);
  const shouldProcessRef = useRef(true);

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(!!getRecognitionCtor());
  }, []);

  const stopListening = useCallback((options?: StopListeningOptions) => {
    shouldProcessRef.current = options?.process ?? true;
    recognitionRef.current?.stop();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const startListening = useCallback((options: StartListeningOptions): boolean => {
    const RecognitionCtor = getRecognitionCtor();
    if (!RecognitionCtor) {
      setError('Voice transcription is not supported on this browser.');
      return false;
    }

    try {
      shouldProcessRef.current = false;
      recognitionRef.current?.stop();

      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = options.language ?? 'en-US';
      recognition.maxAlternatives = 1;

      finalTranscriptRef.current = '';
      onFinalTranscriptRef.current = options.onFinalTranscript;
      shouldProcessRef.current = true;
      setError(null);

      recognition.onresult = (event: any) => {
        let finalText = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0]?.transcript ?? '';
          if (event.results[i].isFinal) {
            finalText += `${transcript} `;
          }
        }

        finalTranscriptRef.current = finalText;
      };

      recognition.onerror = (event: any) => {
        setError(getSpeechErrorMessage(event?.error));
      };

      recognition.onend = () => {
        setIsListening(false);
        const shouldProcess = shouldProcessRef.current;
        shouldProcessRef.current = true;
        const transcript = finalTranscriptRef.current.trim();
        if (shouldProcess && transcript && onFinalTranscriptRef.current) {
          onFinalTranscriptRef.current(transcript);
        }
        finalTranscriptRef.current = '';
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      return true;
    } catch (err) {
      console.error('Unable to start speech recognition:', err);
      setError('Unable to start microphone. Please try again.');
      setIsListening(false);
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    isListening,
    isSupported,
    error,
    clearError,
    startListening,
    stopListening
  };
}
