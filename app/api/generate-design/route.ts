import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      apparel_type,
      theme_concept,
      print_placement,
      main_elements,
      preferred_colors
    } = body;

    // Build a comprehensive prompt from all the form data
    let prompt = `Generate a high-quality apparel design for a ${apparel_type}. `;
    
    // Image specifications: Fixed layout, aspect ratio, and angle
    prompt += `IMPORTANT IMAGE SPECIFICATIONS: The image must have a fixed 1:1 square aspect ratio (equal width and height). The apparel must be shown from a front-facing, straight-on view only - absolutely no side angles, no angled perspectives, no 3/4 views, no profile views. The garment should be displayed flat or on a model facing directly forward, centered in the frame. `;
    
    if (theme_concept) {
      prompt += `Theme: ${theme_concept}. `;
    }
    
    if (print_placement) {
      prompt += `Print placement: ${print_placement}. `;
    }
    
    if (main_elements) {
      prompt += `Main elements to include: ${main_elements}. `;
    }
    
    if (preferred_colors) {
      prompt += `Use these colors: ${preferred_colors}. `;
    }
    
    prompt += `Create a professional, print-ready design suitable for apparel manufacturing. The design should be visually appealing and appropriate for the target audience. Maintain consistent layout and composition across all generated designs.`;

    // Initialize the Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Try different model names for image generation
    // The exact model identifier may vary, so we'll try a few options
    const possibleModels = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image'];
    
    let imageData = null;
    let lastError = null;

    for (const modelName of possibleModels) {
      try {
        // Generate image using the model
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });

        // Extract the image from the response
        // The response structure: response.candidates[0].content.parts[]
        if (response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              // Check for inline data (image)
              if ((part as any).inlineData) {
                const inlineData = (part as any).inlineData;
                imageData = inlineData.data || inlineData;
                break;
              }
            }
          }
        }

        if (imageData) {
          break; // Successfully got image data
        }
      } catch (err: any) {
        lastError = err;
        continue; // Try next model
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { 
          error: 'Failed to generate image. Please check your API key and model availability.',
          details: lastError?.message || 'No image data returned from any model',
          attemptedModels: possibleModels
        },
        { status: 500 }
      );
    }

    // Convert imageData to base64 if it's not already
    let base64Image = imageData;
    if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
      base64Image = `data:image/png;base64,${imageData}`;
    } else if (Buffer.isBuffer(imageData)) {
      base64Image = `data:image/png;base64,${imageData.toString('base64')}`;
    }

    // Return the image data as base64
    return NextResponse.json({
      success: true,
      image: base64Image,
    });

  } catch (error: any) {
    console.error('Error generating design:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate design',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

