const agentName = process.env.NEXT_PUBLIC_AGENT_NAME || 'AI Assistant';

export default function About() {
  return (
    <div className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          About Us
        </h1>
        <div className="mt-8 space-y-6 text-gray-600 leading-7">
          <p>
            Welcome to our website! We use {agentName}, an AI-powered voice
            assistant, to provide you with instant help and information.
          </p>
          <p>
            Our assistant is available 24/7 and can help with a wide range of
            questions. Simply click the chat button in the corner of the page to
            start a conversation.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">
            How It Works
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click the chat button in the bottom corner</li>
            <li>Allow microphone access when prompted</li>
            <li>Speak naturally — our AI will respond in real time</li>
            <li>You can also type your questions if you prefer</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
