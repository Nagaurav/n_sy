import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { theme as defaultTheme } from '../theme';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { user, signOut } = useAuth();
  let theme;
  try {
    const themeContext = useTheme();
    theme = themeContext?.theme || defaultTheme;
    
    // Safety check
    if (!theme || !theme.colors) {
      console.error('❌ [CustomDrawerContent] Theme is invalid:', theme);
      console.log('🔧 [CustomDrawerContent] Using default theme');
      theme = defaultTheme;
    }
    
    console.log('🎨 [CustomDrawerContent] Theme loaded:', {
      hasTheme: !!theme,
      hasColors: !!theme?.colors,
      hasPrimary: !!theme?.colors?.primary,
    });
  } catch (error) {
    console.error('❌ [CustomDrawerContent] Error getting theme:', error);
    console.log('🔧 [CustomDrawerContent] Falling back to default theme');
    theme = defaultTheme;
  }

  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return first + last || 'U';
  };

  const getDrawerItemStyle = (isActive: boolean) => {
    return {
      backgroundColor: isActive ? theme.colors.background.primary : 'transparent',
      borderLeftWidth: isActive ? 4 : 0,
      borderLeftColor: isActive ? theme.colors.primary : 'transparent',
    };
  };

  const getDrawerItemTextStyle = (isActive: boolean) => {
    return {
      color: isActive ? theme.colors.primary : theme.colors.text.primary,
      fontWeight: isActive ? '600' : '500',
    };
  };

  const getDrawerIconColor = (isActive: boolean) => {
    return isActive ? theme.colors.primary : theme.colors.text.secondary;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const navigateToProfile = () => {
    // Navigate to profile screen
    props.navigation.navigate('Profile');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Premium Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={navigateToProfile} style={styles.profileSection} activeOpacity={0.7}>
          <View style={styles.largeAvatarContainer}>
            {user?.profileImage || user?.profile_picture_url ? (
              <Image source={{ uri: user.profileImage || user?.profile_picture_url }} style={styles.largeAvatar} />
            ) : (
              <View style={[styles.defaultLargeAvatar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Text style={[styles.largeInitialsText, { color: '#FFFFFF' }]}>
                  {getUserInitials(user?.first_name || user?.firstName, user?.last_name || user?.lastName)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.first_name || user?.firstName} {user?.last_name || user?.lastName}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Drawer Menu Items */}
      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        <View style={styles.menuItems}>
          <TouchableOpacity
            style={[styles.menuItem, getDrawerItemStyle(props.state.index === 0)]}
            onPress={() => props.navigation.navigate('HomeStack')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="home-outline" 
              size={24} 
              color={getDrawerIconColor(props.state.index === 0)} 
            />
            <Text style={[styles.menuItemText, getDrawerItemTextStyle(props.state.index === 0) as any]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, getDrawerItemStyle(props.state.index === 1)]}
            onPress={() => props.navigation.navigate('Appointments')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="calendar-outline" 
              size={24} 
              color={getDrawerIconColor(props.state.index === 1)} 
            />
            <Text style={[styles.menuItemText, getDrawerItemTextStyle(props.state.index === 1) as any]}>
              Appointments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, getDrawerItemStyle(props.state.index === 2)]}
            onPress={() => props.navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="person-outline" 
              size={24} 
              color={getDrawerIconColor(props.state.index === 2)} 
            />
            <Text style={[styles.menuItemText, getDrawerItemTextStyle(props.state.index === 2) as any]}>
              My Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, getDrawerItemStyle(props.state.index === 3)]}
            onPress={() => props.navigation.navigate('Articles')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="newspaper-outline" 
              size={24} 
              color={getDrawerIconColor(props.state.index === 3)} 
            />
            <Text style={[styles.menuItemText, getDrawerItemTextStyle(props.state.index === 3) as any]}>
              Wellness Articles
            </Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.text.secondary }]} />

          <TouchableOpacity
            style={[styles.menuItem, getDrawerItemStyle(props.state.index === 4)]}
            onPress={() => props.navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={getDrawerIconColor(props.state.index === 4)} 
            />
            <Text style={[styles.menuItemText, getDrawerItemTextStyle(props.state.index === 4) as any]}>
              Settings
            </Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.text.secondary }]} />

          <TouchableOpacity
            style={[styles.menuItem, getDrawerItemStyle(props.state.index === 5)]}
            onPress={() => props.navigation.navigate('Support')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="help-circle-outline" 
              size={24} 
              color={getDrawerIconColor(props.state.index === 5)} 
            />
            <Text style={[styles.menuItemText, getDrawerItemTextStyle(props.state.index === 5) as any]}>
              Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, getDrawerItemStyle(props.state.index === 6)]}
            onPress={() => props.navigation.navigate('FAQ')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="help-buoy-outline" 
              size={24} 
              color={getDrawerIconColor(props.state.index === 6)} 
            />
            <Text style={[styles.menuItemText, getDrawerItemTextStyle(props.state.index === 6) as any]}>
              FAQ
            </Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Logout Button */}
      <View style={[styles.footer, { borderTopColor: theme.colors.text.secondary }]}> 
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.accent} />
          <Text style={[styles.logoutText, { color: theme.colors.accent }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Premium Profile Header Styles
  profileHeader: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeAvatarContainer: {
    marginRight: 16,
  },
  largeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  defaultLargeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeInitialsText: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Legacy styles for backward compatibility
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontWeight: '400',
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  menuItems: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
    marginHorizontal: 5,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 10,
  },
});

export default CustomDrawerContent;
