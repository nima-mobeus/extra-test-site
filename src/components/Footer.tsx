export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          Powered by{' '}
          <a
            href="https://mobeus.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Mobeus
          </a>
        </p>
      </div>
    </footer>
  );
}
