
import { toast } from 'sonner';

/**
 * Downloads a single file to the user's device
 */
export const downloadFile = (file: File): void => {
  if (!file) {
    toast.error('No file to download');
    return;
  }
  
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast.success('PDF downloaded successfully');
};
