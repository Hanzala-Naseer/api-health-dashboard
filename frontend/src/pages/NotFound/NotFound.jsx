import { Link } from 'react-router-dom';
import { Activity, Home } from 'lucide-react';
import Button from '../../components/common/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15">
        <Activity className="h-7 w-7 text-primary" />
      </div>
      <h1 className="text-4xl font-bold text-text-primary">404</h1>
      <p className="max-w-sm text-text-secondary">
        This page doesn&apos;t exist, or the endpoint you&apos;re looking for has been moved.
      </p>
      <Link to="/">
        <Button icon={Home}>Back to Home</Button>
      </Link>
    </div>
  );
}
