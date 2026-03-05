'use client';

import Link from 'next/link';
import { useState } from 'react';

const agentName = process.env.NEXT_PUBLIC_AGENT_NAME || 'AI Assistant';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-100 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="text-xl font-bold text-gray-900">
          {agentName}
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex sm:gap-8">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Home
          </Link>
          <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Contact
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="border-t border-gray-100 px-6 py-4 sm:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
