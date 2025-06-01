"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { FormData, FINETUNE_CONFIGS } from "@/types/image-generation";

interface ImageGenerationFormProps {
  formData: FormData;
  isGenerating: boolean;
  onInputChange: (field: string, value: string | number | boolean) => void;
  onGenerate: () => void;
  onFormDataChange: (data: FormData) => void;
}

export default function ImageGenerationForm({
  formData,
  isGenerating,
  onInputChange,
  onGenerate,
  onFormDataChange
}: ImageGenerationFormProps) {
  const [copied, setCopied] = useState(false);

  const currentFinetune = FINETUNE_CONFIGS.find(config => config.id === formData.finetune_id) || FINETUNE_CONFIGS[0];

  // Add trigger word on initial load
  useEffect(() => {
    const initialFinetune = FINETUNE_CONFIGS.find(config => config.id === "ea3f8df2-0282-4566-84f7-7ba0c4f2c618");
    if (initialFinetune && initialFinetune.triggerWord && !formData.prompt) {
      onFormDataChange({
        ...formData,
        prompt: initialFinetune.triggerWord + " "
      });
    }
  }, []);

  const handleFinetuneChange = (finetuneId: string) => {
    const selectedFinetune = FINETUNE_CONFIGS.find(config => config.id === finetuneId);
    
    let newPrompt = formData.prompt;
    
    // Remove old trigger word if it exists at the start
    const oldFinetune = FINETUNE_CONFIGS.find(config => config.id === formData.finetune_id);
    if (oldFinetune && oldFinetune.triggerWord && newPrompt.startsWith(oldFinetune.triggerWord + " ")) {
      newPrompt = newPrompt.substring(oldFinetune.triggerWord.length + 1);
    }
    
    // Add new trigger word at the start if it exists and finetune is not "none"
    if (selectedFinetune && selectedFinetune.triggerWord && finetuneId !== "none") {
      newPrompt = selectedFinetune.triggerWord + " " + newPrompt;
    }
    
    onFormDataChange({
      ...formData,
      finetune_id: finetuneId,
      prompt: newPrompt
    });
  };

  const copyTriggerWord = async () => {
    if (currentFinetune.triggerWord && formData.finetune_id !== "none") {
      try {
        await navigator.clipboard.writeText(currentFinetune.triggerWord);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy trigger word:', err);
      }
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Image Generation Settings</CardTitle>
        <CardDescription>
          Configure your image generation parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Finetune Settings */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="finetune_id">
                Finetune Model <span className="text-xs text-muted-foreground"></span>
              </Label>
              <Select
                value={formData.finetune_id}
                onValueChange={handleFinetuneChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINETUNE_CONFIGS.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                              <p className="text-xs text-muted-foreground">
                {currentFinetune.description}
                {currentFinetune.triggerWord && formData.finetune_id !== "none" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyTriggerWord}
                    className="h-6 px-2 ml-2 text-xs"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="finetune_strength">
                Finetune Strength
                {(!formData.finetune_id.trim() || formData.finetune_id === "none") && <span className="text-xs text-muted-foreground"> (N/A)</span>}
              </Label>
              <Input
                id="finetune_strength"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.finetune_strength}
                onChange={(e) => onInputChange("finetune_strength", parseFloat(e.target.value))}
                disabled={!formData.finetune_id.trim() || formData.finetune_id === "none"}
              />
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt *</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={formData.prompt}
              onChange={(e) => onInputChange("prompt", e.target.value)}
              rows={3}
            />
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label htmlFor="aspect_ratio">Aspect Ratio</Label>
            <Select
              value={formData.aspect_ratio}
              onValueChange={(value) => onInputChange("aspect_ratio", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="21:9">21:9 (Ultra Wide)</SelectItem>
                <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                <SelectItem value="3:2">3:2 (Photo)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                <SelectItem value="2:3">2:3 (Portrait Photo)</SelectItem>
                <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                <SelectItem value="9:16">9:16 (Mobile)</SelectItem>
                <SelectItem value="9:21">9:21 (Ultra Tall)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seed">Seed (Optional)</Label>
              <Input
                id="seed"
                type="number"
                placeholder="Random if empty"
                value={formData.seed}
                onChange={(e) => onInputChange("seed", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num_images">Number of Images</Label>
              <Input
                id="num_images"
                type="number"
                min="1"
                max="4"
                value={formData.num_images}
                onChange={(e) => onInputChange("num_images", parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="output_format">Output Format</Label>
              <Select
                value={formData.output_format}
                onValueChange={(value) => onInputChange("output_format", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="safety_tolerance">Safety Tolerance</Label>
              <Select
                value={formData.safety_tolerance}
                onValueChange={(value) => onInputChange("safety_tolerance", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Most Strict)</SelectItem>
                  <SelectItem value="2">2 (Strict)</SelectItem>
                  <SelectItem value="3">3 (Moderate)</SelectItem>
                  <SelectItem value="4">4 (Permissive)</SelectItem>
                  <SelectItem value="5">5 (Most Permissive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable_safety_checker"
                checked={formData.enable_safety_checker}
                onChange={(e) => onInputChange("enable_safety_checker", e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="enable_safety_checker" className="text-sm">
                Enable Safety Checker
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="raw"
                checked={formData.raw}
                onChange={(e) => onInputChange("raw", e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="raw" className="text-sm">
                Raw (Less Processed)
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating || !formData.prompt.trim()}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Image"}
        </Button>
      </CardFooter>
    </Card>
  );
} 