import axios from 'axios';

interface Dir {
  name: string;
  files: string[];
}

interface Photos {
  errorMessage: string;
  errorCode: number;
  dirs: Dir[];
}

class CameraService {
  public host: string;

  constructor(host: string = '192.168.0.1') {
    this.host = host;
  }

  async waitForServer(): Promise<void> {
    const propsUrl = `http://${this.host}/v1/props`;
    const maxRetries = 10;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await axios.get(propsUrl, {timeout: 1000});
        return;
      } catch (error) {
        console.warn(
          `Failed to fetch ${propsUrl}. Retry ${retries + 1}/${maxRetries}`,
        );
        retries++;
        if (retries >= maxRetries) {
          throw new Error(
            `Failed to connect to server after ${maxRetries} attempts`,
          );
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async getPhotos(): Promise<Photos> {
    const photosUrl = `http://${this.host}/v1/photos`;
    const response = await axios.get<Photos>(photosUrl, {timeout: 120000});
    if (response.data.errorCode !== 200) {
      throw new Error(
        `Failed to GET ${photosUrl}, errMsg: ${response.data.errorMessage}`,
      );
    }
    return response.data;
  }

  async downloadPhoto(dirName: string, fileName: string): Promise<ArrayBuffer> {
    const photoUrl = `http://${this.host}/v1/photos/${dirName}/${fileName}`;
    const response = await axios.get<ArrayBuffer>(photoUrl, {
      responseType: 'arraybuffer',
    });
    if (response.status !== 200) {
      throw new Error(
        `Failed to GET ${photoUrl}, message: ${response.statusText}`,
      );
    }
    return response.data;
  }
}

export default CameraService;
