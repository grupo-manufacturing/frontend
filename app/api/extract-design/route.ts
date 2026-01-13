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
    const { imageUrl, designId } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Get auth token from request headers (passed from frontend)
    const authHeader = request.headers.get('authorization');
    
    // If designId is provided, check if pattern_url already exists in database
    if (designId && authHeader) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-47rb.onrender.com/api';
        const checkResponse = await fetch(`${backendUrl}/ai-designs/${designId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
        });

        if (checkResponse.ok) {
          const designData = await checkResponse.json();
          if (designData.success && designData.data && designData.data.pattern_url) {
            // Pattern already exists, return it directly (no extraction needed)
            return NextResponse.json({
              success: true,
              imageUrl: designData.data.pattern_url
            });
          }
        }
      } catch (error) {
        // If check fails, continue with extraction
        console.warn('Failed to check for existing pattern URL:', error);
      }
    }

    // Initialize the Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Fetch the image from Cloudinary URL and convert to base64 for Gemini
    let base64Data: string;
    
    try {
      // Fetch image from URL (could be Cloudinary URL or any image URL)
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image from URL');
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);
      base64Data = buffer.toString('base64');
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch image: ' + error.message },
        { status: 400 }
      );
    }

    // Build prompt to extract only the design
    const prompt = `Analyze this image of an apparel item (shirt, hoodie, jeans, etc.) with a design printed on it. 

Your task is to extract ONLY the design/graphic/pattern that is printed on the garment. 

IMPORTANT REQUIREMENTS:
1. Remove the entire garment/clothing item - do not show any fabric, sleeves, collar, or clothing structure
2. Extract ONLY the printed design, graphic, text, pattern, or artwork
3. The output should be the design element isolated on a transparent or white background
4. Maintain the exact colors, text, graphics, and visual elements from the original design
5. The design should be centered and properly cropped to show only the design area
6. Output format: Square aspect ratio (1:1) with the design centered
7. If there are multiple design elements (front and back), extract them separately or show the main design element
8. Preserve all text, logos, graphics, and visual details exactly as they appear

Generate an image that contains ONLY the extracted design, ready for use in manufacturing/printing.`;

    // Try different model names for image generation
    // First try image generation models, then fall back to vision models
    const possibleModels = [
      'gemini-3-pro-image-preview', 
      'gemini-2.5-flash-image',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];
    
    let imageData = null;
    let lastError = null;

    for (const modelName of possibleModels) {
      try {
        // Generate image using the model with the original image as input
        // For image generation models, pass image and text prompt together
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: 'image/png'
                  }
                },
                { text: prompt }
              ]
            }
          ],
        });

        // Extract the image from the response
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
        console.error(`Error with model ${modelName}:`, err);
        continue; // Try next model
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { 
          error: 'Failed to extract design. Please try again.',
          details: lastError?.message || 'No image data returned from any model',
          attemptedModels: possibleModels
        },
        { status: 500 }
      );
    }

    // Convert imageData to base64 format for Cloudinary upload
    let base64Image: string;
    if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
      base64Image = `data:image/png;base64,${imageData}`;
    } else if (Buffer.isBuffer(imageData)) {
      base64Image = `data:image/png;base64,${imageData.toString('base64')}`;
    } else {
      base64Image = imageData as string;
    }

    // Upload extracted design to Cloudinary via backend API
    let cloudinaryUrl = null;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-47rb.onrender.com/api';
      const authHeader = request.headers.get('authorization');
      
      // Call backend to upload to Cloudinary
      const uploadResponse = await fetch(`${backendUrl}/upload/ai-design-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {})
        },
        body: JSON.stringify({
          image_base64: base64Image,
          apparel_type: 'extracted-design'
        }),
      });

      const uploadData = await uploadResponse.json();

      if (uploadResponse.ok && uploadData.success && uploadData.data && uploadData.data.url) {
        cloudinaryUrl = uploadData.data.url;
        
        // If designId is provided, save the pattern URL to database
        if (designId && cloudinaryUrl && authHeader) {
          try {
            const updateResponse = await fetch(`${backendUrl}/ai-designs/${designId}/pattern`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
              },
              body: JSON.stringify({
                pattern_url: cloudinaryUrl
              }),
            });
            
            if (!updateResponse.ok) {
              console.warn('Failed to save pattern URL to database');
            }
          } catch (updateError) {
            console.warn('Error saving pattern URL:', updateError);
          }
        }
        
        // Return Cloudinary URL
        return NextResponse.json({
          success: true,
          imageUrl: cloudinaryUrl
        });
      }
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
    }

    // Fallback: Return base64 if Cloudinary upload fails
    return NextResponse.json({
      success: true,
      imageUrl: base64Image,
      isBase64: true
    });

  } catch (error: any) {
    console.error('Error extracting design:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to extract design',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

