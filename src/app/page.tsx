"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Video, Sparkles, Share2, CreditCard } from "lucide-react";
import Button from "@/components/ui/Button";
import PortraitGallery from "@/components/PortraitGallery";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session) {
      router.push("/create");
    } else {
      signIn("google", { callbackUrl: "/create" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create AI Video
            <span className="text-gray-900"> Greetings</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
            Send personalized video messages for birthdays, congratulations, and
            special occasions. Powered by cutting-edge AI technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted}>
              <Sparkles className="h-5 w-5 mr-2" />
              Create Your Video - $5
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
              Learn How It Works
            </Button>
          </div>
        </div>

        {/* Demo Video Placeholder */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl flex items-center justify-center">
            <div className="text-center text-white">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-80" />
              <p className="text-xl font-medium">AI-Generated Video Preview</p>
              <p className="text-white/60 mt-2">Your personalized greeting video</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-gray-900">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Style</h3>
              <p className="text-gray-500">
                Pick an occasion, select an avatar or upload your own photo, and
                write your personalized message.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pay & Generate</h3>
              <p className="text-gray-500">
                Secure payment of $5 per video. Our AI creates your unique video
                in just 1-2 minutes.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share the Joy</h3>
              <p className="text-gray-500">
                Download your video or share it directly via link, email, or
                social media.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Occasions Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Perfect for Any Occasion
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { emoji: "🎂", label: "Birthday", color: "bg-pink-50 hover:bg-pink-100" },
              { emoji: "🎉", label: "Congratulations", color: "bg-amber-50 hover:bg-amber-100" },
              { emoji: "💝", label: "Thank You", color: "bg-rose-50 hover:bg-rose-100" },
              { emoji: "💬", label: "Custom Message", color: "bg-gray-50 hover:bg-gray-100" },
            ].map((occasion) => (
              <div
                key={occasion.label}
                className={`${occasion.color} p-8 rounded-2xl text-center hover:scale-105 transition-all cursor-pointer border border-gray-100`}
                onClick={handleGetStarted}
              >
                <span className="text-5xl mb-4 block">{occasion.emoji}</span>
                <span className="font-medium text-gray-900">{occasion.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portrait Gallery */}
      <PortraitGallery />

      {/* CTA Section */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Create Something Special?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Make someone&apos;s day with a personalized AI video greeting.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleGetStarted}
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Video className="h-6 w-6 text-white" />
            <span className="text-white font-semibold">VideoGreet</span>
          </div>
          <p className="text-sm">
            Powered by AI. Made with love.
          </p>
          <p className="text-sm mt-2">
            &copy; {new Date().getFullYear()} VideoGreet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
