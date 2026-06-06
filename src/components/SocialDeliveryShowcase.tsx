import { useState } from 'react';
import FloatingSocialChannels, { type DeliveryChannel } from './FloatingSocialChannels';
import GuidanceDemo from './GuidanceDemo';

/**
 * Bloc landing : démo guidance + orbes sociaux synchronisés (WA ↔ IG).
 */
export default function SocialDeliveryShowcase({ className = '' }: { className?: string }) {
  const [channel, setChannel] = useState<DeliveryChannel>('whatsapp');

  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`.trim()}>
      <FloatingSocialChannels
        variant="section"
        activeChannel={channel}
        autoCycle={false}
        className="z-0 -inset-x-4 sm:-inset-x-8"
      />
      <GuidanceDemo className="relative z-[1] w-full" onDeliveryChannelChange={setChannel} />
    </div>
  );
}
