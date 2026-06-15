'use client';

import { useRef, useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './AvatarUpload.module.css';

type Props = {
  name: string;
  avatarUrl: string | null;
};

export function AvatarUpload({ name, avatarUrl: initialUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [cacheKey, setCacheKey] = useState(0);

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const initial = name?.charAt(0)?.toUpperCase() || '?';

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImage(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleCancelCrop() {
    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(null);
  }

  async function handleSaveCrop() {
    if (!cropImage || !croppedAreaPixels) return;

    const canvas = document.createElement('canvas');
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = cropImage;
    await new Promise((resolve) => { image.onload = resolve; });

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0,
      croppedAreaPixels.width, croppedAreaPixels.height,
    );

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      URL.revokeObjectURL(cropImage);
      setCropImage(null);

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', blob, 'avatar.jpg');

        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!data.ok) return;

        const updateRes = await fetch('/api/profile/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: data.url }),
        });
        const updateData = await updateRes.json();
        if (updateData.ok) {
          setUrl(data.url);
          setCacheKey((c) => c + 1);
        }
      } catch {
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg', 0.9);
  }

  return (
    <>
      <button
        className={styles.wrapper}
        onClick={() => inputRef.current?.click()}
        type="button"
        disabled={uploading}
        aria-label="Upload profile photo"
      >
        {url ? (
          <img src={`${url}?t=${cacheKey}`} alt="" className={styles.img} />
        ) : (
          <span className={styles.initial}>{initial}</span>
        )}
        <div className={styles.overlay}>
          <Camera size={18} strokeWidth={1.5} />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className={styles.input}
          onChange={handleFile}
        />
      </button>

      {/* Crop modal */}
      {cropImage && (
        <div className={styles.cropOverlay}>
          <div className={styles.cropModal}>
            <div className={styles.cropHeader}>
              <span className={styles.cropTitle}>Crop photo</span>
              <button
                className={styles.cropClose}
                onClick={handleCancelCrop}
                type="button"
                aria-label="Close crop"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className={styles.cropContainer}>
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className={styles.cropFooter}>
              <Button variant="ghost" size="md" onClick={handleCancelCrop} type="button">
                Cancel
              </Button>
              <Button size="md" isLoading={uploading} onClick={handleSaveCrop} type="button">
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
