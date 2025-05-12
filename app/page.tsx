"use client";

import { useOpenUrl } from "@coinbase/onchainkit/minikit";
import { Button } from "./components/Button";
import Home from "./components/Home";
import { Header } from "./components/Header";
import { AppTabs } from "./components/AppTabs";

export default function App() {


  const openUrl = useOpenUrl();

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <Header />
        <AppTabs />
        <main className="flex-1">
          <Home />
        </main>
        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://novanet.hu")}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" className="mr-2" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="9,3 3,13 15,13" fill="none" stroke="white" strokeWidth="2"/>
            </svg>NovaNet
          </Button>
        </footer>
      </div>
    </div>
  );
}
