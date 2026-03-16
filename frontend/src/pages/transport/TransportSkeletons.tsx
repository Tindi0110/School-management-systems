                <div className="flex justify-between items-start mb-4">
                    <div className="w-2/3"><Skeleton variant="text" width="100%" height="24px" /></div>
                    <Skeleton variant="circle" width="32px" height="32px" />
                </div>
                <div className="space-y-3">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                </div>
                <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Skeleton variant="rect" width="100%" height="32px" className="rounded-lg" />
                </div>
            </div>
        ))}
    </div>
);

export const TableSkeleton = ({ cols }: { cols: number }) => (
    <div className="table-wrapper">
        <table className="table">
            <thead>
                <tr>{Array(cols).fill(0).map((_, i) => <th key={i}><Skeleton variant="text" width="80px" /></th>)}</tr>
            </thead>
            <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                        {Array(cols).fill(0).map((_, j) => <td key={j}><Skeleton variant="text" width="100%" /></td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
