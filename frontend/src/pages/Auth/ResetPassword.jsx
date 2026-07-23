import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import AuthShell from './AuthShell';
import { resetPassword } from '../../api/authApi';
import { getErrorMessage } from '../../api/client';
import { Field, TextInput } from '../../components/common/FormField';
import Button from '../../components/common/Button';

const PASSWORD_RULES = {
  required: 'Password is required',
  minLength: { value: 8, message: 'Password must be at least 8 characters' },
  validate: {
    lowercase: (v) => /[a-z]/.test(v) || 'Include at least one lowercase letter',
    uppercase: (v) => /[A-Z]/.test(v) || 'Include at least one uppercase letter',
    digit: (v) => /[0-9]/.test(v) || 'Include at least one number',
    special: (v) => /[^a-zA-Z0-9]/.test(v) || 'Include at least one special character',
  },
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const tokenFromUrl = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { token: tokenFromUrl, newPassword: '', confirmPassword: '' } });

  const newPassword = watch('newPassword');

  async function onSubmit(values) {
    try {
      const result = await resetPassword({ token: values.token, newPassword: values.newPassword });
      toast.success(result.message || 'Password reset successfully.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'That reset link is invalid or has expired.'));
    }
  }

  return (
    <AuthShell title="Reset Password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Reset Token" htmlFor="token" error={errors.token?.message} hint="Paste the token from the email link if it wasn't filled in automatically." required>
          <TextInput id="token" error={errors.token} {...register('token', { required: 'Reset token is required' })} />
        </Field>

        <Field label="New Password" htmlFor="newPassword" error={errors.newPassword?.message} required>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <TextInput
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              className="pl-10 pr-11"
              error={errors.newPassword}
              {...register('newPassword', PASSWORD_RULES)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field label="Confirm New Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
          <TextInput
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            error={errors.confirmPassword}
            {...register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (v) => v === newPassword || 'Passwords do not match',
            })}
          />
        </Field>

        <Button type="submit" isLoading={isSubmitting} icon={KeyRound} className="w-full">
          Reset Password
        </Button>

        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
