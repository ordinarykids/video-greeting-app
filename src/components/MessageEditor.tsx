"use client";

import { useState } from "react";

interface MessageEditorProps {
  message: string;
  onChange: (message: string) => void;
  occasion?: string | null;
}

const MAX_CHARS = 500;

const templates: Record<string, string[]> = {
  birthday: [
    "Happy Birthday! Wishing you an amazing year filled with joy and success!",
    "It's your special day! May all your dreams come true this year!",
    "Happy Birthday! Here's to another year of wonderful memories!",
  ],
  congratulations: [
    "Congratulations on your amazing achievement! You deserve all the success!",
    "Way to go! Your hard work has finally paid off!",
    "Congratulations! This is just the beginning of greater things to come!",
  ],
  thankyou: [
    "Thank you so much for everything! Your kindness means the world to me.",
    "I'm so grateful for your help. Thank you from the bottom of my heart!",
    "Words can't express how thankful I am. You're truly amazing!",
  ],
  custom: ["Write your own personalized message here..."],
};

export default function MessageEditor({
  message,
  onChange,
  occasion,
}: MessageEditorProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const charCount = message.length;
  const charRemaining = MAX_CHARS - charCount;
  const isOverLimit = charRemaining < 0;

  const occasionTemplates = templates[occasion || "custom"] || templates.custom;
  const autoShowTemplates =
    Boolean(occasion) && !message && occasionTemplates.length > 0;
  const templatesVisible = showTemplates || autoShowTemplates;

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your personalized message here..."
          className={`h-40 w-full resize-none rounded-xl border-2 p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            isOverLimit
              ? "border-red-300 focus:border-red-500"
              : "border-gray-200 focus:border-gray-900"
          }`}
        />
        <div
          className={`absolute bottom-3 right-3 text-sm ${
            isOverLimit ? "font-medium text-red-500" : "text-gray-400"
          }`}
        >
          {charCount}/{MAX_CHARS}
        </div>
      </div>

      {templatesVisible && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Need inspiration? Try one of these:
          </p>
          <div className="flex flex-wrap gap-2">
            {occasionTemplates.map((template, index) => (
              <button
                key={index}
                onClick={() => {
                  onChange(template);
                  setShowTemplates(false);
                }}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                {template.substring(0, 50)}...
              </button>
            ))}
          </div>
        </div>
      )}

      {!templatesVisible && message && (
        <button
          onClick={() => setShowTemplates(true)}
          className="text-sm text-gray-900 hover:text-black underline"
        >
          Show message templates
        </button>
      )}
    </div>
  );
}
