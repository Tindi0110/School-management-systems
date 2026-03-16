import Skeleton from '../../components/common/Skeleton';

export const LibraryStatsSkeleton = () => (
    <div className="grid grid-cols-2 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <Skeleton variant="text" width="60%" className="mb-2" />
                <Skeleton variant="rect" height="32px" width="40%" className="rounded-lg" />
            </div>
        ))}
    </div>
);

export const LibraryTableSkeleton = ({ cols = 5 }: { cols?: number }) => (
    <div className="table-wrapper shadow-md">
        <table className="table">
            <thead>
                <tr>
                    {Array(cols).fill(0).map((_, i) => (
                        <th key={i}><Skeleton variant="text" width="80px" /></th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                        {Array(cols).fill(0).map((_, j) => (
                            <td key={j}>
                                {j === 0 ? (
                                    <div className="flex items-center gap-3">
                                        <Skeleton variant="circle" width="32px" height="32px" />
                                        <Skeleton variant="text" width="100px" />
                                    </div>
                                ) : (
                                    <Skeleton variant="text" width="100%" />
                                )}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const LibraryCatalogSkeleton = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
            <Skeleton variant="text" width="200px" height="32px" />
            <Skeleton variant="rect" width="120px" height="40px" className="rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card p-6 border-2 border-slate-50 shadow-sm rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-2/3"><Skeleton variant="text" width="100%" height="24px" /></div>
                        <Skeleton variant="circle" width="32px" height="32px" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" />
                    </div>
                    <div className="flex gap-2 mt-6 pt-4 border-t">
                        <Skeleton variant="rect" width="100%" height="36px" className="rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);
