
import React, { useState, useRef, ChangeEvent } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string, images: string[]) => void;
  disabled: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() && images.length === 0) return;
    onSend(text, images);
    setText('');
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        setImages((prev) => [...prev, base64Data]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {/* Image Previews */}
      {images.length > 0 && (
        <div className="flex space-x-2 mb-3 overflow-x-auto">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img 
                src={`data:image/jpeg;base64,${img}`} 
                alt="Aperçu du téléchargement" 
                className="h-16 w-16 object-cover rounded-lg border border-slate-200"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end space-x-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Télécharger une image"
          disabled={disabled}
        >
          <ImageIcon size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez une question ou collez un exercice..."
          className="flex-1 bg-transparent border-none resize-none focus:ring-0 py-2 text-slate-700 placeholder:text-slate-400 max-h-32"
          rows={1}
          style={{ minHeight: '40px' }}
          disabled={disabled}
        />

        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && images.length === 0)}
          className={`p-2 rounded-lg transition-all ${
            disabled || (!text.trim() && images.length === 0)
              ? 'bg-slate-200 text-slate-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
