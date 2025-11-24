'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FaLock, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import { ThemeColorPicker } from '@/components/theme-color-picker';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password }),
            });

            if (response.ok) {
                router.push('/');
                router.refresh();
            } else {
                const data = await response.json();
                setError(data.error || 'Invalid password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center relative" style={{ background: `hsl(var(--theme-background))`, color: `hsl(var(--theme-foreground))` }}>
            <div className="absolute top-4 right-4">
                <ThemeColorPicker />
            </div>
            <Card className="w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-6 gap-2">
                    <img src="/genomas.png" alt="Genomas Manager Logo" className="h-12 w-12" width={48} height={48} />
                    <h1 className="text-2xl font-bold text-center">Genomas Manager</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter your credentials to continue</p>
                </div>
                <CardContent className="p-0">
                    <form onSubmit={handleLogin} className="space-y-4" aria-label="Login form">
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2 relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : 'Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
