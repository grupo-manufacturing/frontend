import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      image_url,
      apparel_type,
      design_description,
      quantity,
      preferred_colors,
      print_placement
    } = body;

    // Validate required fields
    if (!image_url || !apparel_type || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: image_url, apparel_type, and quantity are required' },
        { status: 400 }
      );
    }

    // Get the authorization token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Get the backend API URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://grupo-backend.onrender.com/api';

    // Call the backend API to save the AI design
    const response = await fetch(`${backendUrl}/ai-designs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        image_url,
        apparel_type,
        design_description: design_description || null,
        quantity: parseInt(quantity),
        preferred_colors: preferred_colors || null,
        print_placement: print_placement || null,
        status: 'draft'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Failed to publish AI design' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data || data
    });

  } catch (error: any) {
    console.error('Error publishing AI design:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to publish AI design',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

