import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheStore } from '../../application/ports/cache-store';

/** In-memory by default; switching to Redis only changes the CacheModule configuration. */
@Injectable()
export class CacheManagerStore extends CacheStore {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {
    super();
  }

  get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.cache.set(key, value);
  }
}
