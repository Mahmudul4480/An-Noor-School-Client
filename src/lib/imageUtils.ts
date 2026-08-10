/** Stamp / ID-card photo spec — portrait, ~25×30mm at print (5:6 ratio) */
export const STAMP_PHOTO = {
  width: 300,
  height: 360,
  aspectRatio: 5 / 6,
  label: 'Stamp Size (25×30mm)',
} as const;

export async function prepareStampPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width: targetW, height: targetH } = STAMP_PHOTO;

  const sourceRatio = bitmap.width / bitmap.height;
  const targetRatio = STAMP_PHOTO.aspectRatio;

  let cropX = 0;
  let cropY = 0;
  let cropW = bitmap.width;
  let cropH = bitmap.height;

  if (sourceRatio > targetRatio) {
    cropW = bitmap.height * targetRatio;
    cropX = (bitmap.width - cropW) / 2;
  } else {
    cropH = bitmap.width / targetRatio;
    cropY = (bitmap.height - cropH) / 2;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process photo.');

  ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Photo conversion failed.'))), 'image/jpeg', 0.92);
  });

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'student';
  return new File([blob], `${baseName}-stamp.jpg`, { type: 'image/jpeg' });
}
