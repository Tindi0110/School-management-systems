import Skeleton from '../../components/common/Skeleton';

export const StaffTableSkeleton = () => (
    <div className="space-y-8 no-print">
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr className="bg-slate-50 border-bottom">
                        <th className="p-4 text-[10px] font-black uppercase text-secondary tracking-[0.15em]">Staff Member</th>
                        <th className="p-4 text-[10px] font-black uppercase text-secondary tracking-[0.15em]">Department</th>
                        <th className="p-4 text-[10px] font-black uppercase text-secondary tracking-[0.15em]">Role</th>
                        <th className="p-4 text-[10px] font-black uppercase text-secondary tracking-[0.15em]">Date Joined</th>
                        <th className="p-4 text-[10px] font-black uppercase text-secondary tracking-[0.15em] no-print">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4, 10].map(i => (
                        <tr key={i}>
                            <td>
                                <div className="flex flex-col gap-2">
                                    <Skeleton variant="text" width="160px" />
                                    <Skeleton variant="text" width="90px" />
                                </div>
                            </td>
                            <td><Skeleton variant="text" width="100px" /></td>
                            <td><Skeleton variant="rect" width="80px" height="22px" className="rounded-md" /></td>
                            <td><Skeleton variant="text" width="120px" /></td>
                            <td><Skeleton variant="rect" width="80px" height="32px" className="rounded-lg" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);
