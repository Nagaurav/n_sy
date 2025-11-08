import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import { colors } from '../theme/colors';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { useRoute } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';

interface RouteParams {
  sessionTime: string;
  mode: 'chat' | 'audio' | 'video';
  meetingLink?: string;
  professional: { name: string; avatar?: string };
  service: string;
  duration?: number;
  chatRoomId?: string;
  callToken?: string;
  videoToken?: string;
}

/** Helper to determine session status */
const getSessionStatus = (sessionTime: string, duration = 60): 'upcoming' | 'active' | 'expired' => {
  const now = Date.now();
  const start = new Date(sessionTime).getTime();
  const end = start + duration * 60 * 1000;

  if (now < start - 10 * 60 * 1000) return 'upcoming';
  if (now > end + 10 * 60 * 1000) return 'expired';
  return 'active';
};

const JoinSessionScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const route = useRoute();
  const {
    sessionTime,
    mode,
    meetingLink,
    professional,
    service,
    duration = 60,
    chatRoomId,
    callToken,
    videoToken,
  } = route.params as RouteParams;

  const [status, setStatus] = useState<'upcoming' | 'active' | 'expired'>(() =>
    getSessionStatus(sessionTime, duration)
  );
  const [loading, setLoading] = useState(false);

  /** Periodically check session state */
  useEffect(() => {
    const updateStatus = () => setStatus(getSessionStatus(sessionTime, duration));
    const interval = setInterval(updateStatus, 15000);
    return () => clearInterval(interval);
  }, [sessionTime, duration]);

  /** Mode labels and icons */
  const icon = mode === 'video' ? 'video' : mode === 'audio' ? 'phone' : 'chat';
  const displayMode = mode === 'video' ? 'Video Call' : mode === 'audio' ? 'Audio Call' : 'Chat';

  /** Dynamic Lottie animation */
  const animationSource = useMemo(() => {
    switch (mode) {
      case 'chat':
        return require('../assets/animations/chat.json');
      default:
        return require('../assets/animations/call.json');
    }
  }, [mode]);

  /** Join handler (placeholder for SDK integration) */
  const handleJoinSession = useCallback(async () => {
    if (status !== 'active') {
      const msg =
        status === 'upcoming'
          ? 'You can join your session 10 minutes before it starts.'
          : 'This session has already ended.';
      Alert.alert('Not Available', msg);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'chat' && chatRoomId) {
        // ✅ Chat session integration point
        // navigation.navigate(ROUTES.CHAT_ROOM, { roomId: chatRoomId });
        Alert.alert('Join Chat', 'Chat SDK launch point.');
      } else if ((mode === 'audio' || mode === 'video') && meetingLink) {
        await Linking.openURL(meetingLink);
      } else {
        Alert.alert('Unavailable', 'No session link found.');
      }
    } catch (err) {
      console.error('Join session failed:', err);
      Alert.alert('Error', 'Could not start session. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, mode, chatRoomId, meetingLink]);

  /** Header Info Text */
  const statusMessage =
    status === 'upcoming'
      ? 'You can join 10 minutes before the scheduled start.'
      : status === 'expired'
      ? 'This session has ended.'
      : 'Tap below to join your session.';

  /** UI */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.card}>
        {/* Lottie Animation */}
        <LottieView
          source={animationSource}
          autoPlay
          loop
          style={{ width: 100, height: 100, marginBottom: 20 }}
        />

        {/* Session Info */}
        <Text style={styles.header}>Upcoming {displayMode}</Text>
        <Text style={styles.subheader}>
          With <Text style={styles.professionalName}>{professional?.name}</Text>
        </Text>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={18} color={colors.primaryGreen} />
          <Text style={styles.infoText}>
            {new Date(sessionTime).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              weekday: 'short',
            })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primaryGreen} />
          <Text style={styles.infoText}>
            {new Date(sessionTime).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {duration ? ` · ${duration} min` : ''}
          </Text>
        </View>

        <Text style={styles.infoText}>Service: {service}</Text>

        {/* Join Button */}
        <TouchableOpacity
          style={[
            styles.joinButton,
            (status !== 'active' || loading) && styles.buttonDisabled,
          ]}
          disabled={status !== 'active' || loading}
          onPress={handleJoinSession}
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

        {/* Session Status */}
        <Text style={styles.infoHint}>{statusMessage}</Text>
      </View>
    </SafeAreaView>
  );
};

/** 💅 Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  header: {
    fontSize: 24,
    color: colors.primaryGreen,
    marginBottom: 6,
    fontWeight: '700',
  },
  subheader: {
    fontSize: 17,
    color: colors.primaryText,
    marginBottom: 14,
    fontWeight: '600',
  },
  professionalName: { color: colors.primaryGreen, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  infoText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 7,
  },
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
