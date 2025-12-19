'use client';

import { useState } from 'react';

interface FileUploadProps {
    onUpload: (file: File, documentType: string, description?: string) => Promise<void>;
    accept?: string;
    maxSize?: number; // in MB
    documentTypes: { value: string; label: string }[];
}

export default function FileUpload({ onUpload, accept = '.pdf,.jpg,.jpeg,.png', maxSize = 10, documentTypes }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file size
        if (selectedFile.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            return;
        }

        setFile(selectedFile);
        setError('');
    };

    const handleUpload = async () => {
        if (!file || !documentType) {
            setError('Please select a file and document type');
            return;
        }

        try {
            setUploading(true);
            setError('');
            await onUpload(file, documentType, description);

            // Reset form
            setFile(null);
            setDocumentType('');
            setDescription('');

            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (err: any) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Upload Evidence</h3>

            {/* File Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-green-50 file:text-green-700
            hover:file:bg-green-100
            cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Accepted: PDF, JPG, PNG (Max {maxSize}MB)
                </p>
            </div>

            {/* Document Type */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type <span className="text-red-500">*</span>
                </label>
                <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                    <option value="">Select type</option>
                    {documentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Description */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                </label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Brief description of the document"
                />
            </div>

            {/* Selected File Preview */}
            {file && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            onClick={() => setFile(null)}
                            className="text-red-600 hover:text-red-700 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={!file || !documentType || uploading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {uploading ? 'Uploading...' : 'Upload File'}
            </button>
        </div>
    );
}
