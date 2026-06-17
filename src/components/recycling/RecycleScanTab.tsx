'use client';

import { useRef, useState } from 'react';
import { Camera, Upload, CheckCircle, Leaf, Trash2, AlertCircle, Star, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import type { RecycleAiReport, WasteItem } from '@/lib/ai';
import styles from './RecycleScanTab.module.css';

type Phase =
  | { kind: 'idle' }
  | { kind: 'previewing'; file: File; previewUrl: string }
  | { kind: 'scanning' }
  | { kind: 'report'; imageUrl: string; report: RecycleAiReport }
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setPhase({ kind: 'previewing', file, previewUrl });
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

    setPhase({ kind: 'report', imageUrl: json.data.imageUrl, report: json.data.report });
  }

  async function handleConfirm() {
    if (phase.kind !== 'report') return;
    setError(null);
    setPhase({ kind: 'confirming' });

    const res = await fetch('/api/recycle/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: phase.imageUrl, report: phase.report }),
    });
    const json = await res.json();

    if (!json.ok) {
      setError(json.error?.message ?? 'Could not confirm. Please try again.');
      setPhase({ kind: 'idle' });
      return;
    }

    setPhase({ kind: 'done', pointsEarned: json.data.pointsEarned, newBalance: json.data.newBalance });
  }

  function handleReset() {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPhase({ kind: 'idle' });
    setError(null);
  }

  return (
    <div className={styles.root}>
      {/* ── Idle ── */}
      {phase.kind === 'idle' && (
        <div className={styles.idle}>
          <div className={styles.scanIllustration}>
            <Camera size={48} strokeWidth={1} />
          </div>
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
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className={styles.hiddenInput}
            onChange={handleFileSelect}
            capture="environment"
          />
          <div className={styles.uploadActions}>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Camera size={16} />
              Take Photo
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                  fileInputRef.current.setAttribute('capture', 'environment');
                }
              }}
            >
              <Upload size={16} />
              Upload Image
            </Button>
          </div>
          {error && <p className={styles.errorMsg}><AlertCircle size={14} />{error}</p>}
        </div>
      )}

      {/* ── Previewing ── */}
      {phase.kind === 'previewing' && (
        <div className={styles.preview}>
          <img src={phase.previewUrl} alt="Selected waste" className={styles.previewImg} />
          <div className={styles.previewActions}>
            <Button onClick={handleScan}>Analyze with AI</Button>
            <Button variant="secondary" onClick={handleReset}><RotateCcw size={14} /> Retake</Button>
          </div>
        </div>
      )}

      {/* ── Scanning ── */}
      {phase.kind === 'scanning' && (
        <div className={styles.scanning}>
          <div className={styles.scanningPulse}>
            <Leaf size={36} strokeWidth={1.5} />
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
            <Leaf size={14} />
            <span>{phase.report.environmentalImpact}</span>
          </div>

          <div className={styles.reportActions}>
            <Button onClick={handleConfirm}>
              <CheckCircle size={16} />
              Confirm & Earn Points
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw size={14} /> Rescan
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
