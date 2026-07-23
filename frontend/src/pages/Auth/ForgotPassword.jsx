import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Send } from 'lucide-react';
import AuthShell from './AuthShell';
import { forgotPassword } from '../../api/authApi';
import { getErrorMessage } from '../../api/client';
import { Field, TextInput } from '../../components/common/FormField';
import Button from '../../components/common/Button';

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm({ defaultValues: { email: '' } });

  async function onSubmit(values) {
    try {
      const result = await forgotPassword(values);
      toast.success(result.message || 'If that email exists, a reset link has been sent.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send the reset link.'));
    }
  }

  return (
    <AuthShell title="Forgot Password" subtitle="We'll email you a link to reset it.">
      {isSubmitSuccessful ? (
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            If an account with that email exists, a password reset link is on its way. Check your inbox.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="Email Address" htmlFor="email" error={errors.email?.message} required>
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
          <Button type="submit" isLoading={isSubmitting} icon={Send} className="w-full">
            Send Reset Link
          </Button>
          <p className="text-center text-sm text-text-secondary">
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Back to Login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
