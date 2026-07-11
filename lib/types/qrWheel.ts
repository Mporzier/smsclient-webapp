export type QrWheelSegment = {
  id: string;
  label: string;
  probabilityWeight: number;
  isLosing: boolean;
  screenMessage: string;
  smsMessage: string;
  color: string;
  sortOrder: number;
};

export type QrWheelConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  allowRepeat: boolean;
  prizeValidityDays: number;
  sendPrizeSms: boolean;
  segments: QrWheelSegment[];
};

export type QrWheelPublicSegment = {
  id: string;
  label: string;
  color: string;
  is_losing: boolean;
};

export type QrWheelPublicConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  segments: QrWheelPublicSegment[];
};

export type QrWheelSpinResult = {
  segmentId: string;
  label: string;
  screenMessage: string;
  smsMessage: string;
  isLosing: boolean;
  validUntil: string | null;
  sendPrizeSms: boolean;
};

export type QrSubmitResult = {
  ok?: boolean;
  error?: string;
  clientId?: string;
  sendWelcomeSms?: boolean;
  welcomeSmsTemplate?: string | null;
};
