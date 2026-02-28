import React from 'react';
import { FilePlus, FileText, Trash2 } from 'lucide-react';
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
                <h3 className="mb-0 text-xs font-black uppercase tracking-widest text-secondary">Institutional Repository</h3>
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.length === 0 ? (
                    <p className="text-secondary italic text-xs uppercase font-bold text-center py-8 col-span-3 opacity-40">No documents archived</p>
                ) : (
                    documents.map((doc, i) => (
                        <div key={i} className="card flex flex-col items-center text-center p-6 border-dashed border-2 hover:border-primary transition-colors cursor-pointer group relative card-mobile-flat">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
                                icon={<Trash2 size={14} />}
                            />
                            <div className="w-12 h-12 rounded-full bg-secondary-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="text-primary" size={24} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">{doc.doc_type || 'DOCUMENT'}</h4>
                            <p className="text-[9px] text-secondary font-bold mb-0 truncate w-full opacity-60 px-2">{doc.file.split('/').pop()}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DocumentArchive;
