"use client";

import { Card } from "./DemoComponents";

export default function Home() {

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="What is Tax Bridg3?">
        <p className="text-[var(--app-foreground-muted)] mb-4">
            {process.env.NEXT_PUBLIC_DESCRIPTION} 
        </p>
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Generate reports for tax filing on your local currency easily.
        </p>
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Don&apos;t forget to fill your company data if you want to have the export for your company&apos;s name!
        </p>
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Support and advisory: <a href="mailto:central@novanet.hu" className="underline">central@novanet.hu</a>
        </p>
      </Card>
    </div>
  );
}
