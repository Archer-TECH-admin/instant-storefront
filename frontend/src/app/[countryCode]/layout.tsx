import { I18n } from '@enonic/nextjs-adapter';
import { ReactNode } from 'react';

type LayoutProps = {
  params: Promise<{ countryCode: string }>
  children: ReactNode
}

export default async function CountryCodeLayout({ params, children }: LayoutProps) {
  const resolvedParams = await params;
  await I18n.setLocale(resolvedParams.countryCode);

  return <>{children}</>;
}
