
export enum ComplaintCategory {
  DELIVERY_DELAY = 'Delivery Delay',
  LOST_PACKAGE = 'Lost Package',
  DAMAGED_PARCEL = 'Damaged Parcel',
  WRONG_ADDRESS = 'Wrong Address',
  REFUND_COMPENSATION = 'Refund or Compensation',
  STAFF_BEHAVIOUR = 'Staff Behaviour',
  OTHER = 'Other'
}

export enum SentimentLevel {
  ANGRY = 'Angry',
  UNHAPPY = 'Unhappy',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive'
}

// Updated PriorityLevel values to align with the 'Urgent' and 'Normal' output from Gemini as defined in constants.ts
export enum PriorityLevel {
  HIGH = 'Urgent',
  NORMAL = 'Normal',
  LOW = 'Low'
}

export type UserRole = 'admin' | 'user';

export interface UserSession {
  email: string;
  role: UserRole;
  name: string;
}

export interface AnalysisResult {
  category: ComplaintCategory;
  sentiment: SentimentLevel;
  priority: PriorityLevel;
  response: string;
  requiresReview: boolean;
  confidenceScore: number; // 0 to 1
}

export interface PostOrder {
  id: string;
  trackingId: string;
  origin: string;
  destination: string;
  status: 'In Transit' | 'Delivered' | 'Out for Delivery';
  estimatedDelivery: string;
}

export interface ComplaintRecord extends Partial<AnalysisResult> {
  id: string;
  originalText: string;
  customerEmail: string;
  subject: string;
  timestamp: number;
  status: 'pending' | 'drafted' | 'sent' | 'resolved' | 'auto_resolved';
  formalEmailDraft?: string;
  userId?: string; 
  orderId?: string; 
  type: 'Complaint' | 'Feedback';
  source: 'portal' | 'gmail';
}
