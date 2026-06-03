import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const ALLOWED_HOSTS = ['s3.sumedangkab.go.id'];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const w = Math.min(parseInt(req.nextUrl.searchParams.get('w') || '96'), 400);
  const q = Math.min(parseInt(req.nextUrl.searchParams.get('q') || '50'), 90);

  if (!url) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  // Validate URL to prevent SSRF
  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return new NextResponse('Forbidden host', { status: 403 });
    }
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return new NextResponse('Failed to fetch image', { status: 502 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    const optimized = await sharp(buffer)
      .resize(w, w, { fit: 'cover', withoutEnlargement: true })
      .jpeg({ quality: q, progressive: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(optimized), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new NextResponse('Image processing failed', { status: 500 });
  }
}
