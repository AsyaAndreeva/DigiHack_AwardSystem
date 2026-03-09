import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    // Security check: only proxy Vercel Blob storage
    if (!url.includes('blob.vercel-storage.com')) {
        return new NextResponse('Invalid URL source', { status: 403 });
    }

    try {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) {
            console.error("[BlobProxy] Missing BLOB_READ_WRITE_TOKEN");
            return new NextResponse('Configuration Error', { status: 500 });
        }

        // Vercel Blob private access requires the token in headers
        // Try both Authorization and the vercel-specific header for maximum compatibility
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-vercel-blob-token': token
            },
            cache: 'no-cache'
        });

        if (!response.ok) {
            console.error(`[BlobProxy] Fetch failed: ${response.status}`, url);
            return new NextResponse(`Blob fetch failed: ${response.status}`, { status: response.status });
        }

        const data = await response.arrayBuffer();
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('[BlobProxy] Error:', error);
        return new NextResponse('Proxy Error', { status: 500 });
    }
}
