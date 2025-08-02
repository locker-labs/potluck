import type { Metadata } from 'next';
import { getMetadata } from '@/app/metadata';
import CreatePotPage from '@/components/pages/CreatePotPage';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata({ path: '/create' });
}

export default function Create() {
  return <CreatePotPage />;
}
