import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { 
  showDownloadNotification, 
  showDownloadCompleteNotification, 
  showDownloadErrorNotification 
} from './downloadNotification';

interface EnhancedPDFOptions {
  html: string;
  fileName: string;
}

/**
 * Enhanced permission handling for PDF downloads
 */
export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    // For Android 13+ (API 33+)
    if (Platform.Version >= 33) {
      const hasMediaPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      
      if (!hasMediaPermission) {
        const mediaGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        
        if (mediaGranted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }
      } else {
        return true;
      }
    }

    // For older Android versions or fallback
    const hasStoragePermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    
    if (!hasStoragePermission) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    
    return true;
  } catch (error) {
    console.log('Permission check failed:', error);
    return true;
  }
};

/**
 * Get the public Downloads directory path
 */
export const getPublicDownloadsPath = (): string => {
  if (Platform.OS === 'android') {
    // Use the public Downloads directory - most accessible location
    return RNFS.DownloadDirectoryPath;
  } else {
    // iOS: Use documents directory
    return RNFS.DocumentDirectoryPath;
  }
};

/**
 * Enhanced PDF download with reliable file saving to Downloads folder
 */
export const downloadPDFEnhanced = async (
  options: EnhancedPDFOptions,
  RNHTMLtoPDF: any
): Promise<{ success: boolean; filePath?: string; error?: string; warning?: string }> => {
  try {
    // Show download start notification
    await showDownloadNotification({
      title: 'Generating PDF',
      message: 'Creating your PDF document and saving to Downloads folder...',
      fileName: options.fileName
    });

    // Request permissions first
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      await showDownloadErrorNotification(
        'Storage permission is required to download PDF files. Please enable it in your phone settings.'
      );
      return {
        success: false,
        error: 'Storage permission is required to download PDF files. Please enable it in your phone settings.'
      };
    }

    // Get the public downloads directory
    const downloadsPath = getPublicDownloadsPath();
    const targetFilePath = `${downloadsPath}/${options.fileName}`;

    console.log('📁 Target download path:', targetFilePath);

    // First, generate PDF using the original library
    console.log('🖨️  Generating PDF using react-native-html-to-pdf...');
    
    const pdfOptions = {
      html: options.html,
      fileName: options.fileName,
      directory: 'Download', // This will save to app's Download directory first
    };

    const file = await RNHTMLtoPDF.generatePDF(pdfOptions);
    
    if (!file || !file.filePath) {
      throw new Error('PDF generation failed - no file path returned');
    }

    console.log('📄 PDF generated at:', file.filePath);

    // Now, move the file to the public Downloads directory if it's not already there
    if (file.filePath !== targetFilePath) {
      console.log('🔄 Moving file to public Downloads folder...');
      
      try {
        // Ensure the Downloads directory exists
        await RNFS.mkdir(downloadsPath, {
          NSURLIsExcludedFromBackupKey: true
        }).catch(() => {
          // Directory might already exist, ignore error
        });

        // Move the file to the public Downloads directory
        await RNFS.moveFile(file.filePath, targetFilePath);
        
        console.log('✅ File successfully moved to:', targetFilePath);
        
        // Verify the file exists in the new location
        const fileExists = await RNFS.exists(targetFilePath);
        
        if (fileExists) {
          const fileInfo = await RNFS.stat(targetFilePath);
          console.log('📋 File info:', {
            size: fileInfo.size,
            isFile: fileInfo.isFile(),
            path: targetFilePath
          });
          
          // 🔄 Trigger media scan to make file visible in Android Downloads
          if (Platform.OS === 'android') {
            try {
              await RNFS.scanFile(targetFilePath);
              console.log('📱 Media scan completed - file should now be visible in Downloads');
            } catch (scanError) {
              console.log('⚠️ Media scan failed, but file is saved:', scanError);
            }
          }
          
          // Note: showDownloadCompleteNotification is called by showEnhancedPDFResult
          // to avoid duplicate popups, we'll only call the final result notification
          
          return {
            success: true,
            filePath: targetFilePath,
          };
        } else {
          throw new Error('File move completed but file not found at target location');
        }
        
      } catch (moveError: any) {
        console.log('⚠️  Could not move file to public Downloads, using original location:', moveError.message);
        
        // Fallback to original location - don't show duplicate notification
        // showEnhancedPDFResult will handle the user feedback
        
        return {
          success: true,
          filePath: file.filePath,
          warning: `File saved to app directory instead of Downloads folder. Location: ${file.filePath}`
        };
      }
    } else {
      // File is already in the right place
      console.log('✅ File already in Downloads folder:', file.filePath);
      
      // Don't show duplicate notification - showEnhancedPDFResult will handle it
      
      return {
        success: true,
        filePath: file.filePath,
      };
    }

  } catch (error: any) {
    console.error('❌ Enhanced PDF download error:', error);
    await showDownloadErrorNotification(error.message || 'Failed to generate PDF');
    
    return {
      success: false,
      error: error.message || 'Failed to generate PDF'
    };
  }
};

/**
 * Enhanced user feedback with detailed file location information
 */
export const showEnhancedPDFResult = (
  result: { success: boolean; filePath?: string; error?: string; warning?: string },
  fileName: string
) => {
  if (result.success && result.filePath) {
    console.log('✅ Enhanced PDF download successful:', { fileName, filePath: result.filePath });
    
    const isPublicDownloads = result.filePath.includes(RNFS.DownloadDirectoryPath);
    
    if (isPublicDownloads) {
      Alert.alert(
        '✅ PDF Downloaded Successfully!',
        `Your PDF has been saved to your phone's Downloads folder.\n\n📁 Location: Downloads\n📄 File: ${fileName}\n\n💡 To find it:\n1. Open your File Manager app\n2. Go to "Downloads" folder\n3. Look for "${fileName}"\n\nIf you don't see it immediately, try refreshing the folder or check again in a few moments.`,
        [{ text: 'Got it!' }]
      );
    } else if (result.warning) {
      Alert.alert(
        '⚠️ PDF Downloaded with Warning',
        `Your PDF was saved but not to the Downloads folder.\n\n${result.warning}\n\n📄 File: ${fileName}`,
        [{ text: 'OK' }]
      );
    }
  } else {
    console.error('❌ Enhanced PDF download failed:', { fileName, error: result.error });
  }
};
