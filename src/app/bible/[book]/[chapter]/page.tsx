import { OnboardingRequiredRoute } from '@/shared/components/RouteGuards';
import Bible from '@/features/bible/pages/Bible';

export default function Page() {
  return (
    <OnboardingRequiredRoute>
      <Bible />
    </OnboardingRequiredRoute>
  );
}
