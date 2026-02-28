import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import PremiumDateInput from '../../components/PremiumDateInput';
import SearchableSelect from '../../components/SearchableSelect';

interface TransportModalsProps {
    modals: {
        isAllocationModalOpen: boolean;
        isVehicleModalOpen: boolean;
        isRouteModalOpen: boolean;
        isPointModalOpen: boolean;
        isTripModalOpen: boolean;
        isMaintenanceModalOpen: boolean;
        isSafetyModalOpen: boolean;
        isFuelModalOpen: boolean;
    };
    forms: {
        enrollmentForm: any;
        vehicleForm: any;
        routeForm: any;
        pointForm: any;
        tripForm: any;
        maintenanceForm: any;
        safetyForm: any;
        fuelForm: any;
    };
    data: {
        studentOptions: any[];
        routeOptions: any[];
        pickupPoints: any[];
        vehicles: any[];
        routes: any[];
    };
    handlers: {
        setIsAllocationModalOpen: (val: boolean) => void;
        setIsVehicleModalOpen: (val: boolean) => void;
        setIsRouteModalOpen: (val: boolean) => void;
        setIsPointModalOpen: (val: boolean) => void;
        setIsTripModalOpen: (val: boolean) => void;
        setIsMaintenanceModalOpen: (val: boolean) => void;
        setIsSafetyModalOpen: (val: boolean) => void;
        setIsFuelModalOpen: (val: boolean) => void;
        setEnrollmentForm: (val: any) => void;
        setVehicleForm: (val: any) => void;
        setRouteForm: (val: any) => void;
        setPointForm: (val: any) => void;
        setTripForm: (val: any) => void;
        setMaintenanceForm: (val: any) => void;
        setSafetyForm: (val: any) => void;
        setFuelForm: (val: any) => void;
        handleEnrollmentSubmit: (e: React.FormEvent) => void;
        handleVehicleSubmit: (e: React.FormEvent) => void;
        handleRouteSubmit: (e: React.FormEvent) => void;
        handlePointSubmit: (e: React.FormEvent) => void;
        handleTripSubmit: (e: React.FormEvent) => void;
        handleMaintenanceSubmit: (e: React.FormEvent) => void;
        handleSafetySubmit: (e: React.FormEvent) => void;
        handleFuelSubmit: (e: React.FormEvent) => void;
    };
    status: {
        isSaving: boolean;
        enrollmentId: number | null;
        vehicleId: number | null;
        routeId: number | null;
        pointId: number | null;
        tripId: number | null;
        maintenanceId: number | null;
        incidentId: number | null;
    };
}

