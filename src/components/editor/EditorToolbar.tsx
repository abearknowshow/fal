"use client";

import { Button } from "@/components/ui/button";
import { 
  MousePointer, 
  Crop, 
  Expand, 
  Scissors, 
  Layers,
  Maximize2,
  Wand2,
  Move3D
} from "lucide-react";
import { EDITOR_TOOLS } from "@/types/image-editor";

interface EditorToolbarProps {
  currentTool: string;
  onToolChange: (toolId: string) => void;
  onBackgroundRemoval: () => void;
  isProcessing: boolean;
}

export function EditorToolbar({ 
  currentTool, 
  onToolChange, 
  onBackgroundRemoval, 
  isProcessing 
}: EditorToolbarProps) {
  const tools = [
    { id: EDITOR_TOOLS.SELECT, name: 'Select', icon: MousePointer },
    { id: EDITOR_TOOLS.CROP, name: 'Crop', icon: Crop },
    { id: EDITOR_TOOLS.EXTEND, name: 'Extend', icon: Expand },
    { id: EDITOR_TOOLS.SMART_SELECT, name: 'Smart Select', icon: Wand2 },
    { id: EDITOR_TOOLS.PERSPECTIVE, name: 'Perspective', icon: Move3D },
    { id: EDITOR_TOOLS.CANVAS, name: 'Canvas', icon: Maximize2 },
    { id: EDITOR_TOOLS.LAYER, name: 'Layers', icon: Layers }
  ];

  return (
    <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-2">
      {tools.map((tool) => {
        const IconComponent = tool.icon;
        return (
          <Button
            key={tool.id}
            variant={currentTool === tool.id ? "default" : "ghost"}
            size="sm"
            className="w-12 h-12 p-0"
            onClick={() => onToolChange(tool.id)}
            title={tool.name}
          >
            <IconComponent className="h-5 w-5" />
          </Button>
        );
      })}
      
      <div className="border-t border-border w-8 my-2" />
      
      <Button
        variant="ghost"
        size="sm"
        className="w-12 h-12 p-0"
        onClick={onBackgroundRemoval}
        disabled={isProcessing}
        title="Remove Background"
      >
        <Scissors className="h-5 w-5" />
      </Button>
    </div>
  );
} 