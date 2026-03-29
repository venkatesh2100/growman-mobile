import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type SignupDraft = {
  email: string;
  firstName: string;
  phone: string;
  password: string;
};

const empty: SignupDraft = {
  email: '',
  firstName: '',
  phone: '',
  password: '',
};

type Ctx = {
  draft: SignupDraft;
  setDraft: (patch: Partial<SignupDraft>) => void;
  reset: () => void;
};

const SignupDraftContext = createContext<Ctx | null>(null);

export function SignupDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setState] = useState<SignupDraft>(empty);

  const setDraft = useCallback((patch: Partial<SignupDraft>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setState(empty), []);

  const value = useMemo(() => ({ draft, setDraft, reset }), [draft, setDraft, reset]);

  return <SignupDraftContext.Provider value={value}>{children}</SignupDraftContext.Provider>;
}

export function useSignupDraft() {
  const ctx = useContext(SignupDraftContext);
  if (!ctx) throw new Error('useSignupDraft must be used inside SignupDraftProvider');
  return ctx;
}
