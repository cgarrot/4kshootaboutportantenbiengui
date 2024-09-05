import BackgroundFetch from 'react-native-background-fetch';
import CameraService from './CameraService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {storage} from '../firebaseConfig';

class BackgroundService {
  private cameraService: CameraService;

  constructor() {
    this.cameraService = new CameraService();
  }

  async waitForServer(): Promise<void> {
    await this.cameraService.waitForServer();
  }

  async initialize() {
    BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
      },
      async taskId => {
        await this.syncPhotos();
        BackgroundFetch.finish(taskId);
      },
      error => {
        console.error('Background fetch failed to start', error);
      },
    );
  }

  async syncPhotos(): Promise<string[]> {
    await this.cameraService.waitForServer();
    const photos = await this.cameraService.getPhotos();
    const newPhotos: string[] = [];

    for (const dir of photos.dirs) {
      for (const file of dir.files) {
        const key = `${dir.name}/${file}`;
        const isSynced = await AsyncStorage.getItem(key);
        if (!isSynced) {
          const photoData = await this.cameraService.downloadPhoto(
            dir.name,
            file,
          );
          const uri = await this.uploadToFirebase(photoData, key);
          await AsyncStorage.setItem(key, 'synced');
          newPhotos.push(uri);
        }
      }
    }

    return newPhotos;
  }

  async uploadToFirebase(photoData: ArrayBuffer, key: string): Promise<string> {
    const reference = storage().ref(key);
    await reference.putFile(photoData);
    const url = await reference.getDownloadURL();
    return url;
  }

  async getSyncedImages(): Promise<string[]> {
    try {
      const reference = storage().ref();
      const result = await reference.list();
      const downloadURLs = await Promise.all(
        result.items.map(async item => {
          const url = await item.getDownloadURL();
          const metadata = await item.getMetadata();
          return {url, createdAt: metadata.timeCreated};
        }),
      );

      // Sort images by creation date, newest first
      downloadURLs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Keep only the 20 most recent images
      const recentImages = downloadURLs.slice(0, 20);

      // Remove older images
      await this.removeOldImages(downloadURLs.slice(20));

      return recentImages.map(item => item.url);
    } catch (error) {
      console.error('Error fetching synced images:', error);
      throw error;
    }
  }

  private async removeOldImages(
    oldImages: {url: string; createdAt: string}[],
  ): Promise<void> {
    for (const image of oldImages) {
      try {
        const imageRef = storage().refFromURL(image.url);
        await imageRef.delete();
        console.log(`Deleted old image: ${image.url}`);
      } catch (error) {
        console.error(`Error deleting image ${image.url}:`, error);
      }
    }
  }
}

export default BackgroundService;
