import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

interface ModernProfessionalsHeaderProps {
  title?: string;
  onBackPress: () => void;
  onFavoritePress?: () => void;
  showFavorite?: boolean;
  showSearch?: boolean;
  onSearchPress?: () => void;
}

const ModernProfessionalsHeader: React.FC<ModernProfessionalsHeaderProps> = ({
  title = 'PROFESSIONALS',
  onBackPress,
  onFavoritePress,
  showFavorite = true,
  showSearch = false,
  onSearchPress,
}) => (
    <>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Search Button */}
          {showSearch && (
            <TouchableOpacity style={styles.searchButton} onPress={onSearchPress}>
              <Ionicons name="search-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Favorite Button */}
          {showFavorite && (
            <TouchableOpacity style={styles.favoriteButton} onPress={onFavoritePress}>
              <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Spacer for alignment when both are hidden */}
          {!showSearch && !showFavorite && <View style={styles.spacer} />}
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>
    </>
  );

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingBottom: theme.spacing.l,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 44,
    height: 44,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: -20,
    left: 20,
  },
  topCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: -40,
    left: -40,
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
});

export default ModernProfessionalsHeader;
