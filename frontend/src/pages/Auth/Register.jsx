import AuthShell from './AuthShell';
import RegisterForm from '../../components/forms/RegisterForm';

export default function Register() {
  return (
    <AuthShell title="Create Account" subtitle="Scale your infrastructure with reliable API monitoring.">
      <RegisterForm />
    </AuthShell>
  );
}
