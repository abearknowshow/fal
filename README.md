# FLUX1.1 Pro Image Generator

A Next.js application for generating high-quality images using Fal AI's FLUX1.1 [pro] ultra fine-tuned model. Built with Next.js 15, Tailwind CSS, and shadcn/ui components.

## Features

- 🎨 **Advanced Image Generation**: Leverage FLUX1.1 [pro] ultra fine-tuned model for professional-grade images
- 🎛️ **Comprehensive Controls**: Full control over aspect ratios, safety settings, finetune parameters, and more
- 🖼️ **Gallery Management**: Dedicated gallery page with thumbnail grid and full-size image modal
- 🧭 **Responsive Navigation**: Modern navigation with logo, page links, and theme toggle
- 🌙 **Dark Mode Support**: Toggle between light and dark themes with system preference detection
- 🔒 **Secure API Key Management**: Server-side API calls keep your Fal AI key secure
- 📱 **Responsive Design**: Beautiful, modern UI that works on all devices
- ⚡ **Real-time Feedback**: Loading states and error handling for smooth user experience

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A [Fal AI API key](https://fal.ai/)

### Installation

1. **Clone and install dependencies** (already done if you're reading this):
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add your Fal AI API key:
   ```bash
   FAL_KEY=your_fal_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Navigation

The application features a responsive navigation bar with:
- **Logo**: Bicep icon with "Flux 1.1 Pro" branding
- **Generate**: Home page for creating new images
- **Gallery**: Dedicated page for browsing all generated images
- **Theme Toggle**: Switch between light and dark modes

### Basic Image Generation

1. Navigate to the "Generate" page (home)
2. Enter a descriptive prompt in the "Prompt" field
3. Optionally configure settings like aspect ratio, number of images, etc.
4. Click "Generate Image" and wait for the AI to create your image
5. View and download your generated images

### Gallery Features

- **Thumbnail Grid**: Responsive grid layout (2-4 columns based on screen size)
- **Image Modal**: Click any thumbnail to view full-size with navigation
- **Model Filter**: Filter images by finetune model (All, Regular FLUX, Brawler, Prop)
- **Metadata Display**: View prompts, seeds, and generation parameters
- **Persistent Storage**: Images are saved locally and persist between sessions

#### Model Filtering

The gallery includes a smart filter that automatically categorizes images based on the finetune model used:

- **All Models**: Shows all images in the gallery
- **Regular FLUX**: Images generated with the standard FLUX1.1 [pro] model
- **Brawler**: Images generated with the "brawler" finetune
- **Prop**: Images generated with the "prop" finetune

**Enhanced Detection System:**
- **New Images**: Uses stored `finetuneId` for 100% accurate filtering
- **Legacy Images**: Falls back to trigger word detection in prompts
- **Hybrid Approach**: Ensures all images are properly categorized regardless of when they were generated

The filter counts show how many images are in each category, making it easy to see your collection at a glance.

### Advanced Features

- **Finetune Integration**: If you have a custom finetune, enter the `finetune_id` and adjust the `finetune_strength`
- **Aspect Ratios**: Choose from various aspect ratios (16:9, 1:1, 9:16, etc.)
- **Safety Controls**: Adjust safety tolerance and enable/disable safety checker
- **Seed Control**: Use specific seeds for reproducible results
- **Output Formats**: Choose between JPEG and PNG formats
- **Raw Mode**: Generate less processed, more natural-looking images

## API Reference

The application uses the Fal AI FLUX1.1 [pro] ultra fine-tuned model:
- **Model**: `fal-ai/flux-pro/v1.1-ultra-finetuned`
- **Documentation**: [Fal AI FLUX1.1 Pro Ultra API](https://fal.ai/models/fal-ai/flux-pro/v1.1-ultra-finetuned/api)

### Supported Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `prompt` | string | Text description of the image to generate | Required |
| `aspect_ratio` | string | Image aspect ratio (16:9, 1:1, etc.) | "16:9" |
| `num_images` | number | Number of images to generate (1-4) | 1 |
| `seed` | number | Random seed for reproducible results | Random |
| `finetune_id` | string | ID of custom finetune model | "" |
| `finetune_strength` | number | Strength of finetune influence (0-1) | 0.8 |
| `output_format` | string | Output format (jpeg/png) | "jpeg" |
| `safety_tolerance` | string | Safety level (1-5) | "2" |
| `enable_safety_checker` | boolean | Enable safety filtering | true |
| `raw` | boolean | Generate less processed images | false |

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── download-image/
│   │   │   ├── generate-image/
│   │   │   ├── metadata/
│   │   │   └── scan-images/
│   │   ├── gallery/
│   │   │   └── page.tsx              # Dedicated gallery page
│   │   ├── globals.css               # Global styles with dark mode
│   │   ├── layout.tsx                # Root layout with navigation
│   │   └── page.tsx                  # Main image generation page
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── ImageGallery.tsx          # Gallery grid component
│   │   ├── ImageGenerationForm.tsx   # Image generation form
│   │   ├── ImageModal.tsx            # Full-size image modal
│   │   ├── ImageResults.tsx          # Generation results display
│   │   ├── Navigation.tsx            # Main navigation component
│   │   └── ResultsContainer.tsx      # Results container wrapper
│   ├── hooks/
│   │   ├── useGallery.ts             # Gallery state management
│   │   ├── useImageGeneration.ts     # Image generation logic
│   │   ├── useImageModal.ts          # Modal state management
│   │   └── useTheme.ts               # Dark mode theme management
│   ├── lib/
│   │   └── utils.ts                  # Utility functions
│   └── types/
│       └── image-generation.ts       # TypeScript type definitions
├── public/
│   └── images/                       # Generated images storage
├── .env.local                        # Environment variables (create this)
└── package.json
```

## Technologies Used

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible UI components
- **[Fal AI](https://fal.ai/)** - FLUX1.1 [pro] ultra fine-tuned model
- **TypeScript** - Type-safe JavaScript

## Security Notes

- ✅ API keys are handled server-side only
- ✅ No sensitive data exposed to client
- ✅ Built-in safety controls and content filtering
- ✅ Secure environment variable management

## Troubleshooting

### Common Issues

1. **"Failed to generate image" error**:
   - Check that your `FAL_KEY` is correctly set in `.env.local`
   - Verify your Fal AI account has sufficient credits
   - Ensure your prompt complies with content policies

2. **Long generation times**:
   - FLUX1.1 [pro] is a high-quality model that may take 30-60 seconds
   - Check the network tab for any connection issues

3. **Environment variable not found**:
   - Make sure `.env.local` exists in the root directory
   - Restart the development server after adding environment variables

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Fal AI](https://fal.ai/) for providing the FLUX1.1 [pro] ultra fine-tuned model
- [shadcn](https://ui.shadcn.com/) for the beautiful UI components
- [Vercel](https://vercel.com/) for Next.js and hosting platform
