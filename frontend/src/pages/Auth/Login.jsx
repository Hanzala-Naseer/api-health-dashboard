import AuthShell from './AuthShell';
import LoginForm from '../../components/forms/LoginForm';

export default function Login() {
  return (
    <AuthShell title="API Health Dashboard" subtitle="Infrastructure monitoring for high-precision teams.">
      <LoginForm />
    </AuthShell>
  );
}