const TransportModals: React.FC<TransportModalsProps> = ({ modals, forms, data, handlers, status }) => {
    return (
        <>
            <Modal isOpen={modals.isAllocationModalOpen} onClose={() => handlers.setIsAllocationModalOpen(false)} title={status.enrollmentId ? "Edit Enrollment" : "New Transport Enrollment"}>
                <form onSubmit={handlers.handleEnrollmentSubmit} className="space-y-4">
                    <SearchableSelect label="Select Student *" options={data.studentOptions} value={forms.enrollmentForm.student} onChange={(val) => handlers.setEnrollmentForm({ ...forms.enrollmentForm, student: val.toString() })} required />
                    <SearchableSelect label="Assign Route *" options={data.routeOptions} value={forms.enrollmentForm.route} onChange={(val) => handlers.setEnrollmentForm({ ...forms.enrollmentForm, route: val.toString() })} required />
                    <SearchableSelect
                        label="Pickup Point *"
                        placeholder="Select from route points..."
                        options={data.pickupPoints.filter(p => p.route === Number(forms.enrollmentForm.route)).map(p => ({ id: p.id.toString(), label: p.point_name, subLabel: `(${p.pickup_time})` }))}
                        value={forms.enrollmentForm.pickup_point}
                        onChange={(val) => handlers.setEnrollmentForm({ ...forms.enrollmentForm, pickup_point: val.toString() })}
                        required
                    />
                    <div className="form-group pb-2">
                        <PremiumDateInput
                            label="Start Date"
                            value={forms.enrollmentForm.start_date}
                            onChange={(val) => handlers.setEnrollmentForm({ ...forms.enrollmentForm, start_date: val })}
                            required
                        />
                    </div>
                    <div className="modal-footer"><Button type="submit" variant="primary" className="w-full" loading={status.isSaving} loadingText={status.enrollmentId ? "Updating..." : "Enrolling..."}>{status.enrollmentId ? "Update Enrollment" : "Confirm Enrollment"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={modals.isVehicleModalOpen} onClose={() => handlers.setIsVehicleModalOpen(false)} title="Fleet Management" size="md">
                <form onSubmit={handlers.handleVehicleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Registration No.</label><input type="text" className="input uppercase" value={forms.vehicleForm.registration_number} onChange={e => handlers.setVehicleForm({ ...forms.vehicleForm, registration_number: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Make / Model</label><input type="text" className="input" value={forms.vehicleForm.make_model} onChange={e => handlers.setVehicleForm({ ...forms.vehicleForm, make_model: e.target.value })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Type</label>
                            <SearchableSelect
                                options={[
                                    { id: 'BUS', label: 'Bus' },
                                    { id: 'VAN', label: 'Van' },
                                    { id: 'MINIBUS', label: 'Minibus' },
                                    { id: 'OTHER', label: 'Other' }
                                ]}
                                value={forms.vehicleForm.vehicle_type}
                                onChange={(val) => handlers.setVehicleForm({ ...forms.vehicleForm, vehicle_type: val.toString() })}
                            />
                        </div>
                        <div className="form-group"><label className="label">Capacity</label><input type="number" className="input" value={forms.vehicleForm.seating_capacity} onChange={e => handlers.setVehicleForm({ ...forms.vehicleForm, seating_capacity: parseInt(e.target.value) })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="label">Status</label>
                            <SearchableSelect
                                options={[
                                    { id: 'ACTIVE', label: 'Active / Operational' },
                                    { id: 'MAINTENANCE', label: 'In Maintenance' },
                                    { id: 'SUSPENDED', label: 'Suspended / Grounded' }
                                ]}
                                value={forms.vehicleForm.status}
                                onChange={(val) => handlers.setVehicleForm({ ...forms.vehicleForm, status: val.toString() })}
                            />
                        </div>
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Insurance Expiry"
                                value={forms.vehicleForm.insurance_expiry}
                                onChange={(val) => handlers.setVehicleForm({ ...forms.vehicleForm, insurance_expiry: val })}
                            />
                        </div>
                    </div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full uppercase font-black" loading={status.isSaving} loadingText={status.vehicleId ? "Updating..." : "Registering..."}>{status.vehicleId ? 'Update Vehicle' : 'Register Vehicle'}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={modals.isRouteModalOpen} onClose={() => handlers.setIsRouteModalOpen(false)} title={status.routeId ? "Edit Route" : "New Geographic Route"}>
                <form onSubmit={handlers.handleRouteSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Route Code</label><input type="text" className="input uppercase" placeholder="e.g. RT-001" value={forms.routeForm.route_code} onChange={e => handlers.setRouteForm({ ...forms.routeForm, route_code: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Distance (KM)</label><input type="number" step="0.1" className="input" value={forms.routeForm.distance_km} onChange={e => handlers.setRouteForm({ ...forms.routeForm, distance_km: parseFloat(e.target.value) })} required /></div>
                    </div>
                    <div className="form-group"><label className="label">Route Name / Destination</label><input type="text" className="input" placeholder="e.g. Westlands via Waiyaki Way" value={forms.routeForm.name} onChange={e => handlers.setRouteForm({ ...forms.routeForm, name: e.target.value })} required /></div>
                    <div className="form-group"><label className="label">Base Fee (KES)</label><input type="number" className="input" value={forms.routeForm.base_cost} onChange={e => handlers.setRouteForm({ ...forms.routeForm, base_cost: parseFloat(e.target.value) })} required /></div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full uppercase font-black" loading={status.isSaving} loadingText={status.routeId ? "Updating..." : "Mapping..."}>{status.routeId ? "Update Route" : "Map Route"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={modals.isPointModalOpen} onClose={() => handlers.setIsPointModalOpen(false)} title={status.pointId ? "Edit Service Point" : "Add Service Point"}>
                <form onSubmit={handlers.handlePointSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Point Name / Landmark</label><input type="text" className="input" placeholder="e.g. Shell Station, Westlands" value={forms.pointForm.point_name} onChange={e => handlers.setPointForm({ ...forms.pointForm, point_name: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Pickup Time</label><input type="time" className="input" value={forms.pointForm.pickup_time} onChange={e => handlers.setPointForm({ ...forms.pointForm, pickup_time: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Drop-off Time</label><input type="time" className="input" value={forms.pointForm.dropoff_time} onChange={e => handlers.setPointForm({ ...forms.pointForm, dropoff_time: e.target.value })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-secondary-light p-4 rounded-lg">
                        <div className="form-group"><label className="label">Dist. from School (KM)</label><input type="number" step="0.01" className="input" value={forms.pointForm.distance_from_school} onChange={e => handlers.setPointForm({ ...forms.pointForm, distance_from_school: parseFloat(e.target.value) })} required /></div>
                        <div className="form-group"><label className="label">Fee (Auto-Calc)</label><input type="number" step="0.01" className="input" placeholder="0 = Auto" value={forms.pointForm.additional_cost} onChange={e => handlers.setPointForm({ ...forms.pointForm, additional_cost: parseFloat(e.target.value) })} /></div>
                    </div>
                    <p className="text-xs text-secondary mt-2">* Fee is automatically calculated based on distance if left as 0.</p>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full uppercase font-black" loading={status.isSaving} loadingText={status.pointId ? "Updating..." : "Adding..."}>
                            {status.pointId ? "Update Point" : "Add Point"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={modals.isTripModalOpen} onClose={() => handlers.setIsTripModalOpen(false)} title={status.tripId ? "Edit Trip Log" : "Log New Trip"}>
                <form onSubmit={handlers.handleTripSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Date"
                                value={forms.tripForm.date}
                                onChange={(val) => handlers.setTripForm({ ...forms.tripForm, date: val })}
                                required
                            />
                        </div>
                        <div className="form-group"><label className="label">Driver Name</label><input type="text" className="input" value={forms.tripForm.driver_name} onChange={e => handlers.setTripForm({ ...forms.tripForm, driver_name: e.target.value })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <SearchableSelect label="Route" options={data.routeOptions} value={String(forms.tripForm.route)} onChange={(val) => handlers.setTripForm({ ...forms.tripForm, route: val.toString() })} required />
                        <SearchableSelect
                            label="Vehicle"
                            placeholder="Select Vehicle..."
                            options={data.vehicles.map(v => ({ id: v.id.toString(), label: v.registration_number }))}
                            value={String(forms.tripForm.vehicle)}
                            onChange={(val) => handlers.setTripForm({ ...forms.tripForm, vehicle: val.toString() })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-secondary-light p-4 rounded text-sm">
                        <div className="form-group"><label className="label">Start Time</label><input type="time" className="input" value={forms.tripForm.start_time} onChange={e => handlers.setTripForm({ ...forms.tripForm, start_time: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">End Time</label><input type="time" className="input" value={forms.tripForm.end_time} onChange={e => handlers.setTripForm({ ...forms.tripForm, end_time: e.target.value })} required /></div>
                    </div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full" loading={status.isSaving} loadingText={status.tripId ? "Updating..." : "Saving..."}>{status.tripId ? "Update Trip Log" : "Save Trip Log"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={modals.isMaintenanceModalOpen} onClose={() => handlers.setIsMaintenanceModalOpen(false)} title={status.maintenanceId ? "Edit Maintenance Record" : "Log Maintenance"}>
                <form onSubmit={handlers.handleMaintenanceSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Date"
                                value={forms.maintenanceForm.date}
                                onChange={(val) => handlers.setMaintenanceForm({ ...forms.maintenanceForm, date: val })}
                                required
                            />
                        </div>
                        <div className="form-group"><label className="label">Cost (KES)</label><input type="number" className="input" value={forms.maintenanceForm.cost} onChange={e => handlers.setMaintenanceForm({ ...forms.maintenanceForm, cost: parseFloat(e.target.value) })} required /></div>
                    </div>
                    <SearchableSelect
                        label="Affected Vehicle"
                        placeholder="Select Vehicle..."
                        options={data.vehicles.map(v => ({ id: v.id.toString(), label: v.registration_number }))}
                        value={String(forms.maintenanceForm.vehicle)}
                        onChange={(val) => handlers.setMaintenanceForm({ ...forms.maintenanceForm, vehicle: val.toString() })}
                        required
                    />
                    <div className="form-group"><label className="label">Issue / Service Description</label><textarea className="input" rows={3} value={forms.maintenanceForm.description} onChange={e => handlers.setMaintenanceForm({ ...forms.maintenanceForm, description: e.target.value })} required></textarea></div>
                    <div className="form-group">
                        <label className="label">Status</label>
                        <SearchableSelect
                            options={[
                                { id: 'PENDING', label: 'Pending Approval' },
                                { id: 'IN_PROGRESS', label: 'In Progress' },
                                { id: 'COMPLETED', label: 'Completed' }
                            ]}
                            value={forms.maintenanceForm.status}
                            onChange={(val) => handlers.setMaintenanceForm({ ...forms.maintenanceForm, status: val.toString() })}
                        />
                    </div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full" loading={status.isSaving} loadingText={status.maintenanceId ? "Updating..." : "Logging..."}>{status.maintenanceId ? "Update Maintenance" : "Log Maintenance"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={modals.isSafetyModalOpen} onClose={() => handlers.setIsSafetyModalOpen(false)} title={status.incidentId ? "Edit Incident Report" : "Report Safety Incident"}>
                <form onSubmit={handlers.handleSafetySubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Date"
                                value={forms.safetyForm.date}
                                onChange={(val) => handlers.setSafetyForm({ ...forms.safetyForm, date: val })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Severity</label>
                            <SearchableSelect
                                options={[
                                    { id: 'MINOR', label: 'Minor' },
                                    { id: 'MAJOR', label: 'Major' },
                                    { id: 'CRITICAL', label: 'Critical' }
                                ]}
                                value={forms.safetyForm.severity}
                                onChange={(val) => handlers.setSafetyForm({ ...forms.safetyForm, severity: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <SearchableSelect
                            label="Vehicle Involved"
                            placeholder="Select Vehicle..."
                            options={data.vehicles.map(v => ({ id: v.id.toString(), label: v.registration_number }))}
                            value={String(forms.safetyForm.vehicle)}
                            onChange={(val) => handlers.setSafetyForm({ ...forms.safetyForm, vehicle: val.toString() })}
                            required
                        />
                        <div className="form-group">
                            <label className="label">Type</label>
                            <SearchableSelect
                                options={[
                                    { id: 'ACCIDENT', label: 'Accident' },
                                    { id: 'BREAKDOWN', label: 'Breakdown' },
                                    { id: 'VIOLATION', label: 'Traffic Violation' },
                                    { id: 'COMPLAINT', label: 'Parent Complaint' }
                                ]}
                                value={forms.safetyForm.type}
                                onChange={(val) => handlers.setSafetyForm({ ...forms.safetyForm, type: val.toString() })}
                            />
                        </div>
                    </div>
                    <div className="form-group"><label className="label">Description of Incident</label><textarea className="input" rows={4} value={forms.safetyForm.description} onChange={e => handlers.setSafetyForm({ ...forms.safetyForm, description: e.target.value })} required></textarea></div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="danger" className="w-full" loading={status.isSaving} loadingText={status.incidentId ? "Updating..." : "Reporting..."}>{status.incidentId ? "Update Report" : "Submit Report"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={modals.isFuelModalOpen} onClose={() => handlers.setIsFuelModalOpen(false)} title="Log Fuel Consumption">
                <form onSubmit={handlers.handleFuelSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group pb-2">
                            <PremiumDateInput
                                label="Date"
                                value={forms.fuelForm.date}
                                onChange={(val) => handlers.setFuelForm({ ...forms.fuelForm, date: val })}
                                required
                            />
                        </div>
                        <SearchableSelect
                            label="Vehicle"
                            placeholder="Select Vehicle..."
                            options={data.vehicles.map(v => ({ id: v.id.toString(), label: v.registration_number }))}
                            value={String(forms.fuelForm.vehicle)}
                            onChange={(val) => handlers.setFuelForm({ ...forms.fuelForm, vehicle: val.toString() })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Liters</label><input type="number" step="0.01" className="input" value={forms.fuelForm.liters} onChange={e => handlers.setFuelForm({ ...forms.fuelForm, liters: parseFloat(e.target.value) })} required /></div>
                        <div className="form-group"><label className="label">Total Cost (KES)</label><input type="number" className="input" value={forms.fuelForm.amount} onChange={e => handlers.setFuelForm({ ...forms.fuelForm, amount: parseFloat(e.target.value) })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Mileage (Odometer)</label><input type="number" className="input" value={forms.fuelForm.mileage} onChange={e => handlers.setFuelForm({ ...forms.fuelForm, mileage: parseInt(e.target.value) })} required /></div>
                        <div className="form-group"><label className="label">Receipt No.</label><input type="text" className="input" value={forms.fuelForm.receipt_no} onChange={e => handlers.setFuelForm({ ...forms.fuelForm, receipt_no: e.target.value })} /></div>
                    </div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full" loading={status.isSaving} loadingText="Saving...">Save & Sync to Finance</Button></div>
                </form>
            </Modal>
        </>
    );
};

export default TransportModals;
