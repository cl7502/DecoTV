import { NextResponse } from 'next/server';

export const runtime = 'edge';

// OrionTV 兼容接口
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  // 安全检查：防止 SSRF。仅允许代理受信任域名的图片（如豆瓣图片）。
  try {
    const url = new URL(imageUrl);
    const allowedHosts = [
      'doubanio.com',
      'douban.com',
      'cmliussss.net',
      'cmliussss.com',
    ];
    const isAllowed = allowedHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith('.' + host),
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Forbidden: Untrusted image domain' },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
  }

  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        Referer: 'https://movie.douban.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: imageResponse.statusText },
        { status: imageResponse.status },
      );
    }

    const contentType = imageResponse.headers.get('content-type');

    if (!imageResponse.body) {
      return NextResponse.json(
        { error: 'Image response has no body' },
        { status: 500 },
      );
    }

    // 创建响应头
    const headers = new Headers();
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // 设置缓存头（长期缓存，且允许边缘节点在后台更新）
    const CACHE_TIME = 31536000; // 1年
    headers.set(
      'Cache-Control',
      `public, max-age=${CACHE_TIME}, s-maxage=${CACHE_TIME}, stale-while-revalidate=604800`,
    );
    headers.set('CDN-Cache-Control', `public, s-maxage=${CACHE_TIME}`);
    headers.set('Vercel-CDN-Cache-Control', `public, s-maxage=${CACHE_TIME}`);
    headers.set('Netlify-Vary', 'query');

    // 直接返回图片流
    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error fetching image' },
      { status: 500 },
    );
  }
}
