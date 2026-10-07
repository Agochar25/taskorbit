import { useOnline } from '../hooks/useNetwork';
import { Banner } from './ui';

/** Shows when the device is offline or when the screen is displaying saved (cached) data. */
export default function OfflineBanner({ stale }) {
  const online = useOnline();
  if (!online) return <Banner text="You're offline. Showing your last saved data." />;
  if (stale) return <Banner text="Couldn't refresh. Showing your last saved data." />;
  return null;
}
