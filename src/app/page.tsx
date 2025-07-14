'use client';

import Image from "next/image";
import Link from "next/link";
import { FaPenFancy, FaBook, FaMagic, FaPalette } from "react-icons/fa";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28 lg:py-32 max-w-5xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight drop-shadow-md">
          Welcome to <span className="text-primary">NoteVerse</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl">
          The all-in-one note-taking universe for thinkers, creators, and visual minds.
          Capture thoughts with canvas or structured text — it&apos;s your choice.
        </p>
        <div className="mt-10 items-center flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/notes"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition shadow-lg"
          >
            Launch App
          </Link>
          <a
            href="#features"
            className="text-muted-foreground hover:text-primary underline underline-offset-4 font-medium"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted py-16 sm:py-20 px-6">
        <div className="max-w-6xl items-center mx-auto grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <FaPenFancy className="text-2xl text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Canvas Mode</h3>
                <p className="text-muted-foreground">
                  Draw, sketch, brainstorm — the freeform whiteboard for creative thinkers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <FaBook className="text-2xl text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Notebook Mode</h3>
                <p className="text-muted-foreground">
                  Type structured notes line-by-line or in full-page editor — like a real notebook.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <FaPalette className="text-2xl text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Smart Design</h3>
                <p className="text-muted-foreground">
                  Elegant interface with light & dark themes, fluid transitions, and rich color palette.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <FaMagic className="text-2xl text-primary" />
              <div>
                <h3 className="text-lg font-semibold">AI Ready</h3>
                <p className="text-muted-foreground">
                  Coming soon — AI-powered suggestions, summarization, and smart note organization.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-xl ring-1 ring-border">
            <Image
              src="/screenshots/overview.png"
              alt="Nodeverse Screenshot"
              width={900}
              height={600}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-border text-center text-sm text-muted-foreground">
        Built with ❤️ · © {new Date().getFullYear()} Nodeverse
      </footer>
    </main>
  );
}
