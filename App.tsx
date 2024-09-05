import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import BackgroundService from './src/services/BackgroundService';
import {storage, ref, listAll, getDownloadURL} from './src/firebaseConfig';

export default function App() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [images, setImages] = useState<{name: string; url: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadedImage, setLastUploadedImage] = useState<string | null>(
    null,
  );
  const backgroundService = new BackgroundService();

  useEffect(() => {
    fetchImagesFromFirebase();
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsRefreshing(true);
      if (backgroundService.waitForServer) {
        await backgroundService.waitForServer();
      } else {
        console.warn('waitForServer method not found in BackgroundService');
      }
      const photos = await backgroundService.cameraService.getPhotos();
      if (photos.dirs.length > 0 && photos.dirs[0].files.length > 0) {
        const lastPhoto = photos.dirs[0].files[photos.dirs[0].files.length - 1];
        const photoData = await backgroundService.cameraService.downloadPhoto(
          photos.dirs[0].name,
          lastPhoto,
        );
        const randomNumber = Math.floor(Math.random() * 1000000);
        const fileName = `INIT_GET_${randomNumber}`;
        await backgroundService.uploadToFirebase(photoData, fileName);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchImagesFromFirebase = async () => {
    const imagesRef = ref(storage);
    try {
      const result = await listAll(imagesRef);
      const imagePromises = result.items.map(async imageRef => {
        const url = await getDownloadURL(imageRef);
        return {name: imageRef.name, url};
      });
      const imageData = await Promise.all(imagePromises);
      setImages(imageData);
    } catch (error) {
      console.error('Error fetching images from Firebase:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await backgroundService.syncPhotos();
    await fetchImagesFromFirebase();
    setIsRefreshing(false);
  };

  const handleRefreshList = () => {
    fetchImagesFromFirebase();
  };

  const handleUploadLastImage = async () => {
    try {
      setIsUploading(true);
      const photos = await backgroundService.cameraService.getPhotos();
      if (photos.dirs.length > 0 && photos.dirs[0].files.length > 0) {
        const lastPhoto = photos.dirs[0].files[photos.dirs[0].files.length - 1];
        const photoData = await backgroundService.cameraService.downloadPhoto(
          photos.dirs[0].name,
          lastPhoto,
        );
        const randomNumber = Math.floor(Math.random() * 1000000);
        const fileName = `LAST_UPLOAD_${randomNumber}`;
        const url = await backgroundService.uploadToFirebase(
          photoData,
          fileName,
        );
        setLastUploadedImage(url);
        await fetchImagesFromFirebase();
      } else {
        console.warn('No photos found on the camera');
      }
    } catch (error) {
      console.error('Error uploading last image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold mb-4">Ricoh GR III Uploader</Text>

        <TouchableOpacity
          className="bg-blue-500 py-2 px-4 rounded-md mb-4"
          onPress={handleRefresh}
          disabled={isRefreshing}>
          {isRefreshing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Refresh Photos</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-green-500 py-2 px-4 rounded-md mb-4"
          onPress={handleRefreshList}>
          <Text className="text-white font-semibold">Refresh List</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-purple-500 py-2 px-4 rounded-md mb-4"
          onPress={handleUploadLastImage}
          disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Upload Last Image</Text>
          )}
        </TouchableOpacity>

        {lastUploadedImage && (
          <Image
            source={{uri: lastUploadedImage}}
            style={{width: 100, height: 100, marginBottom: 10}}
          />
        )}

        <Text className="text-lg font-semibold mt-4 mb-2">Image Names:</Text>
        <FlatList
          data={images}
          renderItem={({item}) => <Text className="text-sm">{item.name}</Text>}
          keyExtractor={item => item.name}
          className="w-full px-4"
        />

        <Text className="text-lg font-semibold mt-4 mb-2">Image Grid:</Text>
        <FlatList
          data={images}
          renderItem={({item}) => (
            <Image
              source={{uri: item.url}}
              style={{width: 100, height: 100, margin: 5}}
            />
          )}
          keyExtractor={item => item.name}
          numColumns={3}
          className="mt-4"
        />
      </View>
    </SafeAreaView>
  );
}
