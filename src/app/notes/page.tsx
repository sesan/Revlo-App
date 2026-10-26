import { OnboardingRequiredRoute } from '@/shared/components/RouteGuards';
import Notes from '@/features/notes/pages/Notes';

export default function Page() {
  return (
    <OnboardingRequiredRoute>
      <Notes />
    </OnboardingRequiredRoute>
  );
}
