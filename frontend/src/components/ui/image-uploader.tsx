import * as React from 'react';
import { cn } from '@/lib/utils';
import { Camera, X, UploadCloud, RefreshCw } from 'lucide-react';

interface ImageUploaderProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'avatar' | 'wide';
}

export function ImageUploader({
  value,
  onChange,
  disabled = false,
  className,
  aspectRatio = 'square',
}: ImageUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);

  // Sync value to preview state, managing Object URLs cleanly
  React.useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    if (typeof value === 'string') {
      setPreview(value);
    }
  }, [value]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isAvatar = aspectRatio === 'avatar';
  const isWide = aspectRatio === 'wide';

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      {preview ? (
        <div
          className={cn(
            'relative overflow-hidden border border-border group bg-muted transition-all duration-300',
            isAvatar
              ? 'w-28 h-28 rounded-full'
              : isWide
                ? 'aspect-[21/9] w-full rounded-xl'
                : 'aspect-square w-full max-w-[280px] rounded-xl',
          )}
        >
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-3">
            <button
              type="button"
              onClick={onButtonClick}
              disabled={disabled}
              className="p-2 bg-white/95 hover:bg-white text-gray-800 rounded-full shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
              title="Ganti Gambar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="p-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
              title="Hapus Gambar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-card hover:bg-accent/10 transition-all duration-300 cursor-pointer text-center p-6',
            isDragActive ? 'border-primary bg-primary/5' : '',
            disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
            isAvatar
              ? 'w-28 h-28 rounded-full border-dashed p-0'
              : isWide
                ? 'aspect-[21/9] w-full rounded-xl'
                : 'aspect-square w-full max-w-[280px] rounded-xl',
          )}
        >
          {isAvatar ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Camera className="h-6 w-6 mb-1 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-medium">Unggah</span>
            </div>
          ) : (
            <div className="space-y-3 flex flex-col items-center">
              <div className="p-3 bg-muted rounded-full text-muted-foreground/80 group-hover:text-primary group-hover:bg-primary/10 transition-all duration-300">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  Klik untuk unggah atau seret gambar
                </p>
                <p className="text-[10px] text-muted-foreground">
                  JPEG, PNG, atau WEBP (Maks. 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
