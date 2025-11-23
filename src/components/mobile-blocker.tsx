'use client';

import { useEffect, useState } from 'react';
import { FaMobileAlt } from 'react-icons/fa';

export default function MobileBlocker() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
            const mobile = Boolean(
                userAgent.match(
                    /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
                )
            );
            const smallScreen = window.innerWidth < 768;

            setIsMobile(mobile || smallScreen);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isMobile) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-card p-8 rounded-xl shadow-2xl border max-w-md w-full flex flex-col items-center gap-6">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <FaMobileAlt className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Desktop Only</h1>
                    <p className="text-muted-foreground">
                        This application is designed for desktop use only. Please access it from a larger screen for the best experience.
                    </p>
                </div>
            </div>
        </div>
    );
}
