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
          Don&apos;t forget to fill your company data if you want:
          <ul className="list-disc pl-4">
            <li>Generate reports for tax filing on your local currency - based on your company&apos;s country.</li>
            <li>To have the export for your company&apos;s name with your company logo.</li>
          </ul>
        </p>
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Support and advisory: <a href="mailto:central@novanet.hu" className="underline">central@novanet.hu</a>
        </p>
      </Card>
    </div>
  );
}
