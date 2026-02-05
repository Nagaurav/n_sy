import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');

interface ProfessionalQuickActionProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  primary?: boolean;
}

const ProfessionalQuickAction: React.FC<ProfessionalQuickActionProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  primary = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        primary ? styles.primaryContainer : styles.secondaryContainer
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          primary ? styles.primaryIconContainer : styles.secondaryIconContainer
        ]}>
          <Ionicons 
            name={icon as any} 
            size={24} 
            color={primary ? '#FFFFFF' : '#FFFFFF'} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            primary ? styles.primaryTitle : styles.secondaryTitle
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.subtitle,
            primary ? styles.primarySubtitle : styles.secondarySubtitle
          ]}>
            {subtitle}
          </Text>
        </View>
        
        <View style={[
          styles.arrowContainer,
          primary ? styles.primaryArrowContainer : styles.secondaryArrowContainer
        ]}>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={primary ? theme.colors.text.secondary : theme.colors.text.secondary} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface ProfessionalQuickActionsProps {
  onBookConsultation: () => void;
  onJoinClass: () => void;
}

const ProfessionalQuickActions: React.FC<ProfessionalQuickActionsProps> = ({
  onBookConsultation,
  onJoinClass,
}) => {
  return (
    <View style={styles.actionsContainer}>
      <Text style={styles.sectionTitle}>Get Started</Text>
      
      <ProfessionalQuickAction
        title="Book Consultation"
        subtitle="Personal 1:1 session with wellness experts"
        icon="medical"
        onPress={onBookConsultation}
        primary={true}
      />
      
      <ProfessionalQuickAction
        title="Join a Class"
        subtitle="Group yoga and wellness sessions"
        icon="people"
        onPress={onJoinClass}
        primary={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
  },
  container: {
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.card,
  },
  primaryContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#008272',
  },
  secondaryContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#008272',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.l,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  primaryIconContainer: {
    backgroundColor: '#008272',
  },
  secondaryIconContainer: {
    backgroundColor: '#008272',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  primaryTitle: {
    color: theme.colors.text.primary,
  },
  secondaryTitle: {
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  primarySubtitle: {
    color: theme.colors.text.secondary,
  },
  secondarySubtitle: {
    color: theme.colors.text.secondary,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryArrowContainer: {
    backgroundColor: '#F5F2ED',
  },
  secondaryArrowContainer: {
    backgroundColor: '#F5F2ED',
  },
});

export { ProfessionalQuickActions, ProfessionalQuickAction };
