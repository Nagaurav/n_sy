// src/components/yoga/PaymentMethodSelector.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
  paymentMethods?: PaymentMethod[];
}

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'upi',
    name: 'UPI',
    icon: 'cellphone',
    description: 'Pay using UPI apps like Google Pay, PhonePe, Paytm',
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: 'credit-card',
    description: 'Pay using Visa, MasterCard, RuPay cards',
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: 'bank',
    description: 'Pay using your bank account',
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    icon: 'wallet',
    description: 'Pay using Paytm, PhonePe, Amazon Pay',
  },
];

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  paymentMethods = DEFAULT_PAYMENT_METHODS,
}) => {
  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethodCard,
        selectedMethod === method.id && styles.paymentMethodCardActive
      ]}
      onPress={() => onSelectMethod(method.id)}
    >
      <View style={styles.paymentMethodHeader}>
        <MaterialCommunityIcons 
          name={method.icon as any} 
          size={24} 
          color={selectedMethod === method.id ? colors.offWhite : colors.primaryGreen} 
        />
        <View style={styles.paymentMethodInfo}>
          <Text style={[
            styles.paymentMethodName,
            selectedMethod === method.id && styles.paymentMethodNameActive
          ]}>
            {method.name}
          </Text>
          <Text style={[
            styles.paymentMethodDescription,
            selectedMethod === method.id && styles.paymentMethodDescriptionActive
          ]}>
            {method.description}
          </Text>
        </View>
        {selectedMethod === method.id && (
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.offWhite} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.paymentMethodsContainer}>
        {paymentMethods.map(renderPaymentMethod)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primaryText,
    marginBottom: 16,
  },
  paymentMethodsContainer: {
    gap: 12,
  },
  paymentMethodCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  paymentMethodCardActive: {
    borderColor: colors.primaryGreen,
    backgroundColor: colors.primaryGreen,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primaryText,
    marginBottom: 4,
  },
  paymentMethodNameActive: {
    color: colors.offWhite,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  paymentMethodDescriptionActive: {
    color: colors.offWhite,
  },
});

export default PaymentMethodSelector;
