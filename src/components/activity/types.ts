export type ActivityItem =
  | {
      kind: 'complaint';
      id: string;
      title: string;
      subtitle: string;
      status: string;
      date: Date;
      complaint: {
        ticketId: string;
        issueType: string;
        lga: string;
        area: string;
        address: string;
        description: string | null;
      };
    }
  | {
      kind: 'payment';
      id: string;
      title: string;
      subtitle: string;
      status: string;
      date: Date;
      payment: {
        billId: string;
        amountKobo: number;
        discountKobo: number;
        paidAt: Date | null;
        periodStart: Date;
        periodEnd: Date;
        receiptNumber: string | null;
        txRef: string;
        rawStatus: string;
      };
    }
  | {
      kind: 'bin_order';
      id: string;
      title: string;
      subtitle: string;
      status: string;
      date: Date;
      binOrder: {
        binLabel: string;
        binType: string;
        quantity: number;
        amountKobo: number;
        deliveryAddress: string;
        txRef: string;
        rawStatus: string;
      };
    };
