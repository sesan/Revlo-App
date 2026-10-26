import { OnboardingRequiredRoute } from '@/shared/components/RouteGuards';
import NoteDetail from '@/features/notes/pages/NoteDetail';

export default function Page() {
  return (
    <OnboardingRequiredRoute>
      <NoteDetail />
    </OnboardingRequiredRoute>
  );
}
