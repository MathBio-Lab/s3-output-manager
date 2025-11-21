'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FaDownload, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FileItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    lastModified?: string;
}

interface FilePreviewProps {
    file: FileItem | null;
}

export default function FilePreview({ file }: FilePreviewProps) {
    const [downloadUrl, setDownloadUrl] = useState('');
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (file) {
            const fetchUrl = async () => {
                setLoading(true);
                setFileContent(null);
                try {
                    const response = await fetch(`/api/s3-download?key=${encodeURIComponent(file.path)}`);
                    const data = await response.json();
                    if (data.url) {
                        setDownloadUrl(data.url);

                        // Fetch content for text-based files
                        if (file.name.match(/\.(csv|sh|txt|json|md|js|ts|css|html)$/i)) {
                            try {
                                const contentResponse = await fetch(data.url);
                                if (contentResponse.ok) {
                                    const text = await contentResponse.text();
                                    setFileContent(text);
                                }
                            } catch (err) {
                                console.error('Failed to fetch file content:', err);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to get download URL:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchUrl();
        } else {
            setDownloadUrl('');
            setFileContent(null);
        }
    }, [file]);

    if (!file) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                Select a file to preview
            </div>
        );
    }

    const isImage = file.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const isPdf = file.name.endsWith('.pdf');
    const isText = file.name.match(/\.(csv|sh|txt|json|md|js|ts|css|html)$/i);

    return (
        <div className="h-full flex flex-col p-6">
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="break-all">{file.name}</CardTitle>
                    <div className="text-sm text-gray-500">
                        {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown size'}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden flex items-center justify-center border relative">
                        {loading ? (
                            <FaSpinner className="animate-spin text-2xl text-gray-400" />
                        ) : (
                            <>
                                {isImage && downloadUrl && (
                                    <img src={downloadUrl} alt={file.name} className="max-w-full max-h-full object-contain" />
                                )}
                                {isPdf && downloadUrl && (
                                    <iframe src={downloadUrl} className="w-full h-full" title={file.name} />
                                )}
                                {isText && fileContent !== null && (
                                    <div className="w-full h-full overflow-auto p-4">
                                        <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                                            {fileContent}
                                        </pre>
                                    </div>
                                )}
                                {!isImage && !isPdf && (!isText || fileContent === null) && (
                                    <div className="text-gray-500">Preview not available for this file type</div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex gap-2 mt-auto pt-4">
                        <Button
                            className="flex-1 gap-2"
                            disabled={!downloadUrl}
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = file.name;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                        >
                            <FaDownload /> Download
                        </Button>
                        {downloadUrl && (
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => window.open(downloadUrl, '_blank')}
                            >
                                <FaExternalLinkAlt /> Open
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
