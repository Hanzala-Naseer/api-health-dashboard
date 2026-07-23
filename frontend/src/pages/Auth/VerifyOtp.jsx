import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import AuthShell from './AuthShell';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../api/client';
import { Field, TextInput } from '../../components/common/FormField';
import Button from '../../components/common/Button';

/**
 * The backend's register() intentionally does NOT log the user in — it
 * creates the account as PENDING_EMAIL_VERIFICATION and emails an OTP.
 * Login is rejected with EMAIL_NOT_VERIFIED until this step completes.
 * This page isn't in the originally-specified route list, but it's
 * required for the real auth flow to actually work end to end.
 */
export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isResending, setIsResending] = useState(false);
  const emailFromState = location.state?.email || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: emailFromState, otp: '' } });

  async function onSubmit(values) {
    try {
      await verifyOtp({ email: values.email, otp: values.otp, purpose: 'REGISTRATION' });
      toast.success('Email verified! You can now log in.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invalid or expired verification code.'));
    }
  }

  async function handleResend(email) {
    if (!email) {
      toast.error('Enter your email first.');
      return;
    }
    setIsResending(true);
    try {
      await resendOtp({ email, purpose: 'REGISTRATION' });
      toast.success('A new verification code has been sent.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not resend the code.'));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthShell title="Verify Your Email" subtitle="Enter the code we emailed you to activate your account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Email Address" htmlFor="email" error={errors.email?.message} required>
          <TextInput
            id="email"
            type="email"
            error={errors.email}
            {...register('email', { required: 'Email is required' })}
          />
        </Field>

        <Field label="Verification Code" htmlFor="otp" error={errors.otp?.message} required>
          <TextInput
            id="otp"
            inputMode="numeric"
            placeholder="123456"
            maxLength={10}
            error={errors.otp}
            {...register('otp', {
              required: 'Enter the code from your email',
              pattern: { value: /^\d{4,10}$/, message: 'Code must be numeric' },
            })}
          />
        </Field>

        <Button type="submit" isLoading={isSubmitting} icon={ShieldCheck} className="w-full">
          Verify Email
        </Button>

        <button
          type="button"
          onClick={handleSubmit((v) => handleResend(v.email))}
          disabled={isResending}
          className="w-full text-center text-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          {isResending ? 'Sending...' : "Didn't get a code? Resend"}
        </button>

        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
