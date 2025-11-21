'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaDownload, FaSpinner } from 'react-icons/fa';

export default function FileDownloader() {
    const [fileKey, setFileKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDownload = async () => {
        if (!fileKey) {
            setError('Please enter a file key');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`/api/s3-download?key=${encodeURIComponent(fileKey)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get download URL');
            }

            // Trigger download
            const link = document.createElement('a');
            link.href = data.url;
            link.download = fileKey.split('/').pop() || fileKey;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto mt-10">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">S3 File Downloader</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Input
                        type="text"
                        placeholder="Enter file key (e.g., folder/image.png)"
                        value={fileKey}
                        onChange={(e) => setFileKey(e.target.value)}
                        className="w-full"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <Button
                    onClick={handleDownload}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2"
                >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                    Download File
                </Button>
            </CardContent>
        </Card>
    );
}
