export interface OnboardingFormData {
  // Step 1: Profile
  username: string;
  bio: string;
  avatar_url: string | null;
  avatar_file: File | null;
  birth_date: string | null; // YYYY-MM-DD format
  gender: 'male' | 'female' | 'other' | null;
  country: string | null;

  // Step 2: Interests
  interests: string[]; // ['korean', 'italian', 'dessert']

  // Step 3: Dietary preferences
  dietary_preferences: string[]; // ['vegan', 'gluten-free']
  allergies: string; // "땅콩, 새우, 우유" (comma-separated)
}

export interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialData?: Partial<OnboardingFormData>;
}

export interface OnboardingStepProps {
  formData: OnboardingFormData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingFormData>>;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}
