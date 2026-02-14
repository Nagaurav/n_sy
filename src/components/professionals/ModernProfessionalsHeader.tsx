import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Animated,
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
  onSearchChange?: (text: string) => void;
  searchValue?: string;
  onSearchSubmit?: (text: string) => void;
}

const ModernProfessionalsHeader: React.FC<ModernProfessionalsHeaderProps> = ({
  title = 'PROFESSIONALS',
  onBackPress,
  onFavoritePress,
  showFavorite = true,
  showSearch = false,
  onSearchPress,
  onSearchChange,
  searchValue = '',
  onSearchSubmit,
}) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const searchInputRef = useRef<TextInput>(null);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const handleSearchToggle = () => {
    if (!isSearchVisible) {
      setIsSearchVisible(true);
      Animated.timing(animatedWidth, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setIsSearchVisible(false);
      setLocalSearchValue('');
      onSearchChange?.('');
      Animated.timing(animatedWidth, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSearchChange = (text: string) => {
    console.log('[Header] Search text changed:', text);
    setLocalSearchValue(text);
    onSearchChange?.(text);
  };

  const handleSearchSubmit = () => {
    console.log('[Header] Search submitted:', localSearchValue);
    if (localSearchValue.trim()) {
      onSearchSubmit?.(localSearchValue);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      <LinearGradient
        colors={['#008272', '#4C7360', '#2F5233']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Title or Search */}
          {showSearch && isSearchVisible ? (
            <Animated.View style={[styles.searchContainer, { opacity: animatedWidth }]}>
              <Ionicons 
                name="search" 
                size={20} 
                color="#FFFFFF" 
                style={styles.searchIcon} 
              />
              <TextInput
                ref={searchInputRef}
                style={[
                  styles.searchInput,
                  {
                    color: '#FFFFFF',
                    fontFamily: 'System',
                    fontWeight: '400',
                  }
                ]}
                value={localSearchValue}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
                placeholder="Search professionals..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                selectionColor="#FFFFFF"
                cursorColor="#FFFFFF"
                importantForAutofill="no"
                textContentType="none"
                autoComplete="off"
                secureTextEntry={false}
              />
              {localSearchValue.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={() => handleSearchChange('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.7)" />
                </TouchableOpacity>
              )}
            </Animated.View>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}

          {/* Search Toggle Button */}
          {showSearch && (
            <TouchableOpacity style={styles.searchButton} onPress={handleSearchToggle}>
              <Ionicons 
                name={isSearchVisible ? "close" : "search-outline"} 
                size={24} 
                color="#FFFFFF" 
              />
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
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 44,
  },
  // Search Styles
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    marginHorizontal: theme.spacing.s,
    height: 36,
  },
  searchIcon: {
    marginRight: theme.spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingVertical: 0,
    paddingHorizontal: 4,
    fontFamily: 'System',
    fontWeight: '400',
    borderRadius: 4,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
});

export default ModernProfessionalsHeader;
