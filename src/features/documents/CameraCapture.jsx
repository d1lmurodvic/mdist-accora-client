import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, UploadCloud } from 'lucide-react';
import { Modal } from '../../components/ui/Overlay.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Feedback.jsx';
import { precheckFile } from './api.js';
import styles from './Documents.module.css';

function cameraError(error) {
  if (error.name === 'NotAllowedError') return 'Camera permission was denied. Allow camera access in your browser, then try again.';
  if (error.name === 'NotFoundError') return 'No camera was found. Connect a webcam or choose a file instead.';
  if (error.name === 'NotReadableError') return 'The camera is busy or unavailable. Close other apps using it and try again.';
  return 'The camera could not start. Try again or choose a file instead.';
}

// Mounted only while open so closing always releases the camera and preview URL.
export function CameraCapture({ onClose, onCapture, onChooseFile }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mounted = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!photo) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (photo) return undefined;
    let cancelled = false;
    let stream;
    setReady(false);
    setError('');
    async function start() {
      if (!window.isSecureContext) {
        setError('Camera access requires a secure connection. Open Accora over HTTPS or localhost, or choose a file instead.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser does not support camera access. Try another browser or choose a file instead.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        stream.getVideoTracks().forEach((track) => track.addEventListener('ended', () => {
          if (!cancelled) { setReady(false); setError('Camera disconnected. Reconnect it and try again.'); }
        }));
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch (failure) {
        stream?.getTracks().forEach((track) => track.stop());
        if (!cancelled) setError(cameraError(failure));
      }
    }
    start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [attempt, photo]);

  async function capture() {
    const video = videoRef.current;
    if (!ready || busy || !video?.videoWidth || !video?.videoHeight) return;
    setBusy(true);
    setError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not capture this photo. Please try again.');
      context.drawImage(video, 0, 0);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!mounted.current) return;
      if (!blob) throw new Error('Could not capture this photo. Please try again.');
      const file = new File([blob], 'invoice-' + Date.now() + '.jpg', { type: 'image/jpeg' });
      const problem = precheckFile(file);
      if (problem) throw new Error(problem);
      setPhoto(file);
      setReady(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    } catch (failure) {
      if (mounted.current) setError(failure.message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Take a document photo" size="lg"
      description="Keep the whole invoice or receipt in frame. Check that the text is readable before uploading."
      footer={<>
        <Button variant="secondary" onClick={onChooseFile}>Choose file instead</Button>
        {photo ? <>
          <Button variant="secondary" icon={RotateCcw} onClick={() => setPhoto(null)}>Retake</Button>
          <Button icon={UploadCloud} onClick={() => onCapture(photo)}>Use photo</Button>
        </> : <>
          {error && <Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Try again</Button>}
          <Button icon={Camera} disabled={!ready} loading={busy} onClick={capture}>Capture photo</Button>
        </>}
      </>}>
      {error && <Alert tone="danger" title="Camera">{error}</Alert>}
      <div className={styles.cameraPreview}>
        {photo ? <img src={preview || undefined} alt="Captured document. Check the text before uploading." />
          : <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview"
              onCanPlay={() => setReady(true)} />}
      </div>
      {!photo && !ready && !error && <p role="status" className={styles.hint}>Waiting for your camera. Allow camera access when your browser asks.</p>}
    </Modal>
  );
}
