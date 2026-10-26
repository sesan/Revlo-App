import { PublicOnlyRoute } from '@/shared/components/RouteGuards';
import Login from '@/features/auth/pages/Login';

export default function Page() {
  return (
    <PublicOnlyRoute>
      <Login />
    </PublicOnlyRoute>
  );
}
