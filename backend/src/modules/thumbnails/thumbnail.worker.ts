import { parentPort, workerData } from 'worker_threads';
import ffmpeg from 'fluent-ffmpeg';

async function generate() {
  const { videoPath, thumbFilename, cachePath } = workerData;

  ffmpeg(videoPath)
    .screenshots({
      timestamps: ['1'],
      filename: thumbFilename,
      folder: cachePath,
      size: '320x180',
    })
    .on('end', () => {
      parentPort?.postMessage({ success: true });
    })
    .on('error', (err) => {
      parentPort?.postMessage({ success: false, error: err.message });
    });
}

generate();
