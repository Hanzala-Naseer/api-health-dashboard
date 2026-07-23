import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, KeyRound, Bell, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { Field, TextInput } from '../../components/common/FormField';
import { useAuth } from '../../hooks/useAuth';
import { changePassword, updateProfile, getNotificationPreferences, updateNotificationPreferences } from '../../api/profileApi';
import { getErrorMessage } from '../../api/client';

function ProfileSection() {
  const { user, updateStoredUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  async function onSubmit(values) {
    try {
      await updateProfile(values);
      updateStoredUser(values);
      toast.success('Profile saved locally (demo mode — backend has no profile-update route yet).');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save profile.'));
    }
  }

  return (
    <Card>
      <CardHeader
        title="User Information"
        action={
          <Button type="submit" form="profile-form" size="sm" icon={Save} isLoading={isSubmitting} disabled={!isDirty}>
            Save Profile
          </Button>
        }
      />
      <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First Name" htmlFor="firstName">
          <TextInput id="firstName" {...register('firstName')} />
        </Field>
        <Field label="Last Name" htmlFor="lastName">
          <TextInput id="lastName" {...register('lastName')} />
        </Field>
        <Field label="Email Address" htmlFor="email" hint="Changing email isn't supported by the backend yet.">
          <TextInput id="email" type="email" disabled {...register('email')} />
        </Field>
      </form>
    </Card>
  );
}

function SecuritySection() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const newPassword = watch('newPassword');

  async function onSubmit(values) {
    try {
      const result = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success(result.message || 'Password updated successfully.');
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update your password.'));
    }
  }

  return (
    <Card>
      <CardHeader title="Security" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Current Password" htmlFor="currentPassword" error={errors.currentPassword?.message} required>
          <TextInput
            id="currentPassword"
            type="password"
            error={errors.currentPassword}
            {...register('currentPassword', { required: 'Current password is required' })}
          />
        </Field>
        <Field label="New Password" htmlFor="newPassword" error={errors.newPassword?.message} required>
          <TextInput
            id="newPassword"
            type="password"
            error={errors.newPassword}
            {...register('newPassword', {
              required: 'New password is required',
              minLength: { value: 8, message: 'Must be at least 8 characters' },
            })}
          />
        </Field>
        <Field label="Confirm New Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
          <TextInput
            id="confirmPassword"
            type="password"
            error={errors.confirmPassword}
            {...register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (v) => v === newPassword || 'Passwords do not match',
            })}
          />
        </Field>
        <Button type="submit" icon={KeyRound} isLoading={isSubmitting} className="w-full">
          Update Credentials
        </Button>
      </form>
    </Card>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getNotificationPreferences().then(setPrefs);
  }, []);

  async function handleToggleEmailAlerts() {
    const updated = { ...prefs, emailAlerts: !prefs.emailAlerts };
    setPrefs(updated);
    setIsSaving(true);
    try {
      await updateNotificationPreferences(updated);
    } finally {
      setIsSaving(false);
    }
  }

  if (!prefs) return <Loader label="Loading preferences..." />;

  return (
    <Card>
      <CardHeader title="Notifications" action={<Bell className="h-5 w-5 text-text-secondary" />} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Email Alerts</p>
          <p className="text-xs text-text-secondary">Receive daily health summaries</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.emailAlerts}
          onClick={handleToggleEmailAlerts}
          disabled={isSaving}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            prefs.emailAlerts ? 'bg-primary' : 'bg-surface-container-highest'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              prefs.emailAlerts ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      <p className="mt-4 text-xs text-text-muted">
        Retention period, Slack integration and alert thresholds will move here once the backend exposes a
        NotificationSetting API.
      </p>
    </Card>
  );
}

function DangerZone() {
  return (
    <Card className="border-danger/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-danger">
            <AlertTriangle className="h-4 w-4" /> Danger Zone
          </h3>
          <p className="mt-1 text-sm text-text-secondary">Deleting your account is permanent and cannot be undone.</p>
        </div>
        <Button variant="danger" onClick={() => toast("Account deletion isn't wired up on the backend yet.", { icon: '⚠️' })}>
          Delete Account
        </Button>
      </div>
    </Card>
  );
}

export default function Settings() {
  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Account Settings"
        description="Manage your profile, security, and notification preferences."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileSection />
        <SecuritySection />
        <NotificationsSection />
        <DangerZone />
      </div>
    </div>
  );
}
