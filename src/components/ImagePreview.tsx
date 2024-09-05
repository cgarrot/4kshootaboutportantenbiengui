import React from 'react';
import {View, Image, FlatList, StyleSheet} from 'react-native';

interface ImagePreviewProps {
  images: string[];
}

const ImagePreview: React.FC<ImagePreviewProps> = ({images}) => {
  return (
    <FlatList
      data={images}
      renderItem={({item}) => (
        <Image source={{uri: item}} style={styles.image} />
      )}
      keyExtractor={item => item}
      numColumns={3}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
  },
});

export default ImagePreview;
