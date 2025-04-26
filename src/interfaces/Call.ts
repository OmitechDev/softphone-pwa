  // src/interfaces/Call.ts
  export interface CallHistoryItem {
    id: string;
    extension: string;
    name?: string;
    direction: 'inbound' | 'outbound';
    timestamp: Date;
    duration: number;
    status: 'answered' | 'missed' | 'rejected';
  }
  
  export interface ActiveCallState {
    callId?: string;
    remoteIdentity?: string;
    remoteName?: string;
    startTime?: Date;
    duration?: number;
    isOnHold: boolean;
    isMuted: boolean;
    isTransferring: boolean;
    isInConference: boolean;
    status: 'dialing' | 'ringing' | 'established' | 'ended' | 'failed' | 'none';
  }