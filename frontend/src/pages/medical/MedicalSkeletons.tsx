import Skeleton from '../../components/common/Skeleton';

export const MedicalStatsSkeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-8 no-print">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <Skeleton variant="text" width="60%" className="mb-2" />
                <Skeleton variant="rect" height="32px" width="40%" className="rounded-lg" />
            </div>
        ))}
    </div>
);

export const MedicalTableSkeleton = () => (
    <div className="table-wrapper shadow-md no-print">
        <table className="table">
            <thead>
                <tr>
                    <th>Visit Date</th>
                    <th>Student</th>
                    <th>Diagnosis</th>
                    <th>Treatment</th>
                    <th>Medical Personnel</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                        <td><Skeleton variant="text" width="100px" /></td>
                        <td>
                            <div className="flex items-center gap-md">
                                <Skeleton variant="circle" width="32px" height="32px" />
                                <Skeleton variant="text" width="120px" />
                            </div>
                        </td>
                        <td><Skeleton variant="rect" width="100px" height="22px" className="rounded-md" /></td>
                        <td><Skeleton variant="text" width="150px" /></td>
                        <td><Skeleton variant="text" width="100px" /></td>
                        <td><Skeleton variant="rect" width="80px" height="32px" className="rounded-lg" /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
