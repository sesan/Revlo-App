import { PublicOnlyRoute } from '@/shared/components/RouteGuards';
import Signup from '@/features/auth/pages/Signup';

export default function Page() {
  return (
    <PublicOnlyRoute>
      <Signup />
    </PublicOnlyRoute>
  );
}
