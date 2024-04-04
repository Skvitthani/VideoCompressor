import {
  Text,
  View,
  FlatList,
  Platform,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import RNFS from 'react-native-fs';
import React, {useState} from 'react';
import uuid from 'react-native-uuid';
import Video from 'react-native-video';
import {FFmpegKit} from 'ffmpeg-kit-react-native';
import ImageCropPicker from 'react-native-image-crop-picker';

interface VideoItem {
  url: string;
  size: string;
}

const BASE_DIR = `${RNFS.CachesDirectoryPath}/`;

const App = () => {
  const [video, setVideo] = useState<VideoItem[]>([]);

  const ensureDirExists = async (givenDir: string) => {
    try {
      const dirExists = await RNFS.exists(givenDir);
      if (!dirExists) {
        await RNFS.mkdir(givenDir);
      }
    } catch (error) {
      console.error(`Error ensuring directory ${givenDir} exists:`, error);
    }
  };

  const compressVideo = (videoUrl: string) => {
    const outputFilePath = `${BASE_DIR}${uuid.v4()}.mp4`;
    ensureDirExists(BASE_DIR);

    // -vf "colorspace=all=bt709:iall=bt709:format=yuv420p" :: To use haldle Video Contrast quality
    // -r 10 :: To use handle Video speed
    // -q:v 3 :: To use handle Video quality
    // -q:a 3 :: To use handle Audio quality
    // -i ${videoUrl} -c:v mpeg4 ${outputFilePath} :: To use compress video size

    FFmpegKit.execute(
      `-i ${videoUrl} -r 10 -vf "colorspace=all=bt709:iall=bt709:format=yuv420p" -c:v mpeg4 -q:v 3 -q:a 5 ${outputFilePath}`,
    ).then(async session => {
      const fileSize = await RNFS.stat(outputFilePath);
      let obj = {
        url: outputFilePath,
        size: parseFloat((fileSize.size / (1024 * 1024)).toFixed(2)).toString(),
      };

      setVideo(prv => {
        return [...prv, obj];
      });
    });
  };

  const openPicker = () => {
    ImageCropPicker.openPicker({
      mediaType: 'video',
      compressVideoPreset: 'HighestQuality',
    }).then(async response => {
      const VideoURL =
        Platform.OS === 'ios' ? response?.sourceURL || '' : response?.path;
      const fileSize = await RNFS.stat(VideoURL);
      let obj = {
        url: VideoURL,
        size: parseFloat((fileSize.size / (1024 * 1024)).toFixed(2)).toString(),
      };
      setVideo([...video, obj]);
      compressVideo(VideoURL);
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <FlatList
        data={video}
        renderItem={({item}) => {
          return (
            <View>
              <Video
                repeat
                controls
                hideShutterView
                resizeMode="cover"
                source={{uri: item.url}}
                style={styles.videoStyle}
              />
              <Text>{item?.size} MB</Text>
            </View>
          );
        }}
      />
      <TouchableOpacity style={styles.buttonStyle} onPress={openPicker}>
        <Text style={styles.buttonText}>Open Picker </Text>
      </TouchableOpacity>
      <SafeAreaView />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoStyle: {
    height: 230,
    width: Dimensions.get('window').width,
  },
  buttonStyle: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: 'green',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
