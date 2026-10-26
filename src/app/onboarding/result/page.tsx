import { ProtectedRoute } from '@/shared/components/RouteGuards';
import OnboardingResult from '@/features/onboarding/pages/OnboardingResult';

export default function Page() {
  return (
    <ProtectedRoute>
      <OnboardingResult />
    </ProtectedRoute>
  );
}
