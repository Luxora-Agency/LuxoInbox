const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const readAvatar = async file => {
  if (!AVATAR_TYPES.includes(file.type) || file.size > 2 * 1024 * 1024) {
    throw new Error('Invalid avatar');
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  // Rasterize local files to a bounded PNG, never a remote URL or active SVG.
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const size = Math.min(image.naturalWidth, image.naturalHeight);
  canvas
    .getContext('2d')
    .drawImage(
      image,
      (image.naturalWidth - size) / 2,
      (image.naturalHeight - size) / 2,
      size,
      size,
      0,
      0,
      128,
      128
    );
  return canvas.toDataURL('image/png');
};
