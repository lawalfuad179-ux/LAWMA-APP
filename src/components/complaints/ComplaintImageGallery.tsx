'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ComplaintImageGallery.module.css';

type Image = { id: string; url: string };

type Props = {
  images: Image[];
};

export function ComplaintImageGallery({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  }, [images.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null));
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [lightboxIndex, close, prev, next]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIndex]);

  return (
    <>
      <div className={styles.grid}>
        {images.map((img, i) => (
          <button
            key={img.id}
            className={styles.thumb}
            onClick={() => setLightboxIndex(i)}
            type="button"
            aria-label={`View photo ${i + 1}`}
          >
            <img src={img.url} alt={`Photo ${i + 1}`} className={styles.thumbImg} />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className={styles.overlay} onClick={close} role="dialog" aria-modal>
          <button className={styles.closeBtn} onClick={close} type="button" aria-label="Close">
            <X size={22} strokeWidth={1.5} />
          </button>

          {images.length > 1 && (
            <button
              className={`${styles.navBtn} ${styles.navBtnPrev}`}
              onClick={(e) => { e.stopPropagation(); prev(); }}
              type="button"
              aria-label="Previous"
            >
              <ChevronLeft size={28} strokeWidth={1.5} />
            </button>
          )}

          <img
            src={images[lightboxIndex].url}
            alt={`Photo ${lightboxIndex + 1}`}
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              className={`${styles.navBtn} ${styles.navBtnNext}`}
              onClick={(e) => { e.stopPropagation(); next(); }}
              type="button"
              aria-label="Next"
            >
              <ChevronRight size={28} strokeWidth={1.5} />
            </button>
          )}

          {images.length > 1 && (
            <div className={styles.dots}>
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === lightboxIndex ? styles.dotActive : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
