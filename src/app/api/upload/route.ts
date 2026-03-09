import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (filename && request.body) {
    // Handling direct stream upload with filename in search params
    try {
      const blob = await put(filename, request.body, {
        access: 'private',
        addRandomSuffix: true,
      });
      return NextResponse.json(blob);
    } catch (error) {
      console.error("Vercel Blob Upload Error:", error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 },
      );
    }
  } else {
      // Handling FormData upload (what our client currently sends)
      const form = await request.formData();
      const file = form.get('file') as File;
      
      if (!file) {
          return NextResponse.json({error: "No file provided"}, {status: 400})
      }
      
      try {
        console.log("Attempting to upload file:", file.name, "Size:", file.size);
        const blob = await put(file.name, file.stream(), {
            access: 'private',
            addRandomSuffix: true,
        });
        console.log("Upload successful:", blob.url);
        return NextResponse.json(blob);
      } catch (error) {
          console.error("Vercel Blob Upload Error Details:", error);
          return NextResponse.json(
            { error: (error as Error).message || "Internal Server Error during upload" },
            { status: 500 },
          );
      }
  }
}
