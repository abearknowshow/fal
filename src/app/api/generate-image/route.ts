import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

// Configure Fal AI client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    const {
      prompt,
      seed,
      num_images = 1,
      enable_safety_checker = true,
      safety_tolerance = "2",
      output_format = "jpeg",
      aspect_ratio = "16:9",
      raw = false,
      finetune_id = "none",
      finetune_strength = 0.8,
    } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Determine which model to use based on finetune_id
    const useFinetunedModel = finetune_id && finetune_id.trim() !== "" && finetune_id !== "none";
    const modelEndpoint = useFinetunedModel 
      ? "fal-ai/flux-pro/v1.1-ultra-finetuned"
      : "fal-ai/flux-pro/v1.1";

    console.log(`Using model: ${modelEndpoint}`);

    let result;

    if (useFinetunedModel) {
      // Ultra fine-tuned model input
      const fineTunedInput = {
        prompt,
        finetune_id,
        finetune_strength,
        ...(seed && { seed }),
        num_images,
        enable_safety_checker,
        safety_tolerance,
        output_format,
        aspect_ratio,
        raw,
      };

      console.log(`Fine-tuned input:`, fineTunedInput);

      result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra-finetuned", {
        input: fineTunedInput,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
    } else {
      // Regular FLUX1.1 [pro] model input
      const aspectRatioToImageSize: Record<string, string> = {
        "21:9": "landscape_16_9",
        "16:9": "landscape_16_9", 
        "4:3": "landscape_4_3",
        "3:2": "landscape_4_3",
        "1:1": "square",
        "2:3": "portrait_4_3",
        "3:4": "portrait_4_3", 
        "9:16": "portrait_16_9",
        "9:21": "portrait_16_9"
      };

      const regularInput = {
        prompt,
        ...(seed && { seed }),
        num_images,
        enable_safety_checker,
        safety_tolerance,
        output_format,
        image_size: aspectRatioToImageSize[aspect_ratio] || "landscape_4_3",
      };

      console.log(`Regular input:`, regularInput);

      result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
        input: regularInput,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      requestId: result.requestId,
      modelUsed: modelEndpoint,
      finetuneId: finetune_id,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate image", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 