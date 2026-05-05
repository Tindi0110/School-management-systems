import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';

interface FeeManagerProps {
    filteredFees: any[];
    isReadOnly: boolean;
    setShowFeeModal: (val: boolean) => void;
    handleEditFee: (fee: any) => void;
    handleDeleteFee: (id: number) => void;
    totalItems: number;
    page: number;
    setPage: (page: number | ((p: number) => number)) => void;
    pageSize: number;
}

const FeeManager: React.FC<FeeManagerProps> = ({
    filteredFees,
    isReadOnly,
    setShowFeeModal,
    handleEditFee,
    handleDeleteFee,
    totalItems,
    page,
    setPage,
    pageSize
}) => {
    return (
        <div className="card shadow-sm border border-slate-200">
            <div className="flex justify-between mb-4">
                <h3 className="text-lg font-bold">Fee Structures</h3>
                {!isReadOnly && (
                    <Button variant="secondary" size="sm" onClick={() => setShowFeeModal(true)} icon={<Plus size={16} />}>
                        Add New Fee
                    </Button>
                )}
            </div>
            <div className="table-wrapper">
                <table className="table min-w-[700px]">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Class Level</th>
                            <th>Term</th>
                            <th>Amount</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFees.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-10 text-slate-400 italic">No fee structures match your search</td></tr>
                        ) : (
                            filteredFees.map((fee: any) => (
                                <tr key={fee.id} className="hover:bg-slate-50/50">
                                    <td className="font-bold">{fee.name}</td>
                                    <td>{fee.class_level_name || 'All Levels'}</td>
                                    <td>Term {fee.term} ({fee.academic_year_name})</td>
                                    <td className="font-bold">KES {Number(fee.amount).toLocaleString()}</td>
                                    <td className="text-right">
                                        {!isReadOnly && (
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditFee(fee)} icon={<Edit size={14} />} />
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteFee(fee.id)} icon={<Trash2 size={14} className="text-red-500" />} />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center mt-4 no-print px-2">
                <div className="text-xs text-secondary font-medium">
                    Showing <span className="text-primary font-bold">{filteredFees.length}</span> of <span className="text-primary font-bold">{totalItems}</span> fee structures
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <div className="flex items-center px-4 text-xs font-bold bg-slate-100 rounded-lg">Page {page}</div>
                    <Button variant="outline" size="sm" onClick={() => setPage((p: number) => p + 1)} disabled={filteredFees.length < pageSize}>Next</Button>
                </div>
            </div>
        </div>
    );
};

export default FeeManager;
