export function albumFileName(title, extension = 'png', suffix = '') {
  const name = Array.from(String(title || ''), (character) => character.charCodeAt(0) < 32 ? ' ' : character)
    .join('').replace(/[<>:"/\\|?*]/g, ' ').replace(/\s+/g, ' ').trim().replace(/[. ]+$/g, '');
  return `${name || 'Album'}${suffix ? ` ${suffix}` : ''}.${extension}`;
}

export function imageExtension(mimeType) {
  return {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  }[mimeType?.toLowerCase()] || 'png';
}
