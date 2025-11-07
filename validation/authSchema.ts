import * as yup from 'yup';

export const signupSchema = yup.object().shape({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  dob: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  city: yup.string().required('City is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  latitude: yup
    .number()
    .typeError('Latitude must be a number')
    .required('Latitude is required'),
  longitude: yup
    .number()
    .typeError('Longitude must be a number')
    .required('Longitude is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export const phoneSchema = yup.object().shape({
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .required('Phone number is required'),
});

export const otpSchema = yup.object().shape({
  code: yup
    .string()
    .matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
    .required('OTP is required'),
}); 