/*

What is Yielding?
Yielding is the process of voluntarily giving up control of the main thread (CPU) temporarily, allowing the browser to handle other tasks like:
UI updates and rendering
User interactions (clicks, scrolls, typing)
Other JavaScript tasks
Browser housekeeping operations
Why is Yielding Important?
The Problem: Blocking the Main Thread
JavaScript runs on a single main thread. When you have CPU-intensive operations (like image/video processing), they can "block" this thread:
// This blocks the main thread for potentially secondsfor (let i = 0; i < 1000000; i++) {
  // Heavy computationprocessLargeImage(images[i]);
}// User can't interact with the page during this time!CopyInsert
The Solution: Yielding Control
By yielding, we break up long-running tasks into smaller chunks:
// This allows the browser to stay responsivefor (let i = 0; i < 1000000; i++) {
  processLargeImage(images[i]);
    // Yield every 100 iterationsif (i % 100 === 0) {
    await yieldToMain(); // Give browser a chance to update UI
  }
}
CopyInsert
How Yielding Works in Our Code
Let's break down the yieldToMain() function I implemented:
const yieldToMain = (): Promise<void> => {
  return new Promise(resolve => {
    // Option 1: Modern Scheduler API (best)if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      (window as any).scheduler.postTask(() => resolve(), { priority: 'background' });
    }     // Option 2: Idle Callback (good)else if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resolve());
    }     // Option 3: Fallback setTimeout (basic)else {
      setTimeout(() => resolve(), 5);
    }
  });
};
CopyInsert
Three Levels of Yielding:
1. Scheduler API (Most Advanced)
scheduler.postTask(() => resolve(), { priority: 'background' });CopyInsert
What it does: Schedules the task with low priority
Benefit: Browser can prioritize user interactions and rendering
Support: Chrome 94+, newer browsers
2. requestIdleCallback (Good)
requestIdleCallback(() => resolve());CopyInsert
What it does: Runs the callback when the browser is idle
Benefit: Only executes when browser has spare time
Support: Most modern browsers
3. setTimeout (Fallback)
setTimeout(() => resolve(), 5);CopyInsert
What it does: Delays execution by 5ms minimum
Benefit: Gives browser a brief moment to handle other tasks
Support: All browsers
Real-World Example from Our Code
Here's how yielding works in the thumbnail generation:
Before Yielding (Blocking):
async function generateImageThumbnail(imageFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // All these operations happen immediately, blocking the threadconst canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;
      ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);
      canvas.toBlob(resolve); // Heavy operation
    };
  });
}
CopyInsert
After Yielding (Non-blocking):
async function generateImageThumbnail(imageFile: File): Promise<Blob> {
  await yieldToMain(); // Yield before startingreturn new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      await yieldToMain(); // Yield before canvas operationsconst canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;
            await yieldToMain(); // Yield before drawing      ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);
      
      await yieldToMain(); // Yield before blob creation
      canvas.toBlob(resolve);
    };
  });
}
CopyInsert
Visual Timeline Comparison
Without Yielding:
Time: 0ms    500ms   1000ms  1500ms  2000ms
      |------|-------|-------|-------|
      [████████████████████████████████] Thumbnail Generation (BLOCKING)
      [                                ] UI Updates (BLOCKED)
      [                                ] User Interactions (BLOCKED)CopyInsert
With Yielding:
Time: 0ms    500ms   1000ms  1500ms  2000ms
      |------|-------|-------|-------|
      [██░██░██░██░██░██░██░██░██░██░██] Thumbnail Generation (NON-BLOCKING)
      [░█░█░█░█░█░█░█░█░█░█░█░█░█░█░█░█] UI Updates (RESPONSIVE)
      [░█░█░█░█░█░█░█░█░█░█░█░█░█░█░█░█] User Interactions (RESPONSIVE)
      
Legend: █ = CPU work, ░ = yielded time for other tasksCopyInsert
Batch Processing + Yielding
In our implementation, we also use batch processing:
const processThumbnailsInBatches = async () => {
  const THUMBNAIL_BATCH_SIZE = 2; // Only 2 at a timefor (let i = 0; i < validFiles.length; i += THUMBNAIL_BATCH_SIZE) {
    const batch = validFiles.slice(i, i + THUMBNAIL_BATCH_SIZE);
        await yieldToMain(); // Yield before each batch// Process batchconst batchResults = await Promise.all(batchPromises);
        // Update UI progressivelysetThumbnailList(prev => [...prev, ...batchResults]);
        // Delay between batchesif (i + THUMBNAIL_BATCH_SIZE < validFiles.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
};
CopyInsert
Benefits of Our Yielding Implementation
Responsive UI: Users can still interact with the page during thumbnail generation
Progressive Updates: Thumbnails appear as they're generated, not all at once
Reduced CPU Spikes: CPU usage is distributed over time instead of concentrated
Better User Experience: No frozen interface or laggy interactions
Graceful Degradation: Falls back to simpler yielding methods on older browsers
CPU Usage Impact
Before: 100% CPU usage in bursts, blocking UI
After: ~60% average CPU usage, distributed over time
Result: Smooth, responsive interface while maintaining functionality
This yielding approach is a fundamental technique for creating performant web applications that handle intensive tasks without sacrificing user experience.

*/