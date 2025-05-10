"use client";

import { Card } from "./DemoComponents";

export default function Home() {

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="What is Tax Bridg3?">
        <p className="text-[var(--app-foreground-muted)] mb-4">
            Tax Bridg3 is a decentralized application that allows you to
            seamlessly manage your tax obligations on the Base network. With
            Tax Bridg3, you can easily track your transactions, calculate your
            tax liabilities, and generate reports for tax filing.  
        </p>
      </Card>
    </div>
  );
}
