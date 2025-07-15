'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/custom/button';
import { FaSearch, FaExclamationTriangle, FaHome } from 'react-icons/fa';

export default function NotFoundWrapper() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-royal-blue dark:bg-forest-green px-4 py-10 text-center transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 shadow-xl rounded-3xl p-8 md:p-12 max-w-xl w-full border border-border flex flex-col items-center">
                <div className="text-coral dark:text-coral mb-4">
                    <FaExclamationTriangle className="text-5xl" />
                </div>
                <h1 className="text-6xl font-extrabold text-coral dark:text-coral mb-2 select-none">404</h1>
                <h2 className="text-2xl font-bold text-forest-green dark:text-forest-green mb-3">
                    Page Not Found
                </h2>
                <p className="text-slate-gray dark:text-slate-gray text-base mb-6">
                    We looked everywhere <FaSearch className="inline ml-1" /> but couldn&apos;t find the page you&apos;re looking for.
                    It might have been removed, renamed, or never existed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <Button
                        onClick={() => router.back()}
                        className="bg-goldenrod dark:text-white rounded-xl px-5 py-3 font-semibold w-full sm:w-auto"
                    >
                        Go Back
                    </Button>
                    <Button
                        onClick={() => router.push('/')}
                        className="bg-coral dark:text-white rounded-xl px-5 py-3 font-semibold w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        <FaHome className="text-sm" />
                        Home Page
                    </Button>
                </div>
            </div>
        </div>
    );
}
