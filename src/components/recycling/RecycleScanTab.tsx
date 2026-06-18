'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, Trash2, AlertCircle, Star, RotateCcw, Upload, ArrowLeft, Zap, RefreshCw, ScanLine } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { AiRecycleIcon } from '@/components/ui/icons/AiRecycleIcon';
import type { RecycleAiReport, WasteItem } from '@/lib/ai';
import styles from './RecycleScanTab.module.css';

type Phase =
  | { kind: 'idle' }
  | { kind: 'camera' }
  | { kind: 'previewing'; file: File; previewUrl: string }
  | { kind: 'scanning' }
  | { kind: 'report'; imageUrl: string; report: RecycleAiReport; imageHash?: string }
  | { kind: 'confirming' }
  | { kind: 'done'; pointsEarned: number; newBalance: number };

const CATEGORY_EMOJI: Record<string, string> = {
  plastic: '♻️',
  paper: '📄',
  glass: '🫙',
  metal: '🥫',
  organic: '🌿',
  ewaste: '💻',
  'non-recyclable': '🗑️',
};

export function RecycleScanTab() {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashOn, setFlashOn] = useState(false);

  // Attach stream to video element when camera phase is active
  useEffect(() => {
    if (phase.kind === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase.kind]);

  // Stop stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCameraError(null);
    const previewUrl = URL.createObjectURL(file);
    setPhase({ kind: 'previewing', file, previewUrl });
  }

  async function startCamera(mode: 'environment' | 'user') {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setFlashOn(false);
      setPhase({ kind: 'camera' });
    } catch {
      setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
    }
  }

  async function handleCameraClick() {
    await startCamera('environment');
  }

  async function handleSwitchCamera() {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    await startCamera(newMode);
  }

  async function handleToggleFlash() {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track || !('applyConstraints' in track)) return;
    const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
    if (!capabilities || !capabilities.torch) return;
    const next = !flashOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as any] });
      setFlashOn(next);
    } catch {}
  }

  function handleUploadFromCamera() {
    uploadInputRef.current?.click();
  }

  function handleCameraClose() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPhase({ kind: 'idle' });
  }

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(file);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setPhase({ kind: 'previewing', file, previewUrl });
    }, 'image/jpeg', 0.92);
  }

  async function handleScan() {
    if (phase.kind !== 'previewing') return;
    setError(null);
    setPhase({ kind: 'scanning' });

    const fd = new FormData();
    fd.append('image', phase.file);

    const res = await fetch('/api/recycle/scan', { method: 'POST', body: fd });
    const json = await res.json();

    if (!json.ok) {
      setError(json.error?.message ?? 'Scan failed. Please try again.');
      setPhase({ kind: 'idle' });
      return;
    }

    setPhase({ kind: 'report', imageUrl: json.data.imageUrl, report: json.data.report, imageHash: json.data.imageHash });
  }

  async function handleConfirm() {
    if (phase.kind !== 'report') return;
    setError(null);
    setPhase({ kind: 'confirming' });

    const res = await fetch('/api/recycle/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: phase.imageUrl, report: phase.report, imageHash: phase.imageHash }),
    });
    const json = await res.json();

    if (!json.ok) {
      const code: string = json.error?.code ?? '';
      const friendlyMessages: Record<string, string> = {
        already_confirmed:  'This scan has already been claimed.',
        duplicate_image:    'This photo was already used recently. Take a new one.',
        duplicate_content:  'These same items were already scanned today.',
        cooldown_active:    json.error?.message ?? 'Please wait a few minutes before your next scan.',
        daily_limit_reached: json.error?.message ?? "You've reached today's scan limit. Try again tomorrow.",
      };
      setError(friendlyMessages[code] ?? json.error?.message ?? 'Could not confirm. Please try again.');
      setPhase({ kind: 'idle' });
      return;
    }

    setPhase({ kind: 'done', pointsEarned: json.data.pointsEarned, newBalance: json.data.newBalance });
  }

  function handleReset() {
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    setPhase({ kind: 'idle' });
    setError(null);
    setCameraError(null);
  }

  return (
    <div className={styles.root}>
      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} className={styles.hiddenInput} />

      {/* ── Camera overlay ── */}
      {phase.kind === 'camera' && (
        <div className={styles.cameraOverlay}>
          <video
            ref={videoRef}
            className={styles.cameraVideo}
            playsInline
            muted
            autoPlay
          />
          {/* Back button (top left) */}
          <button className={styles.cameraBack} onClick={handleCameraClose} type="button" aria-label="Close camera">
            <ArrowLeft size={20} strokeWidth={2} />
            <span>Back</span>
          </button>
          {/* Flash button (top right) */}
          <button
            className={`${styles.cameraFlashBtn} ${flashOn ? styles.cameraFlashBtnOn : ''}`}
            onClick={handleToggleFlash}
            type="button"
            aria-label={flashOn ? 'Turn flash off' : 'Turn flash on'}
          >
            <Zap size={20} strokeWidth={1.8} />
          </button>
          {/* Bottom bar: upload | capture | switch */}
          <div className={styles.cameraBar}>
            <button className={styles.cameraSideBtn} onClick={handleUploadFromCamera} type="button" aria-label="Upload from device">
              <Upload size={22} strokeWidth={1.8} />
            </button>
            <button className={styles.captureBtn} onClick={handleCapture} type="button" aria-label="Take photo">
              <Camera size={28} strokeWidth={1.8} />
            </button>
            <button className={styles.cameraSideBtn} onClick={handleSwitchCamera} type="button" aria-label="Switch camera">
              <RefreshCw size={22} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}

      {/* ── Idle ── */}
      {phase.kind === 'idle' && (
        <div className={styles.idle}>
          <h2 className={styles.idleTitle}>Scan Your Waste</h2>
          <p className={styles.idleDesc}>
            Take a photo of your trash and our AI will tell you what can be recycled and how.
            Earn points for every confirmed scan — redeemable as bill discounts.
          </p>
          <div className={styles.earnBanner}>
            <Star size={14} />
            <span>Earn up to <strong>10–35 pts</strong> per scan</span>
          </div>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className={styles.hiddenInput}
            onChange={handleFileSelect}
          />
          <button
            className={styles.uploadArea}
            onClick={() => uploadInputRef.current?.click()}
            type="button"
          >
            <div className={styles.scanIllustration}>
              <Upload size={48} strokeWidth={1} />
            </div>
            <span className={styles.uploadAreaText}>Upload from device</span>
          </button>
          <div className={styles.uploadActions}>
            <button className={styles.cameraBtn} onClick={handleCameraClick} type="button">
              <Camera size={18} strokeWidth={1.8} />
              <span>Take Photo</span>
            </button>
          </div>
          {cameraError && <p className={styles.errorMsg}><AlertCircle size={14} />{cameraError}</p>}
          {error && <p className={styles.errorMsg}><AlertCircle size={14} />{error}</p>}
        </div>
      )}

      {/* ── Previewing ── */}
      {phase.kind === 'previewing' && (
        <div className={styles.preview}>
          <img src={phase.previewUrl} alt="Selected waste" className={styles.previewImg} />
          <div className={styles.previewActions}>
            <Button onClick={handleScan}><ScanLine size={16} /><span>Analyze with AI</span></Button>
            <Button variant="secondary" onClick={handleReset}><RotateCcw size={16} /><span>Retake</span></Button>
          </div>
        </div>
      )}

      {/* ── Scanning ── */}
      {phase.kind === 'scanning' && (
        <div className={styles.scanning}>
          <div className={styles.scanningPulse}>
            <AiRecycleIcon size={36} />
          </div>
          <p className={styles.scanningText}>Analyzing your waste…</p>
          <p className={styles.scanningSubtext}>The AI is classifying your items</p>
        </div>
      )}

      {/* ── Report ── */}
      {phase.kind === 'report' && (
        <div className={styles.report}>
          <img src={phase.imageUrl} alt="Scanned waste" className={styles.reportImg} />

          <div className={styles.reportSummary}>
            <div className={styles.reportStat}>
              <span className={styles.reportStatNum}>{phase.report.recyclableCount}</span>
              <span className={styles.reportStatLabel}>Recyclable</span>
            </div>
            <div className={styles.reportDivider} />
            <div className={styles.reportStat}>
              <span className={styles.reportStatNum}>{phase.report.nonRecyclableCount}</span>
              <span className={styles.reportStatLabel}>Non-recyclable</span>
            </div>
          </div>

          <p className={styles.reportDescription}>{phase.report.summary}</p>

          <div className={styles.itemList}>
            {phase.report.items.map((item: WasteItem, i: number) => (
              <div key={i} className={`${styles.item} ${item.recyclable ? styles.itemRecyclable : styles.itemNotRecyclable}`}>
                <span className={styles.itemEmoji}>{CATEGORY_EMOJI[item.category] ?? '📦'}</span>
                <div className={styles.itemBody}>
                  <div className={styles.itemName}>
                    {item.name}
                    {item.recyclable
                      ? <span className={styles.recyclableBadge}>Recyclable</span>
                      : <span className={styles.nonRecyclableBadge}>General Waste</span>
                    }
                  </div>
                  <p className={styles.itemInstruction}>{item.instruction}</p>
                </div>
              </div>
            ))}
          </div>

          {phase.report.tips.length > 0 && (
            <div className={styles.tips}>
              <p className={styles.tipsTitle}>Quick Tips</p>
              {phase.report.tips.map((tip, i) => (
                <p key={i} className={styles.tip}>• {tip}</p>
              ))}
            </div>
          )}

          <div className={styles.reportImpact}>
              <AiRecycleIcon size={14} />
            <span>{phase.report.environmentalImpact}</span>
          </div>

          <div className={styles.reportActions}>
            <Button onClick={handleConfirm}>
              <CheckCircle size={16} /><span>Earn Points</span>
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw size={16} /><span>Rescan</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Confirming ── */}
      {phase.kind === 'confirming' && (
        <div className={styles.scanning}>
          <div className={styles.scanningPulse}>
            <CheckCircle size={36} strokeWidth={1.5} />
          </div>
          <p className={styles.scanningText}>Saving your activity…</p>
        </div>
      )}

      {/* ── Done ── */}
      {phase.kind === 'done' && (
        <div className={styles.done}>
          <div className={styles.doneIcon}>
            <Star size={48} strokeWidth={1.5} />
          </div>
          <h2 className={styles.doneTitle}>+{phase.pointsEarned} Points Earned!</h2>
          <p className={styles.doneDesc}>
            Great work! Your balance is now <strong>{phase.newBalance} pts</strong>.
            <br />Every 100 points = ₦100 off your bill.
          </p>
          <div className={styles.doneActions}>
            <Button onClick={handleReset}>Scan Another</Button>
          </div>
        </div>
      )}
    </div>
  );
}
