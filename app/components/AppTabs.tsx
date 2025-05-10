"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "wagmi";

type Tab = {
  label: string;
  path: string;
  show?: boolean;
};

export function AppTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAccount();

  const tabs: Tab[] = [
    { label: "Home", path: "/" },
    { label: "Transactions", path: "/transactions", show: !!address },
    { label: "Company profile", path: "/company-profile", show: !!address },
  ];

  // Determine active tab by pathname or query
  const isActive = (tab: Tab) => {
    if (tab.path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(tab.path);
  };

  return (
    <nav className="flex space-x-2 mb-4 border-b border-[var(--app-card-border)]">
      {tabs
        .filter((tab) => tab.show === undefined || tab.show)
        .map((tab) => (
          <button
            key={tab.label}
            onClick={() => router.push(tab.path)}
            className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${
              isActive(tab)
                ? "border-[var(--app-accent)] text-[var(--app-accent)]"
                : "border-transparent text-[var(--app-foreground-muted)] hover:text-[var(--app-accent)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
    </nav>
  );
}
