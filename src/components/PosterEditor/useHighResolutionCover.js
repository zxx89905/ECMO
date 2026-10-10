import { useEffect, useState } from 'react';
import { findHighResolutionCover } from '../../services/highResolutionCover';

export default function useHighResolutionCover(album) {
  const [cover, setCover] = useState({ status: 'idle', url: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!album) { setCover({ status: 'idle', url: '' }); return; }
    const controller = new AbortController();
    let objectUrl;
    setCover({ status: 'checking', url: '' });
    findHighResolutionCover(album, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      if (result.blob) objectUrl = URL.createObjectURL(result.blob);
      setCover({ status: result.status, width: result.width, height: result.height, url: objectUrl || '' });
    }).catch(() => {
      if (!controller.signal.aborted) setCover({ status: 'error', url: '' });
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [album, attempt]);

  return { ...cover, retry: () => setAttempt((value) => value + 1) };
}
