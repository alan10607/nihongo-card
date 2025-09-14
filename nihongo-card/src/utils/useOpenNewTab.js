import { useCallback } from 'react';

const useOpenNewTab = () => {
  const openNewTab = useCallback((url, encode = false) => {
    const targetUrl = encode ? encodeURIComponent(url) : url;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }, []);

  return openNewTab;
}

export default useOpenNewTab;
