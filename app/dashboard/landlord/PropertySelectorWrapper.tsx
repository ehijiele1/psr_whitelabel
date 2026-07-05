'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import PropertySelector from '@/components/ui/PropertySelector';

interface PropertySelectorWrapperProps {
  properties: { id: string; name: string }[];
  currentPropertyId?: string;
}

export default function PropertySelectorWrapper({ properties, currentPropertyId }: PropertySelectorWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSwitch = (property: { id: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('property_id', property.id);
    router.push(`/dashboard/landlord?${params.toString()}`);
  };

  const mapped = properties.map(p => ({
    ...p,
    landlord_id: '',
    address: '',
    status: 'active' as const,
    created_at: '',
  }));

  return (
    <PropertySelector
      properties={mapped}
      currentPropertyId={currentPropertyId}
      onSwitch={onSwitch}
    />
  );
}