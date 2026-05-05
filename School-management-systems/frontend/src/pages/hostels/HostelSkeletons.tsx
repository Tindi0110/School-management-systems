import Skeleton from '../../components/common/Skeleton';

export const HostelStatsSkeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-8">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <Skeleton variant="text" width="60%" className="mb-2" />
                <Skeleton variant="rect" height="32px" width="40%" className="rounded-lg" />
            </div>
        ))}
    </div>
);

export const HostelTableSkeleton = () => (
    <div className="table-wrapper shadow-sm">
        <table className="table">
            <thead>
                <tr>
                    <th className="w-1/3">Identity</th>
                    <th>Placement</th>
                    <th>Status</th>
                    <th>Capacity</th>
                    <th className="no-print">Action</th>
                </tr>
            </thead>
            <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                        <td>
                            <div className="flex items-center gap-3">
                                <Skeleton variant="circle" width="40px" height="40px" />
                                <div className="flex flex-col gap-1 flex-1">
                                    <Skeleton variant="text" width="120px" />
                                    <Skeleton variant="text" width="80px" />
                                </div>
                            </div>
                        </td>
                        <td><Skeleton variant="text" width="100px" /><Skeleton variant="text" width="60px" /></td>
                        <td><Skeleton variant="rect" width="60px" height="20px" className="rounded-md" /></td>
                        <td><Skeleton variant="text" width="50px" /></td>
                        <td><Skeleton variant="rect" width="100px" height="30px" className="rounded-lg" /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
