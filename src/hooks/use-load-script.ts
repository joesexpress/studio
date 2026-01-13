'use client';

import { useState, useEffect } from 'react';

export const useLoadScript = (src: string) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if the script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      // If it is, check if the google object is available
      if (typeof window.google !== 'undefined') {
        setIsLoaded(true);
      } else {
        // If not, it might still be loading, so add a listener
        existingScript.addEventListener('load', () => setIsLoaded(true));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error(`Failed to load script: ${src}`);

    document.body.appendChild(script);

    return () => {
      // Optional: cleanup script tag on component unmount
      // Note: Google Maps script doesn't like being removed and re-added.
      // So, it's often better to just leave it.
    };
  }, [src]);

  return isLoaded;
};
