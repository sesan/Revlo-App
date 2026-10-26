import { OnboardingRoute } from '@/shared/components/RouteGuards';
import Onboarding from '@/features/onboarding/pages/Onboarding';

export default function Page() {
  return (
    <OnboardingRoute>
      <Onboarding />
    </OnboardingRoute>
  );
}
