
/**
 * Mock Email Service
 * Simulates integration with Gmail API for fetching and sending complaints.
 */
export const emailService = {
  /**
   * Simulates fetching recent unread emails from a Gmail inbox that contain postal complaints.
   */
  fetchIncomingComplaints: async (): Promise<any[]> => {
    // Simulate network delay for fetching
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      {
        id: 'msg-101',
        customerEmail: 'amit.sharma82@gmail.com',
        subject: 'Speed Post Delay - Order #IN99281',
        originalText: 'My Speed Post from Bangalore to Delhi has not moved for 4 days. It is very urgent. Please look into this immediately.',
        timestamp: Date.now() - 3600000 * 2,
        status: 'pending',
        location: 'Karnataka Circle'
      },
      {
        id: 'msg-102',
        customerEmail: 'priya_verma@gmail.com',
        subject: 'Damaged parcel received',
        originalText: 'I received my parcel today but the box was completely torn and the item inside is broken. Very disappointed with the handling.',
        timestamp: Date.now() - 3600000 * 5,
        status: 'pending',
        location: 'Maharashtra Circle'
      },
      {
        id: 'msg-103',
        customerEmail: 'rajesh.post@gmail.com',
        subject: 'Query regarding refund',
        originalText: 'I was promised a refund for my lost shipment last month. I still haven\'t received any update on the transaction status.',
        timestamp: Date.now() - 3600000 * 24,
        status: 'pending',
        location: 'Delhi Circle'
      },
      {
        id: 'msg-104',
        customerEmail: 'vicky.p@yahoo.com',
        subject: 'Parcel lost in transit',
        originalText: 'My package hasn\'t arrived in 2 weeks. Tracking says it is stuck in Tamil Nadu. This is unacceptable.',
        timestamp: Date.now() - 3600000 * 12,
        status: 'pending',
        location: 'Tamil Nadu Circle'
      },
      {
        id: 'msg-105',
        customerEmail: 'sneha.r@outlook.com',
        subject: 'Rude staff at counter',
        originalText: 'The staff at the local post office in Pune was extremely unhelpful and rude when I went to collect my registered letter.',
        timestamp: Date.now() - 3600000 * 1,
        status: 'pending',
        location: 'Maharashtra Circle'
      }
    ];
  },

  /**
   * Simulates sending an automated response back to the customer's Gmail.
   */
  sendAutomatedResponse: async (to: string, subject: string, body: string): Promise<boolean> => {
    console.log(`[Gmail Integration] Transmitting to: ${to}`);
    console.log(`[Gmail Integration] Re: ${subject}`);
    
    // Simulate SMTP/API latency
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return true;
  }
};
