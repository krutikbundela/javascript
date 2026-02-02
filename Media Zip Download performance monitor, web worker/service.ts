/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-loop-func */
import JSZip from 'jszip';
import { printLogs } from '../../../utils/service';

const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || '';

// 500MB in bytes
const MAX_ZIP_SIZE = 500 * 1024 * 1024;

export function chunkMediaBySize(mediaList: any[], maxSize = MAX_ZIP_SIZE) {
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;
  mediaList.forEach((media) => {
    const size = Number(media.mediaSize) || 0;
    if (currentSize + size > maxSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }
    currentChunk.push(media);
    currentSize += size;
  });
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  return chunks;
}

export async function fetchMediaBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch media: ${url}`);
  return response.blob();
}

// Helper function to yield control back to the main thread
function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

// Helper function to throttle progress updates
function createProgressThrottler(
  callback: (progress: number) => void,
  delay = 100,
) {
  let lastUpdate = 0;
  let lastProgress = -1;

  return (progress: number) => {
    const now = Date.now();

    // Only update if progress changed by more than 1%
    const progressChanged = Math.abs(progress - lastProgress) > 0.01;

    if (now - lastUpdate > delay || progressChanged) {
      lastUpdate = now;
      lastProgress = progress;
      // Use requestAnimationFrame for smoother UI updates
      requestAnimationFrame(() => callback(progress));
    }
  };
}

// Check if Web Workers are supported
function isWebWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

// Web Worker-based zip creation for better performance
async function createMediaZipWithWorker(
  mediaList: any[],
  onProgress?: (p: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/zipWorker.js');

    // Create throttled progress updater
    const updateProgress = onProgress
      ? createProgressThrottler(onProgress, 100)
      : null;

    worker.onmessage = (e) => {
      const { type, progress, blob, error } = e.data;

      switch (type) {
        case 'PROGRESS':
          if (updateProgress) {
            updateProgress(progress);
          }
          break;

        case 'COMPLETE':
          worker.terminate();
          resolve(blob);
          break;

        case 'ERROR':
          worker.terminate();
          reject(new Error(error));
          break;

        default:
          // Optionally log unexpected message types
          printLogs('warn', `Unknown worker message type: ${type}`);
          break;
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };

    // Start the zip creation process
    worker.postMessage({
      type: 'CREATE_ZIP',
      data: {
        mediaList,
        cdnBaseUrl: CDN_BASE_URL,
      },
    });
  });
}

// Fallback zip creation for when Web Workers are not available
async function createMediaZipFallback(
  mediaList: any[],
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  let completed = 0;
  const BATCH_SIZE = 2; // Reduced batch size to prevent blocking
  const COOLDOWN_MS = 50; // Reduced cooldown for better responsiveness

  // Create throttled progress updater
  const updateProgress = onProgress
    ? createProgressThrottler(onProgress, 100)
    : null;

  // Process media files in smaller batches with yielding
  for (let i = 0; i < mediaList.length; i += BATCH_SIZE) {
    const batch = mediaList.slice(i, i + BATCH_SIZE);

    // Process each item in the batch sequentially to reduce memory pressure
    await batch.reduce(async (promise, media) => {
      await promise;
      const url = `${CDN_BASE_URL}/${media.mediaUrl}`;
      const fileName =
        media.fileName || media.mediaUrl.split('/').pop() || 'file';

      try {
        const blob = await fetchMediaBlob(url);
        zip.file(fileName, blob);

        completed += 1;
        // Progress for gathering media: 0% to 70%
        if (updateProgress) {
          updateProgress((completed / mediaList.length) * 0.7);
        }

        // Yield control back to main thread after each file
        await yieldToMainThread();
      } catch (e) {
        printLogs('error', e);
        completed += 1; // Still increment to maintain progress accuracy
      }
    }, Promise.resolve());

    // Additional cooldown between batches
    if (i + BATCH_SIZE < mediaList.length) {
      await new Promise((resolve) => {
        setTimeout(resolve, COOLDOWN_MS);
      });
    }
  }

  // Generate zip with chunked processing to prevent blocking
  return new Promise((resolve, reject) => {
    // Use compression level 1 for faster processing (less CPU intensive)
    const options = {
      type: 'blob' as const,
      compression: 'DEFLATE' as const,
      compressionOptions: { level: 1 }, // Faster compression
    };

    zip
      .generateAsync(options, (metadata) => {
        // Throttled progress updates for zip generation: 70% to 100%
        if (updateProgress) {
          const zipProgress = 0.7 + (metadata.percent / 100) * 0.3;
          updateProgress(zipProgress);
        }
      })
      .then(resolve)
      .catch(reject);
  });
}

export async function createMediaZip(
  mediaList: any[],
  onProgress?: (p: number) => void,
): Promise<Blob> {
  // Use Web Worker if supported, otherwise fall back to main thread processing
  if (isWebWorkerSupported()) {
    try {
      return await createMediaZipWithWorker(mediaList, onProgress);
    } catch (error) {
      // If Web Worker fails, fall back to main thread
      printLogs('Web Worker failed, falling back to main thread:', error);
      return createMediaZipFallback(mediaList, onProgress);
    }
  } else {
    return createMediaZipFallback(mediaList, onProgress);
  }
}

export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none'; // Hide the element

  document.body.appendChild(a);
  a.click();

  // Clean up more aggressively
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
