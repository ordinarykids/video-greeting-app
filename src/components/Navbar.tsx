"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Button from "./ui/Button";
import { Video, User, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Video className="h-8 w-8 text-violet-600" />
            <span className="text-xl font-bold text-gray-900">VideoGreet</span>
          </Link>

          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  My Videos
                </Link>
                <Link href="/create">
                  <Button size="sm">Create Video</Button>
                </Link>
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-600">
                    {session.user.credits} credits
                  </span>
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                  <button
                    onClick={() => signOut()}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <Button onClick={() => signIn("google")}>Sign in</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
