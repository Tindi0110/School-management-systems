import Skeleton from '../../components/common/Skeleton';

export const StaffTableSkeleton = () => (
    <div className="space-y-8 no-print">
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        <th>Staff Member</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Date Joined</th>
                        <th>Actions</th>
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
