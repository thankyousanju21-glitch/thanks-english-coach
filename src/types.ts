export interface AppSettings {
  mode: string;
  pace: string;
  gender: 'Male' | 'Female';
  personality: string;
  apiKey?: string;
  language: string;
  replyLength: 'Short' | 'Medium' | 'Long';
  userName: string;
  userGender: 'Male' | 'Female' | 'Prefer not to say' | '';
  thinkingLanguage: string;
  buzzerEnabled: boolean;
  isOnboarded: boolean;
  grammarCorrection: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'Conversation',
  pace: 'Normal',
  gender: 'Female',
  personality: 'Pratigya',
  apiKey: '',
  language: 'English',
  replyLength: 'Medium',
  userName: '',
  userGender: '',
  thinkingLanguage: '',
  buzzerEnabled: true,
  isOnboarded: false,
  grammarCorrection: true,
};
