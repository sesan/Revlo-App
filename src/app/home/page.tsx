import { OnboardingRequiredRoute } from '@/shared/components/RouteGuards';
import Home from '@/features/home/pages/Home';

export default function Page() {
  return (
    <OnboardingRequiredRoute>
      <Home />
    </OnboardingRequiredRoute>
  );
}
