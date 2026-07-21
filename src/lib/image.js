export function optimizeImage(urlOrObj, displaySize = 40) {
  return transformImage(urlOrObj, { width: displaySize * 2 });
}

export function transformImage(urlOrObj, opts = {}) {
  const url = typeof urlOrObj === 'string' ? urlOrObj : urlOrObj?.url || urlOrObj;
  if (!url || typeof url !== 'string') return urlOrObj;

  if (url.includes('googleusercontent.com') || url.includes('googleapis.com')) return url;

  if (url.includes('res.cloudinary.com')) {
    const marker = '/upload/';
    const idx = url.indexOf(marker);
    if (idx === -1) return url;
    const before = url.slice(0, idx + marker.length);
    const after = url.slice(idx + marker.length);

    const transforms = [];
    if (opts.crop) transforms.push(`c_${opts.crop}`);
    if (opts.width) transforms.push(`w_${opts.width}`);
    if (opts.height) transforms.push(`h_${opts.height}`);
    transforms.push(`q_${opts.quality || 'auto'}`);
    transforms.push(`f_${opts.format || 'auto'}`);

    return `${before}${transforms.join(',')}/${after}`;
  }

  return url;
}
