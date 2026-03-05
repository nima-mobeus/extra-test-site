import { VoiceConnectButton } from '@/components/voice/VoiceConnectButton';

const agentName = process.env.NEXT_PUBLIC_AGENT_NAME || 'AI Assistant';
const greeting = process.env.NEXT_PUBLIC_WIDGET_GREETING || '';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-50 to-white" />
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            {agentName}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {greeting || `Welcome! I'm here to help you with any questions you might have. Click the chat button to start a conversation.`}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <VoiceConnectButton size="lg" />
            <a
              href="#features"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700"
            >
              Learn More <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            How Can We Help?
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Our AI assistant is available 24/7 to answer your questions.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="💬"
              title="Instant Answers"
              description="Get immediate responses to your questions. No waiting, no hold times."
            />
            <FeatureCard
              icon="🎯"
              title="Personalized Help"
              description="Our AI understands your needs and provides tailored assistance."
            />
            <FeatureCard
              icon="🔒"
              title="Private & Secure"
              description="Your conversations are private and handled with care."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-gray-50 px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Ready to get started?
          </h2>
          <p className="mt-4 text-gray-600">
            Click the button above or use the voice overlay in the corner to start a conversation with our AI assistant.
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
