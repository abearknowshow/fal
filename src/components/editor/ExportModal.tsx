"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  X, 
  FileImage, 
  Palette,
  Info
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'png' | 'jpg' | 'webp', quality: number, filename?: string) => void;
  canvasWidth: number;
  canvasHeight: number;
  isProcessing: boolean;
}

export function ExportModal({ 
  isOpen, 
  onClose, 
  onExport, 
  canvasWidth, 
  canvasHeight, 
  isProcessing 
}: ExportModalProps) {
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [quality, setQuality] = useState(90);
  const [filename, setFilename] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    const finalFilename = filename.trim() || `edited_image_${Date.now()}`;
    onExport(format, quality / 100, finalFilename);
    onClose();
  };

  const formatInfo = {
    png: {
      name: 'PNG',
      description: 'Lossless compression, supports transparency',
      size: 'Large file size',
      transparency: true,
      quality: false
    },
    jpg: {
      name: 'JPEG',
      description: 'Lossy compression, smaller file size',
      size: 'Small file size',
      transparency: false,
      quality: true
    },
    webp: {
      name: 'WebP',
      description: 'Modern format, excellent compression',
      size: 'Very small file size',
      transparency: true,
      quality: true
    }
  };

  const estimatedSize = Math.round((canvasWidth * canvasHeight * 4) / 1024 / 1024 * 
    (format === 'png' ? 1 : format === 'jpg' ? 0.1 : 0.05));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-card text-card-foreground">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Export Image</h2>
                <p className="text-sm text-muted-foreground">
                  {canvasWidth} × {canvasHeight} pixels
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename (without extension)"
              className="w-full"
            />
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(formatInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setFormat(key as 'png' | 'jpg' | 'webp')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    format === key 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <div className="font-medium text-sm">{info.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {info.size}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Format Info */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium">{formatInfo[format].name}</div>
                  <div className="text-muted-foreground">{formatInfo[format].description}</div>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <FileImage className="h-3 w-3" />
                      ~{estimatedSize}MB
                    </span>
                    <span className="flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      {formatInfo[format].transparency ? 'Transparency' : 'No transparency'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Settings */}
          {formatInfo[format].quality && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="quality">Quality</Label>
                <span className="text-sm text-muted-foreground">{quality}%</span>
              </div>
              <div className="space-y-2">
                <input
                  id="quality"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}