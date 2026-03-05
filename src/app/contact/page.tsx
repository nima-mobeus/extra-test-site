const agentName = process.env.NEXT_PUBLIC_AGENT_NAME || 'AI Assistant';

export default function Contact() {
  return (
    <div className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Contact Us
        </h1>
        <div className="mt-8 space-y-6 text-gray-600 leading-7">
          <p>
            The fastest way to get help is to talk to {agentName} — click the
            chat button in the bottom corner for an instant conversation.
          </p>
          <p>
            For other inquiries, feel free to reach out through the form below.
          </p>

          <form className="mt-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-900">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
