# Yoga Feature

This feature contains all yoga-related functionality including the complete booking flow.

## Structure

```
src/features/yoga/
├── README.md                 # This file
├── index.ts                  # Feature exports
├── types/
│   └── index.ts             # Shared TypeScript interfaces
├── screens/
│   ├── ProfessionalSearchScreen.tsx
│   ├── ProfessionalProfileScreen.tsx
│   ├── DateSelectionScreen.tsx
│   ├── TimeSelectionScreen.tsx
│   ├── BookingConfirmationScreen.tsx
│   └── BookingSuccessScreen.tsx
└── components/              # Yoga-specific components (future)
```

## Screens

### 1. ProfessionalSearchScreen
- **Purpose**: Search and discover yoga professionals
- **Features**: Search functionality, professional listing, filters

### 2. ProfessionalProfileScreen
- **Purpose**: View professional details and select services
- **Features**: Professional profile, service selection, contact options

### 3. DateSelectionScreen
- **Purpose**: Choose booking date
- **Features**: Date picker, service summary

### 4. TimeSelectionScreen
- **Purpose**: Choose booking time
- **Features**: Time slot selection, availability indicators

### 5. BookingConfirmationScreen
- **Purpose**: Final confirmation and payment
- **Features**: Booking review, payment methods, price breakdown

### 6. BookingSuccessScreen
- **Purpose**: Success confirmation
- **Features**: Success animation, next steps, action buttons

## Types

All shared TypeScript interfaces are defined in `types/index.ts`:

- `Professional` - Professional user data
- `Service` - Service offerings
- `PaymentMethod` - Payment options
- `DateOption` - Available dates
- `TimeSlot` - Available time slots
- `YogaClass` - Legacy class data (for backward compatibility)

## Usage

### Importing Screens
```typescript
import { ProfessionalSearchScreen } from '../features/yoga';
```

### Importing Types
```typescript
import { Professional, Service } from '../features/yoga';
```

## Navigation Flow

```
HomeScreen
    ↓
ProfessionalSearchScreen (Tab)
    ↓
ProfessionalProfileScreen
    ↓
DateSelectionScreen
    ↓
TimeSelectionScreen
    ↓
BookingConfirmationScreen
    ↓
BookingSuccessScreen
```

## Benefits of This Structure

1. **Organization**: All yoga-related code is in one place
2. **Maintainability**: Easy to find and modify yoga features
3. **Reusability**: Shared types and components
4. **Scalability**: Easy to add new yoga-related features
5. **Clean Imports**: Single import point for the entire feature

## Future Enhancements

- Add yoga-specific components in `components/` folder
- Add yoga-related utilities in `utils/` folder
- Add yoga-specific hooks in `hooks/` folder
- Add yoga-related constants in `constants/` folder 