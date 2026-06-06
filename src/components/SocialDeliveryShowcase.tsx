import GuidanceDemo from './GuidanceDemo';

/** Bloc démo guidance sur la landing (sans orbes redondants). */
export default function SocialDeliveryShowcase({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <GuidanceDemo className="w-full max-w-md mx-auto" />
    </div>
  );
}
