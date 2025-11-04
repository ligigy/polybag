import React from 'react';

export default function GridLayout({ children }: { children: React.ReactNode }) {
  return <section className="space-y-4">{children}</section>;
}
