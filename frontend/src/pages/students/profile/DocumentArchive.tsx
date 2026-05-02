import React from 'react';
import { FilePlus, FileText, Trash2, ExternalLink, Calendar } from 'lucide-react';
import Button from '../../../components/common/Button';
import type { StudentDocument } from '../../../types/student.types';

interface DocumentArchiveProps {
    documents: StudentDocument[];
    onAttachFile: () => void;
    onDeleteDocument: (id: number) => void;
}

const DocumentArchive: React.FC<DocumentArchiveProps> = ({ documents, onAttachFile, onDeleteDocument }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="text-primary" size={18} />
                    </div>
                    <div>
                        <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Institutional Repository</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Digital Document Archive</p>
                    </div>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    className="font-black shadow-lg"
                    onClick={onAttachFile}
                    icon={<FilePlus size={14} />}
                >
                    ATTACH FILE
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Document Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">File Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date Uploaded</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <p className="text-secondary italic text-xs uppercase font-bold opacity-40">No documents archived for this student</p>
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="text-[11px] font-black uppercase text-primary tracking-tight">
                                                    {doc.doc_type?.replace('_', ' ') || 'OTHER'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">
                                                    {doc.file.split('/').pop()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-bold">
                                                    {new Date(doc.uploaded_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <a 
                                                    href={doc.file} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-tight"
                                                    title="Open Document"
                                                >
                                                    <ExternalLink size={14} />
                                                    OPEN
                                                </a>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-2 text-error hover:bg-error/10"
                                                    onClick={() => onDeleteDocument(doc.id)}
                                                    icon={<Trash2 size={14} />}
                                                    title="Delete"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DocumentArchive;
