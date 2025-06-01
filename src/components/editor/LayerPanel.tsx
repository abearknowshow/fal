"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus, 
  FlipHorizontal, 
  RotateCcw,
  GripVertical,
  Move,
  Square
} from "lucide-react";
import { EditorLayer } from "@/types/image-editor";

interface LayerPanelProps {
  layers: EditorLayer[];
  activeLayerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  onLayerSelect: (layerId: string) => void;
  onLayerUpdate: (layerId: string, updates: Partial<EditorLayer>) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerReorder: (dragIndex: number, hoverIndex: number) => void;
  onAddLayer: () => void;
}

export function LayerPanel({
  layers,
  activeLayerId,
  canvasWidth,
  canvasHeight,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
  onLayerReorder,
  onAddLayer
}: LayerPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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
        {layers.map((layer, index) => (
          <Card
            key={layer.id}
            draggable
            className={`p-3 cursor-pointer transition-colors ${
              layer.id === activeLayerId 
                ? 'ring-2 ring-primary bg-primary/10' 
                : 'hover:bg-muted-foreground/10'
            } ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
            onClick={() => onLayerSelect(layer.id)}
            onDragStart={(e) => {
              setDraggedIndex(index);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', index.toString());
            }}
            onDragEnd={() => {
              setDraggedIndex(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
              if (dragIndex !== index) {
                onLayerReorder(dragIndex, index);
              }
              setDraggedIndex(null);
            }}
          >
            <div className="flex items-center gap-3">
              {/* Drag handle */}
              <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
              
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
                  <label className="text-sm font-medium">Scale (Aspect Ratio Locked)</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={activeLayer.scaleX}
                      onChange={(e) => {
                        const scale = parseFloat(e.target.value);
                        onLayerUpdate(activeLayer.id, { 
                          scaleX: scale,
                          scaleY: scale
                        });
                      }}
                      className="flex-1"
                    />
                    <div className="text-xs text-muted-foreground w-12 text-center">
                      {Math.round(activeLayer.scaleX * 100)}%
                    </div>
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
                  
                  {/* Quick positioning presets for non-background layers */}
                  {!activeLayer.isBackground && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Quick Position:</div>
                      <div className="grid grid-cols-4 gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs"
                          onClick={() => onLayerUpdate(activeLayer.id, { 
                            x: 0, 
                            y: 0 
                          })}
                          title="Top Left"
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs"
                          onClick={() => onLayerUpdate(activeLayer.id, { 
                            x: (canvasWidth - activeLayer.width) / 2, 
                            y: 0 
                          })}
                          title="Top Center"
                        >
                          TC
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs"
                          onClick={() => onLayerUpdate(activeLayer.id, { 
                            x: canvasWidth - activeLayer.width, 
                            y: 0 
                          })}
                          title="Top Right"
                        >
                          TR
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs"
                          onClick={() => onLayerUpdate(activeLayer.id, { 
                            x: (canvasWidth - activeLayer.width) / 2, 
                            y: (canvasHeight - activeLayer.height) / 2 
                          })}
                          title="Center"
                        >
                          <Move className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
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