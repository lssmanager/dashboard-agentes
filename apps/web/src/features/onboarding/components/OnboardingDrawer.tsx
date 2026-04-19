import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, ArrowRight, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

import { createWorkspace, getStudioState } from '../../../lib/api';
import { ProfileSpec } from '../../../lib/types';
import { ProfileSummaryCard } from './ProfileSummaryCard';

interface OnboardingDrawerProps {
  open: boolean;
  onComplete: () => Promise<void>;
  onClose?: () => void;
}

interface FormValues {
  name: string;
  profileId: string;
}

export function OnboardingDrawer({ open, onComplete, onClose }: OnboardingDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profiles, setProfiles]     = useState<ProfileSpec[]>([]);
  const [fetching, setFetching]     = useState(true);
  const [fetchErr, setFetchErr]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr]   = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', profileId: '' },
  });

  const selectedProfileId = watch('profileId');
  const selectedProfile   = profiles.find((p) => p.id === selectedProfileId) ?? null;
  const workspaceName     = watch('name');

  useEffect(() => {
    if (!open) {
      setStep(1);
      reset();
      return;
    }
    setFetching(true);
    setFetchErr(null);
    getStudioState()
      .then((s) => { setProfiles(s.profiles); setFetching(false); })
      .catch((err) => {
        setFetchErr(err instanceof Error ? err.message : 'Failed to load profiles');
        setFetching(false);
      });
  }, [open, reset]);

  // Auto-fill workspace name when profile is selected
  useEffect(() => {
    if (selectedProfile && step === 2 && !workspaceName.trim()) {
      setValue('name', selectedProfile.name);
    }
  }, [selectedProfile, step, workspaceName, setValue]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setSubmitErr(null);
    try {
      await createWorkspace({ name: values.name.trim(), profileId: values.profileId });
      reset();
      setStep(1);
      await onComplete();
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : 'Failed to create workspace');
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (step === 1 && !selectedProfileId) {
      setSubmitErr('Select a profile');
      return;
    }
    if (step === 1) {
      setSubmitErr(null);
      setStep(2);
      return;
    }
    if (step === 2 && !workspaceName.trim()) {
      setSubmitErr('Enter a workspace name');
      return;
    }
    if (step === 2) {
      setSubmitErr(null);
      setStep(3);
      return;
    }
  }

  function handleBack() {
    setSubmitErr(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  }

  function handleClose() {
    setStep(1);
    reset();
    setSubmitErr(null);
    onClose?.();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.28)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          zIndex: 1100,
        }}
        onClick={handleClose}
      />

      {/* Drawer — floating card with 16px inset */}
      <aside
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          bottom: 16,
          width: 440,
          maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(255,255,255,0.98)',
          border: '1px solid rgba(255,255,255,0.7)',
          borderRadius: 22,
          boxShadow: '0 28px 80px rgba(15, 23, 42, 0.18)',
          zIndex: 1101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-primary)', background: '#fbfdff', flexShrink: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                <span className="text-lg leading-none">🦞</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-heading font-semibold text-[var(--text-primary)] leading-tight">
                  Create your first workspace
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {step === 1 && 'Choose a profile to bootstrap agents and skills'}
                  {step === 2 && 'Name your workspace'}
                  {step === 3 && 'Review and confirm'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Progress bar — 3-segment grid */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  style={{
                    height: 6,
                    borderRadius: 'var(--radius-full)',
                    background: stepNum <= step ? 'var(--color-primary)' : 'var(--border-primary)',
                    transition: 'background var(--transition)',
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center" style={{ marginTop: 8 }}>
              Step {step} of 3
            </p>
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'grid', gap: 16 }}
        >
          {(fetchErr || submitErr) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {fetchErr ?? submitErr}
            </div>
          )}

          {/* Step 1: Profile Selection */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                Choose a Profile
              </label>
              {fetching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-[var(--color-primary)]" />
                </div>
              ) : profiles.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  No profiles available
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <label
                      key={profile.id}
                      className="relative block p-4 rounded-xl border-2 cursor-pointer transition-all"
                      style={{
                        borderColor: selectedProfileId === profile.id ? 'var(--color-primary)' : 'var(--border-primary)',
                        backgroundColor: selectedProfileId === profile.id ? 'var(--color-primary-soft)' : 'var(--input-bg)',
                      }}
                    >
                      <input
                        type="radio"
                        {...register('profileId', { required: true })}
                        value={profile.id}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <div
                          className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
                          style={{
                            borderColor: selectedProfileId === profile.id ? 'var(--color-primary)' : 'var(--border-primary)',
                            backgroundColor: selectedProfileId === profile.id ? 'var(--color-primary)' : 'transparent',
                          }}
                        >
                          {selectedProfileId === profile.id && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-[var(--text-primary)]">
                            {profile.name}
                          </div>
                          {profile.category && (
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">
                              {profile.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Workspace Name */}
          {step === 2 && selectedProfile && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-1.5">
                  Workspace Name
                </label>
                <input
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'At least 2 characters' },
                  })}
                  placeholder="e.g., My Operations Workspace"
                  className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[var(--input-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)] transition-all"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Selected Profile Summary */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-1.5">
                  Using Profile
                </label>
                <ProfileSummaryCard profile={selectedProfile} />
              </div>

              <p className="text-center text-xs text-[var(--text-muted)]">
                Profile skills, routines, and model settings will be applied automatically.
              </p>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && selectedProfile && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="rounded-xl border border-[var(--border-primary)] p-4 space-y-3">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle size={32} className="text-[var(--color-success)]" />
                </div>
                <h3 className="font-semibold text-center text-[var(--text-primary)]">
                  Ready to create
                </h3>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Profile:</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {selectedProfile.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Workspace:</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {workspaceName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {[
                  { label: 'Agents',  desc: 'Pre-configured AI agents with roles and skills' },
                  { label: 'Flows',   desc: 'Automation flows triggered by events or routines' },
                  { label: 'Skills',  desc: 'Tools and integrations the agents can use' },
                ].map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[var(--color-primary-soft)] border border-[var(--color-primary)] flex-shrink-0 flex items-center justify-center mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{f.label}: </span>
                      <span className="text-xs text-[var(--text-muted)]">{f.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-primary)', background: '#fbfdff', flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="flex items-center gap-2 flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50"
                style={{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting || fetching || !!fetchErr}
                className="flex items-center justify-center gap-2 flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
              >
                Next <ArrowRight size={14} />
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                disabled={submitting || !!submitErr}
                onClick={handleSubmit(onSubmit)}
                className="flex items-center justify-center gap-2 flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Creating…</>
                ) : (
                  <><CheckCircle size={14} /> Confirm & Create</>
                )}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
