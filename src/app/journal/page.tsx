import { OnboardingRequiredRoute } from '@/shared/components/RouteGuards';
import Journal from '@/features/journal/pages/Journal';

export default function Page() {
  return (
    <OnboardingRequiredRoute>
      <Journal />
    </OnboardingRequiredRoute>
  );
}
