import { launchCamera, launchImageLibrary, MediaType, ImagePickerResponse, PhotoQuality } from 'react-native-image-picker';
import { Platform } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export const imageService = {
  // Open camera to take photo
  openCamera: (): Promise<ImagePickerResult | null> => {
    return new Promise((resolve) => {
      const options = {
        mediaType: 'photo' as MediaType,
        quality: 0.8 as PhotoQuality,
        maxWidth: 500,
        maxHeight: 500,
        // iOS specific options
        includeBase64: false,
        includeExtra: true,
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          resolve(null);
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          // Handle iOS file URI format
          let imageUri = asset.uri || '';
          
          // iOS: Check if URI starts with 'file://' and convert if needed
          if (Platform.OS === 'ios' && imageUri.startsWith('file://')) {
            // iOS file:// URI needs to be handled properly
            imageUri = imageUri.replace('file://', '');
          }
          
          resolve({
            uri: imageUri,
            name: asset.fileName || 'profile_photo.jpg',
            type: asset.type || 'image/jpeg',
            size: asset.fileSize,
          });
        } else {
          resolve(null);
        }
      });
    });
  },

  // Open gallery to select photo
  openGallery: (): Promise<ImagePickerResult | null> => {
    return new Promise((resolve) => {
      const options = {
        mediaType: 'photo' as MediaType,
        quality: 0.8 as PhotoQuality,
        maxWidth: 500,
        maxHeight: 500,
        // iOS specific options
        includeBase64: false,
        includeExtra: true,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          resolve(null);
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          // Handle iOS file URI format
          let imageUri = asset.uri || '';
          
          // iOS: Check if URI starts with 'file://' and convert if needed
          if (Platform.OS === 'ios' && imageUri.startsWith('file://')) {
            // iOS file:// URI needs to be handled properly
            imageUri = imageUri.replace('file://', '');
          }
          
          resolve({
            uri: imageUri,
            name: asset.fileName || 'profile_photo.jpg',
            type: asset.type || 'image/jpeg',
            size: asset.fileSize,
          });
        } else {
          resolve(null);
        }
      });
    });
  },

  // Create FormData for file upload
  createFormData: (image: ImagePickerResult, additionalData?: Record<string, any>): FormData => {
    const formData = new FormData();
    
    // Append the image file
    formData.append('photo', {
      uri: image.uri,
      type: image.type,
      name: image.name,
    } as any);

    // Append additional data if provided
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return formData;
  },
};
