import type { Metadata } from 'next';
import ProfileForm from './ProfileForm';

export const metadata: Metadata = {
  title: 'Profile | Grupo Manufacturer Portal',
  robots: { index: false, follow: false },
};

export default function ManufacturerProfilePage() {
  return <ProfileForm />;
}
