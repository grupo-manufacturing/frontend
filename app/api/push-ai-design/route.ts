import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('id');

    if (!designId) {
      return NextResponse.json(
        { error: 'Design ID is required' },
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

    // Call the backend API to push the AI design
    const response = await fetch(`${backendUrl}/ai-designs/${designId}/push`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Failed to push AI design' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data || data
    });

  } catch (error: any) {
    console.error('Error pushing AI design:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to push AI design',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

