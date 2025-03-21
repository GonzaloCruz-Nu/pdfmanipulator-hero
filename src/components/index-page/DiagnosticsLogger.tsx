
import React, { useEffect } from 'react';

const DiagnosticsLogger = () => {
  useEffect(() => {
    console.log('Index page mounted');
    
    // Check for any CSS or rendering issues
    const rootElement = document.getElementById('root');
    if (rootElement) {
      console.log('Root element dimensions:', {
        width: rootElement.clientWidth,
        height: rootElement.clientHeight,
        isVisible: rootElement.clientWidth > 0 && rootElement.clientHeight > 0
      });
    }
    
    return () => {
      console.log('Index page unmounted');
    };
  }, []);

  return null;
};

export default DiagnosticsLogger;
