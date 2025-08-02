import type { Metadata } from 'next';
import { getMetadata } from '@/app/metadata';
import HomePage from '@/components/pages/HomePage';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return getMetadata();
}

export default function Home() {
  return <HomePage />;
}
