"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus, 
  FlipHorizontal, 
  RotateCcw 
} from "lucide-react";
import { EditorLayer } from "@/types/image-editor";

interface LayerPanelProps {
  layers: EditorLayer[];
  activeLayerId: string | null;
  onLayerSelect: (layerId: string) => void;
  onLayerUpdate: (layerId: string, updates: Partial<EditorLayer>) => void;
  onLayerDelete: (layerId: string) => void;
  onAddLayer: () => void;
}

export function LayerPanel({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
  onAddLayer
}: LayerPanelProps) {
  return (
    <div className="w-80 bg-muted border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Layers</h3>
          <Button size="sm" onClick={onAddLayer}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {layers.map((layer) => (
          <Card
            key={layer.id}
            className={`p-3 cursor-pointer transition-colors ${
              layer.id === activeLayerId 
                ? 'ring-2 ring-primary bg-primary/10' 
                : 'hover:bg-muted-foreground/10'
            }`}
            onClick={() => onLayerSelect(layer.id)}
          >
            <div className="flex items-center gap-3">
              {/* Layer thumbnail */}
              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                <img
                  src={layer.imageUrl}
                  alt={layer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Layer info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{layer.name}</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(layer.width)} × {Math.round(layer.height)}
                </div>
              </div>
              
              {/* Layer controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerUpdate(layer.id, { visible: !layer.visible });
                  }}
                >
                  {layer.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                
                {!layer.isBackground && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerDelete(layer.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Layer Properties */}
      {activeLayerId && (
        <div className="border-t border-border p-4 space-y-4">
          <h4 className="font-medium">Layer Properties</h4>
          
          {(() => {
            const activeLayer = layers.find(l => l.id === activeLayerId);
            if (!activeLayer) return null;
            
            return (
              <div className="space-y-3">
                {/* Opacity */}
                <div>
                  <label className="text-sm font-medium">Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={activeLayer.opacity}
                    onChange={(e) => 
                      onLayerUpdate(activeLayer.id, { opacity: parseFloat(e.target.value) })
                    }
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {Math.round(activeLayer.opacity * 100)}%
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <label className="text-sm font-medium">Scale</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={activeLayer.scaleX}
                      onChange={(e) => 
                        onLayerUpdate(activeLayer.id, { 
                          scaleX: parseFloat(e.target.value),
                          scaleY: parseFloat(e.target.value)
                        })
                      }
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                </div>

                {/* Transform buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => 
                      onLayerUpdate(activeLayer.id, { 
                        scaleX: -activeLayer.scaleX 
                      })
                    }
                  >
                    <FlipHorizontal className="h-4 w-4 mr-1" />
                    Flip
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => 
                      onLayerUpdate(activeLayer.id, { 
                        rotation: activeLayer.rotation + 90 
                      })
                    }
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Rotate
                  </Button>
                </div>

                {/* Position */}
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      value={Math.round(activeLayer.x)}
                      onChange={(e) => 
                        onLayerUpdate(activeLayer.id, { x: parseInt(e.target.value) })
                      }
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      placeholder="X"
                    />
                    <input
                      type="number"
                      value={Math.round(activeLayer.y)}
                      onChange={(e) => 
                        onLayerUpdate(activeLayer.id, { y: parseInt(e.target.value) })
                      }
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      placeholder="Y"
                    />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="text-sm font-medium">Size</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      value={Math.round(activeLayer.width)}
                      onChange={(e) => 
                        onLayerUpdate(activeLayer.id, { width: parseInt(e.target.value) })
                      }
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      placeholder="Width"
                    />
                    <input
                      type="number"
                      value={Math.round(activeLayer.height)}
                      onChange={(e) => 
                        onLayerUpdate(activeLayer.id, { height: parseInt(e.target.value) })
                      }
                      className="flex-1 px-2 py-1 text-sm border rounded"
                      placeholder="Height"
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
} 