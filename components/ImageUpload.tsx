
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Image, Plus, X, Loader2, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    // Fix: Explicitly cast Array.from result to File[] to avoid unknown type errors
    const files = Array.from(e.target.files) as File[];
    const newUrls: string[] = [...images];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `vehicles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error al subir:', uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(filePath);

      if (data) {
        newUrls.push(data.publicUrl);
      }
    }

    onChange(newUrls);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newUrls = images.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative aspect-video rounded-xl overflow-hidden group border border-slate-200 shadow-sm bg-slate-50">
            <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg"
            >
              <X size={16} />
            </button>
            {index === 0 && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded shadow-sm">
                Portada
              </div>
            )}
          </div>
        ))}
        
        <label className={cn(
          "relative aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition",
          uploading ? "border-blue-300 bg-blue-50" : "border-slate-300 hover:border-blue-500 hover:bg-slate-50"
        )}>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="animate-spin text-blue-600" size={24} />
          ) : (
            <>
              <Camera className="text-slate-400 mb-1" size={24} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Añadir Fotos</span>
            </>
          )}
        </label>
      </div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        Formatos soportados: JPG, PNG. La primera imagen será la foto de portada.
      </p>
    </div>
  );
};

export default ImageUpload;
