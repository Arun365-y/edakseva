
export enum ComplaintCategory {
  DELIVERY_DELAY = 'Delay',
  LOST_PACKAGE = 'Lost',
  DAMAGED_PARCEL = 'Damage',
  INVALID = 'Invalid',
  OTHERS = 'Others'
}

export enum SentimentLevel {
  ANGRY = 'Angry',
  UNHAPPY = 'Unhappy',
  NEUTRAL = 'Neutral',
  POSITIVE = 'Positive'
}

export enum PriorityLevel {
  HIGH = 'Urgent',
  NORMAL = 'Normal',
  LOW = 'Low'
}

export type UserRole = 'admin' | 'user';

export interface UserSession {
  customerId: string;
  role: UserRole;
  name: string;
}

export interface AnalysisResult {
  category: string;
  sentiment: string;
  priority: string;
  response: string;
  requiresReview: boolean;
  confidenceScore: number;
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
  customerId: string;
  subject: string;
  timestamp: number;
  status: 'pending' | 'drafted' | 'sent' | 'resolved' | 'auto_resolved';
  formalEmailDraft?: string;
  aiResponse?: string;      // Instant AI generation
  adminResponse?: string;   // Final response approved/sent by admin
  userId?: string; 
  orderId?: string; 
  type: 'Complaint' | 'Feedback';
  source: 'portal' | 'gmail';
  location?: string; // e.g., 'Delhi Circle', 'Mumbai Circle'
}
