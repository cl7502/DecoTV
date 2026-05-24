/* eslint-disable no-console */
import { NextResponse } from 'next/server';

import { BUILD_TIMESTAMP, CURRENT_VERSION } from '@/lib/version';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 远程版本源配置
const UPDATE_REPO = process.env.NEXT_PUBLIC_UPDATE_REPO || 'Decohererk/DecoTV';
const UPDATE_REF = process.env.NEXT_PUBLIC_UPDATE_REF || 'main';

// 多个镜像源
const REMOTE_VERSION_URLS = [
  `https://cdn.jsdelivr.net/gh/${UPDATE_REPO}@${UPDATE_REF}/VERSION.txt`,
  `https://fastly.jsdelivr.net/gh/${UPDATE_REPO}@${UPDATE_REF}/VERSION.txt`,
  `https://raw.githubusercontent.com/${UPDATE_REPO}/${UPDATE_REF}/VERSION.txt`,
];

const FETCH_TIMEOUT = 5000;

/**
 * 带超时的 fetch（服务端版本）
 */
async function fetchWithTimeout(
  url: string,
  timeout: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${url}?_t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'DecoTV-VersionCheck/1.0',
      },
    });

    if (!response.ok) return null;
    return (await response.text()).trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 获取本地版本时间戳 (兼容 Edge: 不使用 fs)
 */
async function getLocalTimestamp(request: Request): Promise<string> {
  // 方法1: 使用构建时注入的环境变量
  if (
    process.env.BUILD_TIMESTAMP &&
    /^\d{14}$/.test(process.env.BUILD_TIMESTAMP)
  ) {
    return process.env.BUILD_TIMESTAMP;
  }

  // 方法2: 在 Edge 环境下，通过请求自身的静态资源 URL 来读取 VERSION.txt
  try {
    const url = new URL('/VERSION.txt', request.url);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (res.ok) {
      const content = await res.text();
      const timestamp = content.trim();
      if (/^\d{14}$/.test(timestamp)) {
        return timestamp;
      }
    }
  } catch {
    // ignore
  }

  // 方法3: 使用硬编码的默认值（从 version.ts 导入）
  return BUILD_TIMESTAMP;
}

/**
 * 获取远程版本时间戳
 */
async function getRemoteTimestamp(): Promise<string | null> {
  // 并行请求所有源
  const results = await Promise.allSettled(
    REMOTE_VERSION_URLS.map((url) => fetchWithTimeout(url, FETCH_TIMEOUT)),
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const timestamp = result.value;
      if (/^\d{14}$/.test(timestamp)) {
        return timestamp;
      }
    }
  }

  return null;
}

/**
 * 版本检查 API
 * GET /api/version/check - 完整的版本检测，包含本地和远程版本比较
 */
export async function GET(request: Request) {
  try {
    // 获取本地版本
    const localTimestamp = await getLocalTimestamp(request);

    // 获取远程版本
    const remoteTimestamp = await getRemoteTimestamp();

    // 比较版本
    let hasUpdate = false;
    if (remoteTimestamp) {
      const localNum = BigInt(localTimestamp);
      const remoteNum = BigInt(remoteTimestamp);
      hasUpdate = remoteNum > localNum;
    }

    return NextResponse.json({
      success: true,
      version: CURRENT_VERSION,
      localTimestamp,
      remoteTimestamp,
      hasUpdate,
      displayVersion: `v${CURRENT_VERSION}`,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('版本检查 API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 },
    );
  }
}
