// Image cache utility using IndexedDB for temporary storage
export interface CachedImage {
  id: string;
  url: string;
  blob: Blob;
  metadata: {
    prompt: string;
    seed: number;
    width: number;
    height: number;
    modelUsed?: string;
    finetuneId?: string;
    timestamp: number;
  };
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'failed';
  localUrl?: string;
}

class ImageCacheManager {
  private dbName = 'fal-image-cache';
  private dbVersion = 1;
  private storeName = 'images';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'metadata.timestamp', { unique: false });
          store.createIndex('downloadStatus', 'downloadStatus', { unique: false });
        }
      };
    });
  }

  async cacheImage(url: string, metadata: CachedImage['metadata']): Promise<string> {
    if (!this.db) await this.init();
    
    try {
      // Fetch the image and convert to blob
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      
      const blob = await response.blob();
      const id = `${metadata.seed}-${metadata.timestamp}`;
      
      const cachedImage: CachedImage = {
        id,
        url,
        blob,
        metadata,
        downloadStatus: 'pending'
      };
      
      // Store in IndexedDB
      await this.storeImage(cachedImage);
      
      // Return blob URL for immediate display
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to cache image:', error);
      return url; // Fallback to original URL
    }
  }

  private async storeImage(image: CachedImage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(image);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateDownloadStatus(id: string, status: CachedImage['downloadStatus'], localUrl?: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const image = getRequest.result;
        if (image) {
          image.downloadStatus = status;
          if (localUrl) image.localUrl = localUrl;
          
          const putRequest = store.put(image);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve(); // Image not found, but don't error
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getCachedImages(): Promise<CachedImage[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getCachedImage(id: string): Promise<CachedImage | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async clearOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoffTime = Date.now() - maxAgeMs;
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          // Revoke blob URL to free memory
          if (cursor.value.blob) {
            URL.revokeObjectURL(URL.createObjectURL(cursor.value.blob));
          }
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Singleton instance
export const imageCache = new ImageCacheManager(); 