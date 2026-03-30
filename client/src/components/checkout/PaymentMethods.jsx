'use client';

export const PaymentMethods = ({ selectedMethod, onSelectMethod }) => {
  const methods = [
    { id: 'stripe', name: 'Stripe', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Method</h3>
      <div className="grid grid-cols-1 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelectMethod(method.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedMethod === method.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{method.icon}</span>
              <div>
                <p className="font-medium">{method.name}</p>
                <p className="text-sm text-muted-foreground">
                  {method.id === 'stripe' && 'Fast and secure'}
                  {method.id === 'paypal' && 'Use your PayPal account'}
                  {method.id === 'bank' && 'Direct bank transfer'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
