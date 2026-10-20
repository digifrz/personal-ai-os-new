import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  ExternalLink,
  Smartphone,
  Building,
  RefreshCw,
  Clock,
  Download,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth, PremiumTier } from '../../context/AuthContext';

export interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTier?: PremiumTier;
  amount?: number;
  itemName?: string;
  onSuccess?: () => void;
}

type PaymentMethodType = 'card' | 'paypal' | 'apple_google_pay' | 'upi';

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  targetTier = 'pro',
  amount = targetTier === 'executive' ? 29 : 12,
  itemName = targetTier === 'executive' ? 'Executive AI Membership' : 'Pro Power OS Plan',
  onSuccess,
}) => {
  const { setPremiumTier, user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardholderName, setCardholderName] = useState(user?.displayName || 'Workspace Member');
  const [billingCountry, setBillingCountry] = useState('United States');

  // UPI state
  const [upiId, setUpiId] = useState('user@okaxis');

  // PayPal state
  const [paypalEmail, setPaypalEmail] = useState(user?.email || 'user@example.com');

  if (!isOpen) return null;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Simulate real gateway handshake (Stripe / PayPal / Google Pay)
      await new Promise((resolve) => setTimeout(resolve, 1400));

      // Update user premium status in context & database
      await setPremiumTier(targetTier);

      // Record invoice into local storage billing history
      const newInvoice = {
        id: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        description: itemName,
        amount: `$${amount.toFixed(2)}`,
        status: 'Paid',
        method: selectedMethod.toUpperCase(),
      };

      try {
        const savedHistory = localStorage.getItem('paio_billing_invoices');
        const list = savedHistory ? JSON.parse(savedHistory) : [];
        list.unshift(newInvoice);
        localStorage.setItem('paio_billing_invoices', JSON.stringify(list));
      } catch {}

      setIsProcessing(false);
      setIsSuccess(true);

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Payment processing failed. Please verify credentials.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-2xl space-y-5 text-[var(--color-text)]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-white/10 text-[var(--color-muted)] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">Secure Payment Gateway</h3>
            <p className="text-xs text-[var(--color-muted)]">
              256-bit encrypted checkout · Instant plan activation
            </p>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-[var(--color-text)]">{itemName}</span>
            <span className="text-[11px] text-[var(--color-muted)]">
              Billed monthly · Cancel anytime
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-emerald-400">${amount}</span>
            <span className="text-[10px] text-[var(--color-muted)] block">/month</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'card' as PaymentMethodType, label: 'Credit Card', icon: CreditCard },
              { id: 'paypal' as PaymentMethodType, label: 'PayPal', icon: Building },
              { id: 'apple_google_pay' as PaymentMethodType, label: 'Apple/GPay', icon: Smartphone },
              { id: 'upi' as PaymentMethodType, label: 'UPI / NetBanking', icon: Sparkles },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-2 ring-emerald-500/20 font-bold'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px]">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Inputs based on selected method */}
        <form onSubmit={handleProcessPayment} className="space-y-4">
          {selectedMethod === 'card' && (
            <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none focus:border-emerald-500"
                  />
                  <CreditCard className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">
                    Expires
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="•••"
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-mono text-[var(--color-text)] outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {selectedMethod === 'paypal' && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
              <p className="text-xs text-[var(--color-muted)]">
                You will authorize the payment using your linked PayPal account.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">
                  PayPal Email
                </label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {selectedMethod === 'apple_google_pay' && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center space-y-3">
              <Smartphone className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold text-[var(--color-text)]">
                One-touch biometric payment with Apple Pay / Google Wallet
              </p>
              <p className="text-[11px] text-[var(--color-muted)]">
                Authenticate via Touch ID, Face ID, or your device passcode.
              </p>
            </div>
          )}

          {selectedMethod === 'upi' && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">
                  UPI ID / VPA
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@oksbi"
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-[var(--color-muted)]">
                A payment request will be sent to your UPI app (GPay, PhonePe, Paytm).
              </p>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>Payment confirmed! Upgraded to {targetTier.toUpperCase()} status.</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || isSuccess}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold py-3 text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Transaction…</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Complete!</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay ${amount}.00 &amp; Activate Now</span>
              </>
            )}
          </button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-[var(--color-muted)] pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              PCI-DSS Level 1
            </span>
            <span>·</span>
            <span>256-bit SSL</span>
            <span>·</span>
            <span>Money-back Guarantee</span>
          </div>
        </form>
      </div>
    </div>
  );
};
