'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaHome, FaSearch, FaArrowLeft } from 'react-icons/fa';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* 404 Animation */}
                <div className="relative">
                    <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 leading-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl animate-bounce">🔍</div>
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        Oops! Page Not Found
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        The page you're looking for seems to have wandered off into the cloud.
                        Let's get you back on track!
                    </p>
                </div>

                {/* Suggestions */}
                <div className="bg-card border rounded-lg p-6 text-left max-w-md mx-auto">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FaSearch className="text-primary" />
                        Here's what you can do:
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Check the URL for typos</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Go back to the previous page</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Visit the home page and start fresh</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>Contact support if you think this is an error</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        <FaArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full">
                            <FaHome className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Fun fact */}
                <div className="pt-8 text-xs text-muted-foreground">
                    <p>💡 Fun fact: HTTP 404 errors have been around since 1992!</p>
                </div>
            </div>
        </div>
    );
}
