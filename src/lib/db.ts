/* eslint-disable @typescript-eslint/no-explicit-any */

import { AdminConfig } from './admin.types';
import {
  Favorite,
  IStorage,
  PlayRecord,
  SkipConfig,
  SkipPreset,
} from './types';

// storage type 常量: 'localstorage' | 'redis' | 'upstash' | 'kvrocks'
// 优先级策略：如果存在 UPSTASH_REDIS_REST_URL，即便在 Node 环境也优先使用 upstash
const IS_EDGE = process.env.NEXT_RUNTIME === 'edge';
const HAS_UPSTASH = !!(
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL
);

const STORAGE_TYPE =
  HAS_UPSTASH
    ? 'upstash'
    : (process.env.NEXT_PUBLIC_STORAGE_TYPE as
        | 'localstorage'
        | 'redis'
        | 'upstash'
        | 'kvrocks'
        | undefined) || 'localstorage';

/**
 * 核心存储工厂：通过延迟加载（Lazy Load）防止在 Edge 环境中加载不支持的 Node.js 模块。
 */
async function createStorageInstance(): Promise<IStorage> {
  console.log(`[DbManager] Initializing storage: ${STORAGE_TYPE} (Edge: ${IS_EDGE})`);

  switch (STORAGE_TYPE) {
    case 'redis': {
      // 仅在 Node 运行时加载 redis
      if (IS_EDGE) {
        console.warn('[DbManager] Redis (node-redis) is not supported in Edge Runtime. Falling back to MemoryStorage.');
        const { MemoryStorage } = await import('./memory.db');
        return new MemoryStorage();
      }
      const { RedisStorage } = await import('./redis.db');
      return new RedisStorage();
    }
    case 'upstash': {
      const { UpstashRedisStorage } = await import('./upstash.db');
      return new UpstashRedisStorage();
    }
    case 'kvrocks': {
      const { KvrocksStorage } = await import('./kvrocks.db');
      return new KvrocksStorage();
    }
    case 'localstorage':
    default: {
      const { MemoryStorage } = await import('./memory.db');
      return new MemoryStorage();
    }
  }
}

// 单例存储实例
let storageInstance: IStorage | null = null;
let initializationPromise: Promise<IStorage> | null = null;

async function getStorage(): Promise<IStorage> {
  if (storageInstance) return storageInstance;

  if (!initializationPromise) {
    initializationPromise = createStorageInstance();
  }

  storageInstance = await initializationPromise;
  return storageInstance;
}

// 工具函数：生成存储key
export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

/**
 * DbManager: 支持异步初始化的数据库管理器
 */
export class DbManager {
  // 播放记录相关方法
  async getPlayRecord(
    userName: string,
    source: string,
    id: string,
  ): Promise<PlayRecord | null> {
    const key = generateStorageKey(source, id);
    const storage = await getStorage();
    return storage.getPlayRecord(userName, key);
  }

  async savePlayRecord(
    userName: string,
    source: string,
    id: string,
    record: PlayRecord,
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    const storage = await getStorage();
    await storage.setPlayRecord(userName, key, record);
  }

  async getPlayRecordByKey(
    userName: string,
    key: string,
  ): Promise<PlayRecord | null> {
    const storage = await getStorage();
    return storage.getPlayRecord(userName, key);
  }

  async savePlayRecordByKey(
    userName: string,
    key: string,
    record: PlayRecord,
  ): Promise<void> {
    const storage = await getStorage();
    await storage.setPlayRecord(userName, key, record);
  }

  async getAllPlayRecords(userName: string): Promise<{
    [key: string]: PlayRecord;
  }> {
    const storage = await getStorage();
    return storage.getAllPlayRecords(userName);
  }

  async deletePlayRecord(
    userName: string,
    source: string,
    id: string,
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    const storage = await getStorage();
    await storage.deletePlayRecord(userName, key);
  }

  async deletePlayRecordByKey(userName: string, key: string): Promise<void> {
    const storage = await getStorage();
    await storage.deletePlayRecord(userName, key);
  }

  // 收藏相关方法
  async getFavorite(
    userName: string,
    source: string,
    id: string,
  ): Promise<Favorite | null> {
    const key = generateStorageKey(source, id);
    const storage = await getStorage();
    return storage.getFavorite(userName, key);
  }

  async saveFavorite(
    userName: string,
    source: string,
    id: string,
    favorite: Favorite,
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    const storage = await getStorage();
    await storage.setFavorite(userName, key, favorite);
  }

