import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  Image,
} from 'react-native';

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  latestImageUri: string | null;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isRefreshing,
  latestImageUri,
}) => {
  return (
    <View className="items-center">
      {latestImageUri && (
        <Image
          source={{uri: latestImageUri}}
          className="w-32 h-32 rounded-md mb-4"
        />
      )}
      <TouchableOpacity
        className="bg-blue-500 py-2 px-4 rounded-md"
        onPress={onRefresh}
        disabled={isRefreshing}>
        {isRefreshing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">Refresh Photos</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default RefreshButton;
