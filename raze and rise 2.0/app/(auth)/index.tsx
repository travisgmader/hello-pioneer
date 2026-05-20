/**
 * Auth index route — renders AuthScreen component.
 * AuthScreen handles both Sign In and Sign Up modes via Toggle.
 * Implemented in 01-auth-PLAN.md Task 2.
 */
import AuthScreen from '@/components/AuthScreen';

export default function AuthIndex() {
  return <AuthScreen />;
}