  async getAllFavorites(
    userName: string,
  ): Promise<{ [key: string]: Favorite }> {
    const storage = await getStorage();
    return storage.getAllFavorites(userName);
  }

  async deleteFavorite(
    userName: string,
    source: string,
    id: string,
  ): Promise<void> {
    const key = generateStorageKey(source, id);
    const storage = await getStorage();
    await storage.deleteFavorite(userName, key);
  }

  async isFavorited(
    userName: string,
    source: string,
    id: string,
  ): Promise<boolean> {
    const favorite = await this.getFavorite(userName, source, id);
    return favorite !== null;
  }

  // ---------- 用户相关 ----------
  async registerUser(userName: string, password: string): Promise<void> {
    const storage = await getStorage();
    await storage.registerUser(userName, password);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    const storage = await getStorage();
    return storage.verifyUser(userName, password);
  }

  // 检查用户是否已存在
  async checkUserExist(userName: string): Promise<boolean> {
    const storage = await getStorage();
    return storage.checkUserExist(userName);
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    const storage = await getStorage();
    await storage.changePassword(userName, newPassword);
  }

  async deleteUser(userName: string): Promise<void> {
    const storage = await getStorage();
    await storage.deleteUser(userName);
  }

  // ---------- 搜索历史 ----------
  async getSearchHistory(userName: string): Promise<string[]> {
    const storage = await getStorage();
    return storage.getSearchHistory(userName);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    const storage = await getStorage();
    await storage.addSearchHistory(userName, keyword);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    const storage = await getStorage();
    await storage.deleteSearchHistory(userName, keyword);
  }

  // 获取全部用户名
  async getAllUsers(): Promise<string[]> {
    const storage = await getStorage();
    if (typeof (storage as any).getAllUsers === 'function') {
      return (storage as any).getAllUsers();
    }
    return [];
  }

  // ---------- 管理员配置 ----------
  async getAdminConfig(): Promise<AdminConfig | null> {
    const storage = await getStorage();
    if (storage && typeof (storage as any).getAdminConfig === 'function') {
      return (storage as any).getAdminConfig();
    }
    return null;
  }

  async saveAdminConfig(config: AdminConfig): Promise<void> {
    const storage = await getStorage();
    if (storage && typeof (storage as any).setAdminConfig === 'function') {
      await (storage as any).setAdminConfig(config);
    }
  }

  // ---------- 跳过片头片尾配置 ----------
  async getSkipConfig(
    userName: string,
    source: string,
    id: string,
  ): Promise<SkipConfig | null> {
    const storage = await getStorage();
    if (typeof (storage as any).getSkipConfig === 'function') {
      return (storage as any).getSkipConfig(userName, source, id);
    }
    return null;
  }

  async setSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: SkipConfig,
  ): Promise<void> {
    const storage = await getStorage();
    if (typeof (storage as any).setSkipConfig === 'function') {
      await (storage as any).setSkipConfig(userName, source, id, config);
    }
  }

  async deleteSkipConfig(
    userName: string,
    source: string,
    id: string,
  ): Promise<void> {
    const storage = await getStorage();
    if (typeof (storage as any).deleteSkipConfig === 'function') {
      await (storage as any).deleteSkipConfig(userName, source, id);
    }
  }

  async getAllSkipConfigs(
    userName: string,
  ): Promise<{ [key: string]: SkipConfig }> {
    const storage = await getStorage();
    if (typeof (storage as any).getAllSkipConfigs === 'function') {
      return (storage as any).getAllSkipConfigs(userName);
    }
    return {};
  }

  async getSkipPresets(userName: string): Promise<SkipPreset[]> {
    const storage = await getStorage();
    if (typeof (storage as any).getSkipPresets === 'function') {
      return (storage as any).getSkipPresets(userName);
    }
    return [];
  }

  async setSkipPresets(userName: string, presets: SkipPreset[]): Promise<void> {
    const storage = await getStorage();
    if (typeof (storage as any).setSkipPresets === 'function') {
      await (storage as any).setSkipPresets(userName, presets);
    }
  }

  // ---------- 数据清理 ----------
  async clearAllData(): Promise<void> {
    const storage = await getStorage();
    if (typeof (storage as any).clearAllData === 'function') {
      await (storage as any).clearAllData();
    } else {
      throw new Error('存储类型不支持清空数据操作');
    }
  }
}

// 导出默认实例
export const db = new DbManager();
