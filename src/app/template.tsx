import PageTransition from '@/shared/components/PageTransition';

// A template re-mounts on every navigation, giving each page its enter transition.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
