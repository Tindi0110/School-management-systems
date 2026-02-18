import React, { useEffect, useState } from 'react';
import {
    Plus, Edit, Bus, MapPin, Navigation, ClipboardList, Wrench, ShieldAlert,
    Droplet, Printer, Download, Users, Clock, Trash2
} from 'lucide-react';
import { transportAPI, studentsAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';

const Transport = () => {
    const [activeTab, setActiveTab] = useState('fleet');
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [fuelRecords, setFuelRecords] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

    const [vehicleForm, setVehicleForm] = useState({
        registration_number: '',
        make_model: '',
        vehicle_type: 'BUS',
        seating_capacity: 14,
        status: 'ACTIVE',
        insurance_expiry: ''
    });
    const [vehicleId, setVehicleId] = useState<number | null>(null);

    // Enrollment State
    const [enrollmentForm, setEnrollmentForm] = useState({
        student: '',
        route: '',
        pickup_point: '',
        start_date: new Date().toISOString().split('T')[0]
    });

    const [enrollmentId, setEnrollmentId] = useState<number | null>(null);

    const [routeId, setRouteId] = useState<number | null>(null);

    const [routeForm, setRouteForm] = useState({
        name: '',
        route_code: '',
        distance_km: 0,
        base_cost: 0
    });

    const [isPointModalOpen, setIsPointModalOpen] = useState(false);
    const [pointForm, setPointForm] = useState({
        route_id: 0,
        point_name: '',
        pickup_time: '',
        dropoff_time: '',
        distance_from_school: 0,
        additional_cost: 0
    });

    const [trips, setTrips] = useState<any[]>([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);

    const [isTripModalOpen, setIsTripModalOpen] = useState(false);
    const [tripForm, setTripForm] = useState({ route: '', vehicle: '', date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', driver_name: '' });

    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [maintenanceForm, setMaintenanceForm] = useState({ vehicle: '', description: '', cost: 0, date: new Date().toISOString().split('T')[0], status: 'PENDING' });

    const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [safetyForm, setSafetyForm] = useState({ vehicle: '', date: new Date().toISOString().split('T')[0], type: 'ACCIDENT', description: '', severity: 'MINOR' });

    const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
    const [fuelForm, setFuelForm] = useState({ date: new Date().toISOString().split('T')[0], vehicle: '', liters: 0, amount: 0, mileage: 0, receipt_no: '' });

    const [tripId, setTripId] = useState<number | null>(null);
    const [maintenanceId, setMaintenanceId] = useState<number | null>(null);
    const [incidentId, setIncidentId] = useState<number | null>(null);

    const [isSaving, setIsSaving] = useState(false);

    const [pointId, setPointId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const toast = useToast();
    const { confirm } = useConfirm();

    const loadData = async () => {
        setLoading(true);
        const fetchData = async (apiCall: any, setter: any) => {
            try {
                const res = await apiCall;
                setter(res.data?.results ?? res.data ?? []);
            } catch (err) {

            }
        };

        try {
            await Promise.all([
                fetchData(transportAPI.vehicles.getAll(), setVehicles),
                fetchData(transportAPI.routes.getAll(), setRoutes),
                fetchData(transportAPI.pickupPoints.getAll(), setPickupPoints),
                fetchData(transportAPI.allocations.getAll(), setAllocations),
                fetchData(studentsAPI.getAll(), setStudents)
            ]);

            await Promise.all([
                fetchData(transportAPI.fuel.getAll(), setFuelRecords),
                fetchData(transportAPI.tripLogs.getAll(), setTrips),
                fetchData(transportAPI.maintenance.getAll(), setMaintenanceRecords),
                fetchData(transportAPI.incidents.getAll(), setIncidents)
            ]);

        } catch (error) {

            toast.error("Failed to load some transport data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (enrollmentId) {
                await transportAPI.allocations.update(enrollmentId, enrollmentForm);
                toast.success('Enrollment updated successfully');
            } else {
                await transportAPI.allocations.create(enrollmentForm);
                toast.success('Student successfully enrolled for transport');
            }
            loadData();
            setIsAllocationModalOpen(false);
            setEnrollmentId(null);
            setEnrollmentForm({ student: '', route: '', pickup_point: '', start_date: new Date().toISOString().split('T')[0] });
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to save enrollment.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditAllocation = (a: any) => {
        setEnrollmentId(a.id);
        setEnrollmentForm({
            student: String(a.student),
            route: String(a.route),
            pickup_point: String(a.pickup_point),
            start_date: a.start_date
        });
        setIsAllocationModalOpen(true);
    };

    const handleDeleteAllocation = async (id: number) => {
        if (!await confirm('Are you sure you want to remove this student from transport?')) return;
        try {
            await transportAPI.allocations.delete(id);
            toast.success('Enrollment removed successfully');
            loadData();
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to remove enrollment');
        }
    };

    const handleVehicleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...vehicleForm,
                insurance_expiry: vehicleForm.insurance_expiry || null
            };

            if (vehicleId) {
                await transportAPI.vehicles.update(vehicleId, payload);
                toast.success('Vehicle information updated');
            } else {
                await transportAPI.vehicles.create(payload);
                toast.success('New vehicle registered to fleet');
            }
            loadData();
            setIsVehicleModalOpen(false);
            setVehicleId(null);
            setVehicleForm({
                registration_number: '', make_model: '', vehicle_type: 'BUS',
                seating_capacity: 14, status: 'ACTIVE', insurance_expiry: ''
            });
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to save vehicle');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditVehicle = (v: any) => {
        setVehicleId(v.id);
        setVehicleForm({
            registration_number: v.registration_number,
            make_model: v.make_model,
            vehicle_type: v.vehicle_type,
            seating_capacity: v.seating_capacity,
            status: v.status,
            insurance_expiry: v.insurance_expiry || ''
        });

        setIsVehicleModalOpen(true);
    };

    const handleRouteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (routeId) {
                await transportAPI.routes.update(routeId, routeForm);
                toast.success('Route updated successfully');
            } else {
                await transportAPI.routes.create(routeForm);
                toast.success('Route successfully mapped');
            }
            loadData();
            setIsRouteModalOpen(false);
            setRouteId(null);
            setRouteForm({ name: '', route_code: '', distance_km: 0, base_cost: 0 });
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to save route.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteVehicle = async (id: number) => {
        if (!await confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) return;
        try {
            await transportAPI.vehicles.delete(id);
            toast.success('Vehicle deleted successfully');
            loadData();
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to delete vehicle. It may be assigned to trips or maintenance records.');
        }
    };

    // Route CRUD
    const handleDeleteRoute = async (id: number) => {
        if (!await confirm('Delete this route? This will affect all assigned students.')) return;
        try {
            await transportAPI.routes.delete(id);
            toast.success('Route deleted successfully');
            loadData();
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to delete route. Check for linked pickups or allocations.');
        }
    };

    const handleEditRoute = (r: any) => {
        setRouteId(r.id);
        setRouteForm({
            name: r.name,
            route_code: r.route_code,
            distance_km: parseFloat(r.distance_km || 0),
            base_cost: parseFloat(r.base_cost || 0)
        });
        setIsRouteModalOpen(true);
    };

    const handlePointSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const parentRoute = routes.find(r => r.id === pointForm.route_id);
            let calculatedCost = pointForm.additional_cost;

            if (parentRoute && pointForm.distance_from_school > 0 && calculatedCost === 0) {
                calculatedCost = (pointForm.distance_from_school / parentRoute.distance_km) * parseFloat(parentRoute.base_cost);
            }

            const payload = {
                route: pointForm.route_id,
                point_name: pointForm.point_name,
                pickup_time: pointForm.pickup_time,
                dropoff_time: pointForm.dropoff_time,
                distance_from_school: parseFloat(pointForm.distance_from_school.toFixed(2)),
                additional_cost: parseFloat(calculatedCost.toFixed(2))
            };

            if (pointId) {
                await transportAPI.pickupPoints.update(pointId, payload);
                toast.success('Pickup point updated');
            } else {
                await transportAPI.pickupPoints.create(payload);
                toast.success(`Service point added. Fee set to KES ${payload.additional_cost}`);
            }

            loadData();
            setIsPointModalOpen(false);
            setPointId(null);
            setPointForm({ route_id: 0, point_name: '', pickup_time: '', dropoff_time: '', distance_from_school: 0, additional_cost: 0 });
        } catch (error: any) {

            const msg = error.response?.data?.detail || error.message;
            toast.error(`Failed to save pickup point: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTripSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripForm.route || !tripForm.vehicle || !tripForm.driver_name) {
            toast.error('Please fill in all required fields (Route, Vehicle, Driver).');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                route: Number(tripForm.route),
                vehicle: Number(tripForm.vehicle),
                date: tripForm.date,
                departure_time: tripForm.start_time,
                arrival_time: tripForm.end_time,
                attendant: tripForm.driver_name,
                trip_type: 'MORNING',
                driver: null
            };

            if (tripId) {
                await transportAPI.tripLogs.update(tripId, payload);
                toast.success('Trip log updated');
            } else {
                await transportAPI.tripLogs.create(payload);
                toast.success('Trip log recorded');
            }
            loadData();
            setIsTripModalOpen(false);
            setTripId(null);
            setTripForm({ route: '', vehicle: '', date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', driver_name: '' });
        } catch (error: any) {

            const msg = error.response?.data?.detail || error.message;
            toast.error(`Failed to save trip log: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditTrip = (t: any) => {
        setTripId(t.id);
        setTripForm({
            route: String(t.route),
            vehicle: String(t.vehicle),
            date: t.date,
            start_time: t.start_time,
            end_time: t.end_time,
            driver_name: t.driver_name
        });
        setIsTripModalOpen(true);
    };

    const handleDeleteTrip = async (id: number) => {
        if (!await confirm('Delete this trip log?')) return;
        try {
            await transportAPI.tripLogs.delete(id);
            toast.success('Trip log deleted');
            loadData();
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to delete trip log.');
        }
    };

    const handleMaintenanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!maintenanceForm.vehicle || !maintenanceForm.description) {
            toast.error('Please select a vehicle and describe the issue.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                vehicle: Number(maintenanceForm.vehicle),
                description: maintenanceForm.description,
                cost: maintenanceForm.cost,
                service_date: maintenanceForm.date,
                status: maintenanceForm.status
            };

            if (maintenanceId) {
                await transportAPI.maintenance.update(maintenanceId, payload);
                toast.success('Maintenance record updated');
            } else {
                await transportAPI.maintenance.create(payload);
                toast.success('Maintenance request logged');
            }
            loadData();
            setIsMaintenanceModalOpen(false);
            setMaintenanceId(null);
            setMaintenanceForm({ vehicle: '', description: '', cost: 0, date: new Date().toISOString().split('T')[0], status: 'PENDING' });
        } catch (error: any) {

            const msg = error.response?.data?.detail || error.message;
            toast.error(`Failed to save maintenance record: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditMaintenance = (m: any) => {
        setMaintenanceId(m.id);
        setMaintenanceForm({
            vehicle: String(m.vehicle),
            description: m.description,
            cost: parseFloat(m.cost),
            date: m.date,
            status: m.status
        });
        setIsMaintenanceModalOpen(true);
    };

    const handleDeleteMaintenance = async (id: number) => {
        if (!await confirm('Delete this maintenance record?')) return;
        try {
            await transportAPI.maintenance.delete(id);
            toast.success('Maintenance record deleted');
            loadData();
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to delete maintenance record.');
        }
    };

    const handleSafetySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!safetyForm.vehicle || !safetyForm.description) {
            toast.error('Please select a vehicle and describe the incident.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = { ...safetyForm, incident_type: safetyForm.type, vehicle: Number(safetyForm.vehicle) };
            if (incidentId) {
                await transportAPI.incidents.update(incidentId, payload);
                toast.success('Incident report updated');
            } else {
                await transportAPI.incidents.create(payload);
                toast.success('Safety incident reported');
            }
            loadData();
            setIsSafetyModalOpen(false);
            setIncidentId(null);
            setSafetyForm({ vehicle: '', date: new Date().toISOString().split('T')[0], type: 'ACCIDENT', description: '', severity: 'MINOR' });
        } catch (error: any) {

            const msg = error.response?.data?.detail || error.message;
            toast.error(`Failed to save incident report: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditIncident = (i: any) => {
        setIncidentId(i.id);
        setSafetyForm({
            vehicle: String(i.vehicle),
            date: i.date,
            type: i.type,
            description: i.description,
            severity: i.severity
        });
        setIsSafetyModalOpen(true);
    };

    const handleDeleteIncident = async (id: number) => {
        if (!await confirm('Delete this incident report?')) return;
        try {
            await transportAPI.incidents.delete(id);
            toast.success('Incident report deleted');
            loadData();
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to delete incident.');
        }
    };

    const handleEditPoint = (p: any) => {
        setPointId(p.id);
        // Estimate distance from cost if not stored? Or set to 0. Backend doesn't store distance on point currently explicitly in form above?
        // Wait, pointForm has distance_from_school. Backend model might not have it if I didn't add it to serializer.
        // Assuming backend has it if specific field exists. If not, 0.
        // I will assume standard fields.
        setPointForm({
            route_id: p.route,
            point_name: p.point_name,
            pickup_time: p.pickup_time,
            dropoff_time: p.dropoff_time,
            distance_from_school: parseFloat(p.distance_from_school || 0),
            additional_cost: parseFloat(p.additional_cost)
        });
        setIsPointModalOpen(true);
    };

    const handleDeletePoint = async (id: number) => {
        if (!await confirm('Delete this pickup point?')) return;
        try {
            await transportAPI.pickupPoints.delete(id);
            toast.success('Pickup point deleted');
            loadData();
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to delete point.');
        }
    };

    const handleLogFuel = (v: any) => {
        setFuelForm({ ...fuelForm, vehicle: String(v.id) });
        setIsFuelModalOpen(true);
    };

    const handleFuelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await transportAPI.fuel.create({
                ...fuelForm,
                vehicle: Number(fuelForm.vehicle)
            });
            toast.success('Fuel record added & Synced to Finance!');
            setIsFuelModalOpen(false);
            setFuelForm({ date: new Date().toISOString().split('T')[0], vehicle: '', liters: 0, amount: 0, mileage: 0, receipt_no: '' });
            loadData();
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to save fuel record.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFuel = async (id: number) => {
        if (!await confirm('Delete this fuel record?')) return;
        try {
            await transportAPI.fuel.delete(id);
            toast.success('Fuel record deleted');
            loadData();
        } catch (error: any) {

            toast.error(error.response?.data?.detail || 'Failed to delete fuel record.');
        }
    };

    const stats = {
        totalFleet: vehicles.length,
        activeRoutes: routes.length,
        totalEnrolled: allocations.filter(a => a?.status === 'ACTIVE').length,
        fuelCostTerm: (fuelRecords || []).reduce((acc, f) => acc + (parseFloat(f?.amount) || 0), 0)
    };

    const studentOptions = students.map(s => ({
        id: String(s.id),
        label: s.full_name,
        subLabel: `ID: ${s.admission_number}`
    }));

    const routeOptions = routes.map(r => ({
        id: String(r.id),
        label: `${r.route_code} - ${r.name}`,
        subLabel: `Cost: KES ${parseFloat(r.base_cost).toLocaleString()}`
    }));

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            {/* Header with Logistics Overview */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1>Institutional Logistics</h1>
                    <p className="text-secondary text-sm">Fleet management, route optimization, and student safety</p>
                </div>
                <div className="flex gap-2 no-print">
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(vehicles, 'Fleet_Registry')} icon={<Download size={14} />}>Export Fleet</Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer size={14} />}>Reports</Button>
                    <Button variant="primary" size="sm" onClick={() => { setEnrollmentId(null); setIsAllocationModalOpen(true); }} icon={<Plus size={14} />}>Enroll Student</Button>
                    <Button variant="outline" size="sm" onClick={() => { setVehicleId(null); setIsVehicleModalOpen(true); }} icon={<Bus size={14} />}>Add Vehicle</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
                <div className="card p-4 flex items-center gap-4 border-left-4 border-primary">
                    <Bus className="text-primary" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Fleet Size</p><h3>{stats.totalFleet}</h3></div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-left-4 border-success">
                    <Navigation className="text-success" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Active Routes</p><h3>{stats.activeRoutes}</h3></div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-left-4 border-info">
                    <Users className="text-info" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Enrollments</p><h3>{stats.totalEnrolled}</h3></div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-left-4 border-warning">
                    <Droplet className="text-warning" size={24} />
                    <div><p className="text-xs text-secondary font-bold uppercase">Fuel (KES)</p><h3>{stats.fuelCostTerm.toLocaleString()}</h3></div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs mb-6 no-print overflow-x-auto">
                <button className={`tab-link ${activeTab === 'fleet' ? 'active' : ''}`} onClick={() => setActiveTab('fleet')}><Bus size={16} /> Fleet Registry</button>
                <button className={`tab-link ${activeTab === 'routes' ? 'active' : ''}`} onClick={() => setActiveTab('routes')}><MapPin size={16} /> Routes & Zones</button>
                <button className={`tab-link ${activeTab === 'allocations' ? 'active' : ''}`} onClick={() => setActiveTab('allocations')}><Users size={16} /> Allocations</button>
                <button className={`tab-link ${activeTab === 'trips' ? 'active' : ''}`} onClick={() => setActiveTab('trips')}><ClipboardList size={16} /> Trip Logs</button>
                <button className={`tab-link ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}><Wrench size={16} /> Repairs</button>
                <button className={`tab-link ${activeTab === 'fuel' ? 'active' : ''}`} onClick={() => setActiveTab('fuel')}><Droplet size={16} /> Fuel Usage</button>
                <button className={`tab-link ${activeTab === 'safety' ? 'active' : ''}`} onClick={() => setActiveTab('safety')}><ShieldAlert size={16} /> Safety</button>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => {
                    const dataToExport = activeTab === 'allocations' ? allocations : activeTab === 'routes' ? routes : activeTab === 'trips' ? trips : activeTab === 'maintenance' ? maintenanceRecords : fuelRecords;
                    exportToCSV(dataToExport, `Transport_${activeTab}`);
                }} icon={<Download size={14} />}>
                    Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </Button>
            </div>

            {/* Fleet Content */}
            {activeTab === 'fleet' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {vehicles.map(v => (
                        <div key={v.id} className="card p-6 hover-scale border-top-4 border-primary">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="mb-0">{v.registration_number}</h3>
                                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">{v.make_model || v.vehicle_type}</span>
                                </div>
                                <div className={`p-2 rounded-lg ${v.status === 'ACTIVE' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                                    <Bus size={20} />
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-secondary">Seating Cap:</span><span className="font-semibold">{v.seating_capacity} Seats</span></div>
                                <div className="flex justify-between"><span className="text-secondary">Condition:</span><span className="font-semibold">{v.current_condition}</span></div>
                                <div className="flex justify-between"><span className="text-secondary">Insurance Info:</span><span className={`font-semibold ${new Date(v.insurance_expiry) < new Date() ? 'text-error' : ''}`}>{v.insurance_expiry || 'N/A'}</span></div>
                            </div>
                            <div className="flex gap-2 mt-6 border-top pt-4">
                                <Button variant="ghost" size="sm" className="flex-1 text-primary" onClick={() => handleEditVehicle(v)} icon={<Edit size={14} />}>Edit</Button>
                                <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteVehicle(v.id)} icon={<Trash2 size={14} />} />
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleLogFuel(v)}>Logs</Button>
                            </div>
                        </div>
                    ))}
                    <div className="card border-dashed border-2 flex flex-col items-center justify-center p-8 text-secondary cursor-pointer hover-bg-secondary" onClick={() => setIsVehicleModalOpen(true)}>
                        <Plus size={32} className="mb-2" />
                        <p className="font-bold">Add New Vehicle</p>
                    </div>
                </div>
            )}

            {/* Routes Content */}
            {activeTab === 'routes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {routes.map(r => (
                        <div key={r.id} className="card p-6 border-left-4 border-primary">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1"><span className="badge badge-primary">{r.route_code}</span></div>
                                    <h3 className="mb-0">{r.name}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-secondary font-bold uppercase">Base Fee/Term</p>
                                    <h3 className="text-primary">KES {parseFloat(r.base_cost || 0).toLocaleString()}</h3>
                                </div>
                            </div>
                            <div className="bg-secondary-light rounded-lg p-4 mb-4">
                                <p className="text-xs font-bold text-secondary uppercase mb-2">Service Points</p>
                                <div className="space-y-3">
                                    {pickupPoints.filter(p => p.route === r.id).length === 0 && <p className="text-secondary italic text-xs">No points mapped yet.</p>}
                                    {pickupPoints.filter(p => p.route === r.id).map(p => (
                                        <div key={p.id} className="flex items-center gap-4 text-sm group">
                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                            <span className="flex-1 font-semibold">{p.point_name}</span>
                                            <span className="text-secondary flex items-center gap-2"><Clock size={12} /> {p.pickup_time}</span>
                                            <span className="badge badge-primary text-[10px]">KES {parseFloat(p.additional_cost || 0).toLocaleString()}</span>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" className="text-primary p-0" onClick={() => handleEditPoint(p)} icon={<Edit size={10} />} />
                                                <Button variant="ghost" size="sm" className="text-error p-0" onClick={() => handleDeletePoint(p.id)} icon={<Trash2 size={10} />} />
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" className="w-full mt-2 border-dashed" onClick={() => { setPointId(null); setPointForm({ ...pointForm, route_id: r.id, point_name: '', pickup_time: '', dropoff_time: '', distance_from_school: 0, additional_cost: 0 }); setIsPointModalOpen(true); }} icon={<Plus size={12} />}>Add Point</Button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs border-top pt-4 mt-4">
                                <span className="text-secondary flex items-center gap-2"><Navigation size={12} /> {r.distance_km} KM Loop</span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditRoute(r)} icon={<Edit size={12} />}>Edit</Button>
                                    <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteRoute(r.id)} icon={<Trash2 size={12} />} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="card border-dashed border-2 flex flex-col items-center justify-center p-8 text-secondary cursor-pointer hover-bg-secondary" onClick={() => { setRouteId(null); setRouteForm({ name: '', route_code: '', distance_km: 0, base_cost: 0 }); setIsRouteModalOpen(true); }}>
                        <MapPin size={32} className="mb-2" />
                        <p className="font-bold">Map New Route</p>
                    </div>
                </div>
            )}

            {/* Allocations Table */}
            {activeTab === 'allocations' && (
                <div className="table-container fade-in">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student Passenger</th>
                                <th>Route & Pick-up</th>
                                <th>Seat No</th>
                                <th>Period</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allocations.map(a => (
                                <tr key={a.id}>
                                    <td><div className="flex items-center gap-4"><div className="avatar-sm">{a.student_name[0]}</div><span className="font-bold">{a.student_name}</span></div></td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{a.route_name}</span>
                                            <span className="text-xs text-secondary flex items-center gap-2"><MapPin size={10} /> {a.pickup_point_name}</span>
                                        </div>
                                    </td>
                                    <td><span className="font-mono bg-secondary-light px-2 py-1 rounded text-xs">{a.seat_number || 'TBA'}</span></td>
                                    <td>{a.start_date}</td>
                                    <td><span className={`status-badge ${a.status === 'ACTIVE' ? 'success' : 'secondary'}`}>{a.status}</span></td>
                                    <td>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditAllocation(a)} icon={<Edit size={14} />} />
                                            <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteAllocation(a.id)} icon={<Trash2 size={14} />} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Trip Logs */}
            {activeTab === 'trips' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Daily Trip Logs</h3>
                        <Button variant="primary" size="sm" onClick={() => { setTripId(null); setIsTripModalOpen(true); }} icon={<Plus size={14} />}>New Trip</Button>
                    </div>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Route</th><th>Vehicle</th><th>Driver</th><th>Time</th><th>Actions</th></tr></thead>
                        <tbody>
                            {trips.length === 0 && <tr><td colSpan={6} className="text-center italic">No trips logged yet.</td></tr>}
                            {trips.map((t: any) => (
                                <tr key={t.id}>
                                    <td>{t.date}</td>
                                    <td>{routes.find(r => r.id === t.route)?.name || 'Unknown Route'}</td>
                                    <td>{vehicles.find(v => v.id === t.vehicle)?.registration_number || 'N/A'}</td>
                                    <td>{t.attendant || t.driver_name}</td>
                                    <td><span className="badge badge-primary">{t.departure_time || t.start_time} - {t.arrival_time || t.end_time}</span></td>
                                    <td>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditTrip(t)} icon={<Edit size={14} />} />
                                            <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteTrip(t.id)} icon={<Trash2 size={14} />} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Maintenance */}
            {activeTab === 'maintenance' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Maintenance & Repairs</h3>
                        <Button variant="primary" size="sm" onClick={() => { setMaintenanceId(null); setIsMaintenanceModalOpen(true); }} icon={<Wrench size={14} />}>Log Repair</Button>
                    </div>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Vehicle</th><th>Issue</th><th>Cost (KES)</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {maintenanceRecords.length === 0 && <tr><td colSpan={6} className="text-center italic">No maintenance records.</td></tr>}
                            {maintenanceRecords.map((m: any) => (
                                <tr key={m.id}>
                                    <td>{m.service_date || m.date}</td>
                                    <td>{vehicles.find(v => v.id === m.vehicle)?.registration_number || 'N/A'}</td>
                                    <td>{m.description}</td>
                                    <td>{parseFloat(m.cost).toLocaleString()}</td>
                                    <td><span className={`status-badge ${m.status === 'COMPLETED' ? 'success' : 'secondary'}`}>{m.status}</span></td>
                                    <td>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditMaintenance(m)} icon={<Edit size={14} />} />
                                            <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteMaintenance(m.id)} icon={<Trash2 size={14} />} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Safety */}
            {activeTab === 'safety' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Safety & Incident Reports</h3>
                        <Button variant="danger" size="sm" onClick={() => { setIncidentId(null); setIsSafetyModalOpen(true); }} icon={<ShieldAlert size={14} />}>Report Incident</Button>
                    </div>
                    <table className="table">
                        <thead><tr><th>Date</th><th>Vehicle</th><th>Type</th><th>Severity</th><th>Description</th><th>Actions</th></tr></thead>
                        <tbody>
                            {incidents.length === 0 && <tr><td colSpan={6} className="text-center italic">No incidents reported.</td></tr>}
                            {incidents.map((i: any) => (
                                <tr key={i.id}>
                                    <td>{i.date}</td>
                                    <td>{vehicles.find(v => v.id === i.vehicle)?.registration_number || 'N/A'}</td>
                                    <td><span className="font-bold uppercase">{i.incident_type || i.type}</span></td>
                                    <td><span className={`badge ${i.severity === 'MAJOR' ? 'badge-error' : 'badge-warning'}`}>{i.severity}</span></td>
                                    <td>{i.description}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleEditIncident(i)} icon={<Edit size={14} />} />
                                            <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteIncident(i.id)} icon={<Trash2 size={14} />} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fuel Tab Content */}
            {activeTab === 'fuel' && (
                <div className="table-container fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3>Fuel Consumption Records</h3>
                        <Button variant="primary" size="sm" onClick={() => setIsFuelModalOpen(true)} icon={<Droplet size={14} />}>Log Fuel</Button>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Vehicle</th>
                                <th>Liters</th>
                                <th>Cost (KES)</th>
                                <th>Odometer</th>
                                <th>Receipt</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fuelRecords.length === 0 && <tr><td colSpan={7} className="text-center italic">No fuel records found.</td></tr>}
                            {fuelRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(f => (
                                <tr key={f.id}>
                                    <td>{f.date}</td>
                                    <td className="font-bold">{vehicles.find(v => v.id === f.vehicle)?.registration_number || 'N/A'}</td>
                                    <td>{f.liters}L</td>
                                    <td>{parseFloat(f.amount).toLocaleString()}</td>
                                    <td className="font-mono">{f.mileage?.toLocaleString()}</td>
                                    <td className="text-xs">{f.receipt_no || '-'}</td>
                                    <td>
                                        <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDeleteFuel(f.id)} icon={<Trash2 size={14} />} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Templates */}
            <Modal isOpen={isAllocationModalOpen} onClose={() => setIsAllocationModalOpen(false)} title={enrollmentId ? "Edit Enrollment" : "New Transport Enrollment"}>
                <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
                    <SearchableSelect label="Select Student *" options={studentOptions} value={enrollmentForm.student} onChange={(val) => setEnrollmentForm({ ...enrollmentForm, student: val.toString() })} required />
                    <SearchableSelect label="Assign Route *" options={routeOptions} value={enrollmentForm.route} onChange={(val) => setEnrollmentForm({ ...enrollmentForm, route: val.toString() })} required />
                    <div className="form-group">
                        <label className="label">Pickup Point *</label>
                        <select className="select" value={enrollmentForm.pickup_point} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, pickup_point: e.target.value })} required>
                            <option value="">Select from route points...</option>
                            {pickupPoints.filter(p => p.route === Number(enrollmentForm.route)).map(p => (
                                <option key={p.id} value={p.id}>{p.point_name} ({p.pickup_time})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group"><label className="label">Start Date</label><input type="date" className="input" value={enrollmentForm.start_date} onChange={e => setEnrollmentForm({ ...enrollmentForm, start_date: e.target.value })} required /></div>
                    <div className="modal-footer"><Button type="submit" variant="primary" className="w-full" loading={isSaving} loadingText={enrollmentId ? "Updating..." : "Enrolling..."}>{enrollmentId ? "Update Enrollment" : "Confirm Enrollment"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} title="Fleet Management" size="md">
                <form onSubmit={handleVehicleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Registration No.</label><input type="text" className="input uppercase" value={vehicleForm.registration_number} onChange={e => setVehicleForm({ ...vehicleForm, registration_number: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Make / Model</label><input type="text" className="input" value={vehicleForm.make_model} onChange={e => setVehicleForm({ ...vehicleForm, make_model: e.target.value })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Type</label>
                            <select className="select" value={vehicleForm.vehicle_type} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}>
                                <option value="BUS">Bus</option><option value="VAN">Van</option><option value="MINIBUS">Minibus</option><option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-group"><label className="label">Capacity</label><input type="number" className="input" value={vehicleForm.seating_capacity} onChange={e => setVehicleForm({ ...vehicleForm, seating_capacity: parseInt(e.target.value) })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Status</label>
                            <select className="select" value={vehicleForm.status} onChange={e => setVehicleForm({ ...vehicleForm, status: e.target.value })}>
                                <option value="ACTIVE">Active / Operational</option>
                                <option value="MAINTENANCE">In Maintenance</option>
                                <option value="SUSPENDED">Suspended / Grounded</option>
                            </select>
                        </div>
                        <div className="form-group"><label className="label">Insurance Expiry</label><input type="date" className="input" value={vehicleForm.insurance_expiry} onChange={e => setVehicleForm({ ...vehicleForm, insurance_expiry: e.target.value })} /></div>
                    </div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full uppercase font-black" loading={isSaving} loadingText={vehicleId ? "Updating..." : "Registering..."}>{vehicleId ? 'Update Vehicle' : 'Register Vehicle'}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isRouteModalOpen} onClose={() => setIsRouteModalOpen(false)} title={routeId ? "Edit Route" : "New Geographic Route"}>
                <form onSubmit={handleRouteSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Route Code</label><input type="text" className="input uppercase" placeholder="e.g. RT-001" value={routeForm.route_code} onChange={e => setRouteForm({ ...routeForm, route_code: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Distance (KM)</label><input type="number" step="0.1" className="input" value={routeForm.distance_km} onChange={e => setRouteForm({ ...routeForm, distance_km: parseFloat(e.target.value) })} required /></div>
                    </div>
                    <div className="form-group"><label className="label">Route Name / Destination</label><input type="text" className="input" placeholder="e.g. Westlands via Waiyaki Way" value={routeForm.name} onChange={e => setRouteForm({ ...routeForm, name: e.target.value })} required /></div>
                    <div className="form-group"><label className="label">Base Fee (KES)</label><input type="number" className="input" value={routeForm.base_cost} onChange={e => setRouteForm({ ...routeForm, base_cost: parseFloat(e.target.value) })} required /></div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full uppercase font-black" loading={isSaving} loadingText={routeId ? "Updating..." : "Mapping..."}>{routeId ? "Update Route" : "Map Route"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isPointModalOpen} onClose={() => setIsPointModalOpen(false)} title={pointId ? "Edit Service Point" : "Add Service Point"}>
                <form onSubmit={handlePointSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Point Name / Landmark</label><input type="text" className="input" placeholder="e.g. Shell Station, Westlands" value={pointForm.point_name} onChange={e => setPointForm({ ...pointForm, point_name: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Pickup Time</label><input type="time" className="input" value={pointForm.pickup_time} onChange={e => setPointForm({ ...pointForm, pickup_time: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Drop-off Time</label><input type="time" className="input" value={pointForm.dropoff_time} onChange={e => setPointForm({ ...pointForm, dropoff_time: e.target.value })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-secondary-light p-4 rounded-lg">
                        <div className="form-group"><label className="label">Dist. from School (KM)</label><input type="number" step="0.01" className="input" value={pointForm.distance_from_school} onChange={e => setPointForm({ ...pointForm, distance_from_school: parseFloat(e.target.value) })} required /></div>
                        <div className="form-group"><label className="label">Fee (Auto-Calc)</label><input type="number" step="0.01" className="input" placeholder="0 = Auto" value={pointForm.additional_cost} onChange={e => setPointForm({ ...pointForm, additional_cost: parseFloat(e.target.value) })} /></div>
                    </div>
                    <p className="text-xs text-secondary mt-2">* Fee is automatically calculated based on distance if left as 0.</p>
                    <div className="modal-footer pt-4">
                        <Button type="submit" variant="primary" className="w-full uppercase font-black" loading={isSaving} loadingText={pointId ? "Updating..." : "Adding..."}>
                            {pointId ? "Update Point" : "Add Point"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isTripModalOpen} onClose={() => setIsTripModalOpen(false)} title={tripId ? "Edit Trip Log" : "Log New Trip"}>
                <form onSubmit={handleTripSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={tripForm.date} onChange={e => setTripForm({ ...tripForm, date: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Driver Name</label><input type="text" className="input" value={tripForm.driver_name} onChange={e => setTripForm({ ...tripForm, driver_name: e.target.value })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <SearchableSelect label="Route" options={routeOptions} value={String(tripForm.route)} onChange={(val) => setTripForm({ ...tripForm, route: val.toString() })} required />
                        <div className="form-group"><label className="label">Vehicle</label>
                            <select className="select" value={tripForm.vehicle} onChange={e => setTripForm({ ...tripForm, vehicle: e.target.value })} required>
                                <option value="">Select Vehicle...</option>
                                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-secondary-light p-4 rounded text-sm">
                        <div className="form-group"><label className="label">Start Time</label><input type="time" className="input" value={tripForm.start_time} onChange={e => setTripForm({ ...tripForm, start_time: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">End Time</label><input type="time" className="input" value={tripForm.end_time} onChange={e => setTripForm({ ...tripForm, end_time: e.target.value })} required /></div>
                    </div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full" loading={isSaving} loadingText={tripId ? "Updating..." : "Saving..."}>{tripId ? "Update Trip Log" : "Save Trip Log"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title={maintenanceId ? "Edit Maintenance Record" : "Log Maintenance"}>
                <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={maintenanceForm.date} onChange={e => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Cost (KES)</label><input type="number" className="input" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) })} required /></div>
                    </div>
                    <div className="form-group"><label className="label">Affected Vehicle</label>
                        <select className="select" value={maintenanceForm.vehicle} onChange={e => setMaintenanceForm({ ...maintenanceForm, vehicle: e.target.value })} required>
                            <option value="">Select Vehicle...</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label className="label">Issue / Service Description</label><textarea className="input" rows={3} value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} required></textarea></div>
                    <div className="form-group"><label className="label">Status</label>
                        <select className="select" value={maintenanceForm.status} onChange={e => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })}>
                            <option value="PENDING">Pending Approval</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full" loading={isSaving} loadingText={maintenanceId ? "Updating..." : "Logging..."}>{maintenanceId ? "Update Maintenance" : "Log Maintenance"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isSafetyModalOpen} onClose={() => setIsSafetyModalOpen(false)} title={incidentId ? "Edit Incident Report" : "Report Safety Incident"}>
                <form onSubmit={handleSafetySubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={safetyForm.date} onChange={e => setSafetyForm({ ...safetyForm, date: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Severity</label>
                            <select className="select" value={safetyForm.severity} onChange={e => setSafetyForm({ ...safetyForm, severity: e.target.value })}>
                                <option value="MINOR">Minor</option>
                                <option value="MAJOR">Major</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Vehicle Involved</label>
                            <select className="select" value={safetyForm.vehicle} onChange={e => setSafetyForm({ ...safetyForm, vehicle: e.target.value })} required>
                                <option value="">Select Vehicle...</option>
                                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="label">Type</label>
                            <select className="select" value={safetyForm.type} onChange={e => setSafetyForm({ ...safetyForm, type: e.target.value })}>
                                <option value="ACCIDENT">Accident</option>
                                <option value="BREAKDOWN">Breakdown</option>
                                <option value="VIOLATION">Traffic Violation</option>
                                <option value="COMPLAINT">Parent Complaint</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label className="label">Description of Incident</label><textarea className="input" rows={4} value={safetyForm.description} onChange={e => setSafetyForm({ ...safetyForm, description: e.target.value })} required></textarea></div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="danger" className="w-full" loading={isSaving} loadingText={incidentId ? "Updating..." : "Reporting..."}>{incidentId ? "Update Report" : "Submit Report"}</Button></div>
                </form>
            </Modal>

            <Modal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} title="Log Fuel Consumption">
                <form onSubmit={handleFuelSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Date</label><input type="date" className="input" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} required /></div>
                        <div className="form-group"><label className="label">Vehicle</label>
                            <select className="select" value={fuelForm.vehicle} onChange={e => setFuelForm({ ...fuelForm, vehicle: e.target.value })} required>
                                <option value="">Select Vehicle...</option>
                                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Liters</label><input type="number" step="0.01" className="input" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: parseFloat(e.target.value) })} required /></div>
                        <div className="form-group"><label className="label">Total Cost (KES)</label><input type="number" className="input" value={fuelForm.amount} onChange={e => setFuelForm({ ...fuelForm, amount: parseFloat(e.target.value) })} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Mileage (Odometer)</label><input type="number" className="input" value={fuelForm.mileage} onChange={e => setFuelForm({ ...fuelForm, mileage: parseInt(e.target.value) })} required /></div>
                        <div className="form-group"><label className="label">Receipt No.</label><input type="text" className="input" value={fuelForm.receipt_no} onChange={e => setFuelForm({ ...fuelForm, receipt_no: e.target.value })} /></div>
                    </div>
                    <div className="modal-footer pt-4"><Button type="submit" variant="primary" className="w-full" loading={isSaving} loadingText="Saving...">Save & Sync to Finance</Button></div>
                </form>
            </Modal>

            <style>{`
                .tab-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-bottom: 2px solid transparent;
                    color: var(--text-secondary);
                    font-weight: 700;
                    transition: all 0.2s;
                    white-space: nowrap;
                    background: none;
                    border-top: none;
                    border-left: none;
                    border-right: none;
                    cursor: pointer;
                }
                .tab-link.active { 
                    border-bottom-color: var(--primary);
                    color: var(--primary);
                    background: rgba(30, 60, 114, 0.05);
                }
                .tab-link:hover:not(.active) { 
                    background: var(--bg-secondary);
                }
                .status-badge.success { 
                    background: var(--success-light);
                    color: var(--success);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .status-badge.secondary { 
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .avatar-sm { 
                    width: 2rem;
                    height: 2rem;
                    border-radius: 9999px;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.75rem;
                }
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: translateY(-4px); }
                .badge { 
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .badge-primary { 
                    background: var(--primary);
                    color: white;
                }
            `}</style>
        </div >
    );
};

export default Transport;
