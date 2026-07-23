import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../api/client';
import { Field, TextInput } from '../common/FormField';
import Button from '../common/Button';

// Mirrors backend passwordSchema in validations/auth.validation.js exactly:
// min 8, max 128, at least one lowercase/uppercase/digit/special character.
const PASSWORD_RULES = {
  required: 'Password is required',
  minLength: { value: 8, message: 'Password must be at least 8 characters' },
  maxLength: { value: 128, message: 'Password must be at most 128 characters' },
  validate: {
    lowercase: (v) => /[a-z]/.test(v) || 'Include at least one lowercase letter',
    uppercase: (v) => /[A-Z]/.test(v) || 'Include at least one uppercase letter',
    digit: (v) => /[0-9]/.test(v) || 'Include at least one number',
    special: (v) => /[^a-zA-Z0-9]/.test(v) || 'Include at least one special character',
  },
};

export default function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');

  async function onSubmit(values) {
    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      toast.success('Account created! Check your email for a verification code.');
      navigate('/verify-email', { state: { email: values.email } });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create your account.'));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" htmlFor="firstName" error={errors.firstName?.message} required>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <TextInput
              id="firstName"
              placeholder="John"
              className="pl-10"
              error={errors.firstName}
              {...register('firstName', { required: 'First name is required', maxLength: 50 })}
            />
          </div>
        </Field>
        <Field label="Last Name" htmlFor="lastName" error={errors.lastName?.message} required>
          <TextInput
            id="lastName"
            placeholder="Doe"
            error={errors.lastName}
            {...register('lastName', { required: 'Last name is required', maxLength: 50 })}
          />
        </Field>
      </div>

      <Field label="Work Email" htmlFor="email" error={errors.email?.message} required>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            className="pl-10"
            error={errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
            })}
          />
        </div>
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
        hint="At least 8 characters with uppercase, lowercase, a number and a symbol."
        required
      >
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <TextInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pl-10 pr-11"
            error={errors.password}
            {...register('password', PASSWORD_RULES)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Field label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
        <TextInput
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (v) => v === password || 'Passwords do not match',
          })}
        />
      </Field>

      <Button type="submit" isLoading={isSubmitting} icon={ArrowRight} iconPosition="right" className="w-full">
        Create Account
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
