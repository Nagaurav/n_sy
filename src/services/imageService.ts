import { launchCamera, launchImageLibrary, MediaType, ImagePickerResponse } from 'react-native-image-picker';

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
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          resolve(null);
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          resolve({
            uri: asset.uri || '',
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
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          resolve(null);
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          resolve({
            uri: asset.uri || '',
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
