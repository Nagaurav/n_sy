// JoinSessionScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ROUTES } from '../navigation/constants';

// To integrate with your provider: import { openChat, startVideoCall, startAudioCall } from '../services/your-call-service';

const JoinSessionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  /**
   * Params you should pass here:
   * - sessionTime: string (ISO)
   * - mode: 'chat' | 'audio' | 'video'
   * - meetingLink: string (optional; for Jitsi/Zoom etc.)
   * - professional: object (name, avatar, etc.)
   * - bookingId: string (if needed)
   */
  const {
    sessionTime,
    mode,
    meetingLink,
    professional,
    service,
    duration,
    chatRoomId,
    callToken,
    videoToken,
  } = route.params as {
    sessionTime: string,
    mode: 'chat' | 'audio' | 'video',
    meetingLink?: string,
    professional: { name: string; avatar?: string },
    service: string;
    duration?: number;
    chatRoomId?: string;
    callToken?: string;   // for call providers
    videoToken?: string;
  };

  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Determine when join button should be active (e.g., 10 minutes before/after sessionTime)
  useEffect(() => {
    const checkActive = () => {
      const now = Date.now();
      const start = new Date(sessionTime).getTime();
      // Active from 10 minutes before to 10 minutes after session start
      setSessionActive(Math.abs(now - start) < 10 * 60 * 1000 || (now > start && now - start < (duration || 60) * 60 * 1000));
    };
    checkActive();
    const interval = setInterval(checkActive, 15000); // check every 15sec
    return () => clearInterval(interval);
  }, [sessionTime, duration]);

  // Handler to join meeting room -- this is where you plug your video/audio/chat SDK
  const handleJoin = useCallback(async () => {
    if (!sessionActive) {
      Alert.alert('Too Early or Too Late', 'You can join your session 10 min before or during the scheduled time.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'chat' && chatRoomId) {
        // navigation.navigate('ChatRoom', { roomId: chatRoomId, bookingId });
        Alert.alert('Join Chat', 'Launch chat interface here!');
      } else if ((mode === 'audio' || mode === 'video') && meetingLink) {
        await Linking.openURL(meetingLink);
        // Or navigate to your embedded call screen:
        // navigation.navigate(mode === 'audio' ? 'AudioCallScreen' : 'VideoCallScreen', { meetingLink, callToken/videoToken, ... });
      } else {
        Alert.alert('Unavailable', `No meeting link or chat room is configured for this session.`);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not start session. Try again or contact support.');
    } finally {
      setLoading(false);
    }
  }, [sessionActive, mode, meetingLink, chatRoomId]);

  // UI icons & label
  const icon = mode === 'video' ? 'video' : mode === 'audio' ? 'phone' : 'chat';
  const displayMode = mode === 'video' ? 'Video Call' : mode === 'audio' ? 'Audio Call' : 'Chat';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.card}>
        {/* Animation */}
        <View style={styles.animation}>
          <LottieView
            source={
              mode === 'chat'
                ? require('../assets/animations/chat.json')
                : require('../assets/animations/call.json')
            }
            autoPlay
            loop
            style={{ width: 100, height: 100 }}
          />
        </View>
        {/* Session Details */}
        <Text style={styles.header}>Upcoming {displayMode}</Text>
        <Text style={styles.subheader}>
          With <Text style={styles.professionalName}>{professional?.name}</Text>
        </Text>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={18} color={colors.primaryGreen} />
          <Text style={styles.infoText}>
            {new Date(sessionTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' })}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primaryGreen} />
          <Text style={styles.infoText}>
            {new Date(sessionTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            {duration ? ` · ${duration}min` : ''}
          </Text>
        </View>
        <Text style={styles.infoText} numberOfLines={2}>
          Service: {service}
        </Text>

        {/* Join Button */}
        <TouchableOpacity
          style={[styles.joinButton, !sessionActive && styles.buttonDisabled]}
          disabled={!sessionActive || loading}
          onPress={handleJoin}
        >
          {loading ? (
            <ActivityIndicator color={colors.offWhite} />
          ) : (
            <>
              <MaterialCommunityIcons name={icon as any} size={22} color={colors.offWhite} />
              <Text style={styles.joinButtonText}>Join {displayMode}</Text>
            </>
          )}
        </TouchableOpacity>

        {!sessionActive && (
          <Text style={styles.infoHint}>
            You can join 10 minutes before the scheduled start time.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    margin: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  animation: { marginBottom: 26 },
  header: { fontSize: 24, color: colors.primaryGreen, marginTop: 2, marginBottom: 3, fontWeight: '700' as const },
  subheader: { fontSize: 17, color: colors.primaryText, marginTop: 2, marginBottom: 14, fontWeight: '600' as const },
  professionalName: { color: colors.primaryGreen, fontWeight: 'bold', fontSize: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 2 },
  infoText: { color: colors.primaryText, fontSize: 15, fontWeight: '500', marginLeft: 7, marginBottom: 2 },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 15,
    marginTop: 36,
    gap: 10,
  },
  joinButtonText: { color: colors.offWhite, fontWeight: '800', fontSize: 16 },
  buttonDisabled: { backgroundColor: colors.border },
  infoHint: { color: colors.secondaryText, fontSize: 13, marginTop: 14, textAlign: 'center' },
});

export default JoinSessionScreen; 