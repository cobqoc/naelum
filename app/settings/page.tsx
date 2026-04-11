'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import ProfileTab from '@/components/Settings/ProfileTab';
import PreferencesTab from '@/components/Settings/PreferencesTab';
import AccountTab from '@/components/Settings/AccountTab';
import NotificationsTab from '@/components/Settings/NotificationsTab';

interface Profile {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gender: string | null;
  birth_date: string | null;
  country: string | null;
  created_at: string;
  show_saved_to_public: boolean;
  show_cooked_to_public: boolean;
}

interface Interest {
  interest_value: string;
}

interface DietaryPreference {
  preference_type: string;
}

interface Allergy {
  ingredient_name: string;
}

type TabType = 'profile' | 'preferences' | 'notifications' | 'account';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const toast = useToast();
  const sp = t.settingsPage;

  const cuisineOptions = [
    { value: t.cuisines.korean, icon: '🍚' },
    { value: t.cuisines.chinese, icon: '🥟' },
    { value: t.cuisines.japanese, icon: '🍱' },
    { value: t.cuisines.western, icon: '🍝' },
    { value: t.cuisines.italian, icon: '🍕' },
    { value: t.cuisines.french, icon: '🥐' },
    { value: t.cuisines.mexican, icon: '🌮' },
    { value: t.cuisines.indian, icon: '🍛' },
    { value: t.cuisines.thai, icon: '🍜' },
    { value: t.cuisines.vegan, icon: '🥗' },
    { value: t.cuisines.dessert, icon: '🍰' },
    { value: t.cuisines.baking, icon: '🥖' },
  ];

  const dietaryOptions = [
    sp.dietaryVegetarian, t.cuisines.vegan, sp.dietaryLactoVeg,
    sp.dietaryGlutenFree, sp.dietaryLowCarb, sp.dietaryLowCal,
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);

  // Profile form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  // Original values for dirty tracking
  const [originalUsername, setOriginalUsername] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [originalBirthDate, setOriginalBirthDate] = useState<string | null>(null);
  const [originalGender, setOriginalGender] = useState<string | null>(null);
  const [originalCountry, setOriginalCountry] = useState<string | null>(null);

  // Preferences
  const [interests, setInterests] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');
  const [originalInterests, setOriginalInterests] = useState<string[]>([]);
  const [originalDietary, setOriginalDietary] = useState<string[]>([]);
  const [originalAllergies, setOriginalAllergies] = useState('');

  // Privacy
  const [showSavedToPublic, setShowSavedToPublic] = useState(false);
  const [showCookedToPublic, setShowCookedToPublic] = useState(false);
  const [originalShowSaved, setOriginalShowSaved] = useState(false);
  const [originalShowCooked, setOriginalShowCooked] = useState(false);

  // Username validation
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Unsaved changes warning
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const pendingTabRef = useRef<TabType | null>(null);

  const isDirtyProfile =
    username !== originalUsername ||
    bio !== originalBio ||
    avatarFile !== null ||
    avatarUrl !== originalAvatarUrl ||
    birthDate !== originalBirthDate ||
    gender !== originalGender ||
    country !== originalCountry;

  const isDirtyPreferences =
    JSON.stringify([...interests].sort()) !== JSON.stringify([...originalInterests].sort()) ||
    JSON.stringify([...dietary].sort()) !== JSON.stringify([...originalDietary].sort()) ||
    allergies !== originalAllergies ||
    showSavedToPublic !== originalShowSaved ||
    showCookedToPublic !== originalShowCooked;

  const isCurrentTabDirty =
    (activeTab === 'profile' && isDirtyProfile) ||
    (activeTab === 'preferences' && isDirtyPreferences);

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setUsername(profileData.username || '');
      setBio(profileData.bio || '');
      setAvatarUrl(profileData.avatar_url);
      setBirthDate(profileData.birth_date || null);
      setGender(profileData.gender || null);
      setCountry(profileData.country || null);

      setOriginalUsername(profileData.username || '');
      setOriginalBio(profileData.bio || '');
      setOriginalAvatarUrl(profileData.avatar_url);
      setOriginalBirthDate(profileData.birth_date || null);
      setOriginalGender(profileData.gender || null);
      setOriginalCountry(profileData.country || null);

      setShowSavedToPublic(!!profileData.show_saved_to_public);
      setShowCookedToPublic(!!profileData.show_cooked_to_public);
      setOriginalShowSaved(!!profileData.show_saved_to_public);
      setOriginalShowCooked(!!profileData.show_cooked_to_public);
    }

    const { data: interestsData } = await supabase
      .from('user_interests')
      .select('interest_value')
      .eq('user_id', user.id);

    if (interestsData) {
      const vals = interestsData.map((i: Interest) => i.interest_value);
      setInterests(vals);
      setOriginalInterests(vals);
    }

    const { data: dietaryData } = await supabase
      .from('user_dietary_preferences')
      .select('preference_type')
      .eq('user_id', user.id);

    if (dietaryData) {
      const vals = dietaryData.map((d: DietaryPreference) => d.preference_type);
      setDietary(vals);
      setOriginalDietary(vals);
    }

    const { data: allergiesData } = await supabase
      .from('user_allergies')
      .select('ingredient_name')
      .eq('user_id', user.id);

    if (allergiesData) {
      const val = allergiesData.map((a: Allergy) => a.ingredient_name).join(', ');
      setAllergies(val);
      setOriginalAllergies(val);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Username availability check
  useEffect(() => {
    if (!username || username === profile?.username) {
      setUsernameError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameError(data.available ? null : data.error);
      } catch {
        setUsernameError(t.common.error);
      }
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, profile?.username, t.common.error]);

  const handleTabClick = (tab: TabType) => {
    if (tab === activeTab) return;
    if (isCurrentTabDirty) {
      pendingTabRef.current = tab;
      setShowUnsavedModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleConfirmLeave = () => {
    const target = pendingTabRef.current;
    if (!target) return;
    // Reset dirty state for the current tab
    if (activeTab === 'profile') {
      setUsername(originalUsername);
      setBio(originalBio);
      setAvatarUrl(originalAvatarUrl);
      setAvatarFile(null);
      setBirthDate(originalBirthDate);
      setGender(originalGender);
      setCountry(originalCountry);
    } else if (activeTab === 'preferences') {
      setInterests([...originalInterests]);
      setDietary([...originalDietary]);
      setAllergies(originalAllergies);
      setShowSavedToPublic(originalShowSaved);
      setShowCookedToPublic(originalShowCooked);
    }
    setShowUnsavedModal(false);
    pendingTabRef.current = null;
    setActiveTab(target);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(sp.avatarWrongType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(sp.avatarTooBig);
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    setAvatarUrl(null);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !profile) return avatarUrl;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
    if (error) {
      console.error('Avatar upload error:', error);
      return avatarUrl;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return publicUrl;
  };

  const saveProfile = async () => {
    if (!profile) return;

    if (!username || username.trim().length < 2) {
      toast.error(t.common.error);
      return;
    }
    if (usernameError || checkingUsername) {
      toast.error(t.common.error);
      return;
    }

    setSaving(true);
    const usernameChanged = username.trim() !== profile.username;

    try {
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          bio: bio || null,
          avatar_url: newAvatarUrl,
          birth_date: birthDate,
          gender,
          country,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Sync original values
      setOriginalUsername(username.trim());
      setOriginalBio(bio);
      setOriginalAvatarUrl(newAvatarUrl);
      setOriginalBirthDate(birthDate);
      setOriginalGender(gender);
      setOriginalCountry(country);
      setAvatarFile(null);

      if (usernameChanged) {
        toast.success(sp.profileSaved);
        window.location.href = `/@${username.trim()}`;
        return;
      }

      toast.success(sp.profileSaved);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t.common.error);
    }

    setSaving(false);
  };

  const savePreferences = async () => {
    if (!profile) return;

    setSaving(true);

    try {
      await supabase.from('user_interests').delete().eq('user_id', profile.id);
      if (interests.length > 0) {
        await supabase.from('user_interests').insert(
          interests.map(interest => ({
            user_id: profile.id,
            interest_type: 'cuisine',
            interest_value: interest,
          }))
        );
      }

      await supabase.from('user_dietary_preferences').delete().eq('user_id', profile.id);
      if (dietary.length > 0) {
        await supabase.from('user_dietary_preferences').insert(
          dietary.map(pref => ({
            user_id: profile.id,
            preference_type: pref,
            is_active: true,
          }))
        );
      }

      await supabase.from('user_allergies').delete().eq('user_id', profile.id);
      const allergiesList = allergies.split(',').map(a => a.trim()).filter(a => a);
      if (allergiesList.length > 0) {
        await supabase.from('user_allergies').insert(
          allergiesList.map(allergy => ({
            user_id: profile.id,
            ingredient_name: allergy,
            severity: 'moderate',
          }))
        );
      }

      // Save privacy settings to profiles table
      await supabase
        .from('profiles')
        .update({
          show_saved_to_public: showSavedToPublic,
          show_cooked_to_public: showCookedToPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      // Sync originals
      setOriginalInterests([...interests]);
      setOriginalDietary([...dietary]);
      setOriginalAllergies(allergies);
      setOriginalShowSaved(showSavedToPublic);
      setOriginalShowCooked(showCookedToPublic);

      toast.success(sp.preferencesSaved);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t.common.error);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'profile', label: sp.profileTab, icon: '👤' },
    { key: 'preferences', label: sp.preferencesTab, icon: '🍳' },
    { key: 'notifications', label: sp.notificationsTab, icon: '🔔' },
    { key: 'account', label: sp.accountTab, icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />

      <main className="pt-16 md:pt-20 pb-24 md:pb-12">
        <div className="container mx-auto max-w-2xl px-4 md:px-6 py-6">
          {/* Page Title */}
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/@${profile?.username}`} className="text-text-muted hover:text-text-primary">
              ←
            </Link>
            <h1 className="text-xl md:text-2xl font-bold">{sp.title}</h1>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`relative shrink-0 flex-1 py-3 text-sm font-medium border-b-2 transition-all min-w-0 ${
                  activeTab === tab.key
                    ? 'border-accent-warm text-accent-warm'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Dirty indicator */}
                {((tab.key === 'profile' && isDirtyProfile) || (tab.key === 'preferences' && isDirtyPreferences)) && (
                  <span className="absolute top-2 right-1 w-1.5 h-1.5 bg-accent-warm rounded-full" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <ProfileTab
              username={username}
              originalUsername={originalUsername}
              setUsername={setUsername}
              usernameError={usernameError}
              checkingUsername={checkingUsername}
              bio={bio}
              originalBio={originalBio}
              setBio={setBio}
              avatarUrl={avatarUrl}
              originalAvatarUrl={originalAvatarUrl}
              avatarFile={avatarFile}
              onAvatarChange={handleAvatarChange}
              onAvatarRemove={handleAvatarRemove}
              birthDate={birthDate}
              originalBirthDate={originalBirthDate}
              setBirthDate={setBirthDate}
              gender={gender}
              originalGender={originalGender}
              setGender={setGender}
              country={country}
              originalCountry={originalCountry}
              setCountry={setCountry}
              saving={saving}
              onSave={saveProfile}
              t={t}
            />
          )}

          {activeTab === 'preferences' && (
            <PreferencesTab
              interests={interests}
              setInterests={setInterests}
              dietary={dietary}
              setDietary={setDietary}
              allergies={allergies}
              setAllergies={setAllergies}
              cuisineOptions={cuisineOptions}
              dietaryOptions={dietaryOptions}
              showSavedToPublic={showSavedToPublic}
              setShowSavedToPublic={setShowSavedToPublic}
              showCookedToPublic={showCookedToPublic}
              setShowCookedToPublic={setShowCookedToPublic}
              saving={saving}
              onSave={savePreferences}
              t={t}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab t={t} />
          )}

          {activeTab === 'account' && (
            <AccountTab
              profile={profile}
              supabase={supabase}
              router={router}
              t={t}
            />
          )}
        </div>
      </main>

      <BottomNav />

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background-secondary p-6 space-y-4">
            <h2 className="text-lg font-bold">{sp.unsavedChanges}</h2>
            <p className="text-sm text-text-secondary">{sp.unsavedChangesMsg}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowUnsavedModal(false); pendingTabRef.current = null; }}
                className="flex-1 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all"
              >
                {sp.stay}
              </button>
              <button
                onClick={handleConfirmLeave}
                className="flex-1 py-3 rounded-xl bg-white/10 font-bold hover:bg-white/20 transition-all"
              >
                {sp.leave}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
