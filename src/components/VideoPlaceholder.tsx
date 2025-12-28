import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface VideoPlaceholderProps {
  onEndCall?: () => void;
  onToggleCamera?: () => void;
  onToggleMic?: () => void;
  isVideoEnabled?: boolean;
  isAudioEnabled?: boolean;
}

const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({
  onEndCall,
  onToggleCamera,
  onToggleMic,
  isVideoEnabled = true,
  isAudioEnabled = true,
}) => {
  return (
    <View style={styles.container}>
      {/* Main Video Area */}
      <View style={styles.videoArea}>
        <View style={styles.placeholder}>
          <Icon name="videocam-off" size={60} color="#FFFFFF" />
          <Text style={styles.placeholderText}>Video call will start here</Text>
          <Text style={styles.placeholderSubtext}>This is a placeholder for the video component</Text>
        </View>
        
        {/* Self Video (Small Picture-in-Picture) */}
        <View style={styles.selfVideo}>
          <View style={styles.selfVideoPlaceholder}>
            <Icon name="person" size={30} color="#1A202C" />
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, !isAudioEnabled && styles.disabledButton]}
          onPress={onToggleMic}
        >
          <Icon 
            name={isAudioEnabled ? "mic" : "mic-off"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={onEndCall}
        >
          <Icon name="call" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isVideoEnabled && styles.disabledButton]}
          onPress={onToggleCamera}
        >
          <Icon 
            name={isVideoEnabled ? "videocam" : "videocam-off"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Call Info */}
      <View style={styles.callInfo}>
        <Text style={styles.callStatus}>Connecting...</Text>
        <Text style={styles.callDuration}>00:00</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoArea: {
    flex: 1,
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.7,
  },
  selfVideo: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 100,
    height: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selfVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  endCallButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  callInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  callStatus: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  callDuration: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default VideoPlaceholder;
