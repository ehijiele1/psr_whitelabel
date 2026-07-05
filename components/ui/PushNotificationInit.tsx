'use client';

import dynamic from 'next/dynamic';

const PushNotificationManager = dynamic(
  () => import('@/components/ui/PushNotificationManager'),
  { ssr: false }
);

export default function PushNotificationInit() {
  return <PushNotificationManager />;
}