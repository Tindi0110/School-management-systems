import React, { useEffect, useState } from 'react';
import {
    Plus, Edit, Bus, MapPin, Navigation,
    Droplet, Users, Trash2, Search
} from 'lucide-react';
import { transportAPI, studentsAPI } from '../api/api';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import { StatCard } from '../components/Card';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Button from '../components/common/Button';
import PremiumDateInput from '../components/common/DatePicker';

const Transport = () => {
    const [activeTab, setActiveTab] = useState('fleet');
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [fuelRecords, setFuelRecords] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 50;

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
        insurance_expiry: '',
        assigned_driver_id: ''
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

    const [_isTripModalOpen, setIsTripModalOpen] = useState(false);
    const [tripForm, setTripForm] = useState({ route: '', vehicle: '', date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', driver: '' });

    const [_isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [maintenanceForm, setMaintenanceForm] = useState({ vehicle: '', description: '', cost: 0, date: new Date().toISOString().split('T')[0], status: 'PENDING' });

    const [_isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [safetyForm, setSafetyForm] = useState({ vehicle: '', date: new Date().toISOString().split('T')[0], type: 'ACCIDENT', description: '', severity: 'MINOR' });

    const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
    const [fuelForm, setFuelForm] = useState({ date: new Date().toISOString().split('T')[0], vehicle: '', liters: 0, amount: 0, mileage: 0, receipt_no: '' });

    const [tripId, setTripId] = useState<number | null>(null);
    const [maintenanceId, setMaintenanceId] = useState<number | null>(null);
    const [incidentId, setIncidentId] = useState<number | null>(null);

    const [isSaving, setIsSaving] = useState(false);

    const [pointId, setPointId] = useState<number | null>(null);

    const toast = useToast();
    const { confirm } = useConfirm();

    useEffect(() => {
        setPage(1);
        loadData();
    }, [activeTab]);

    useEffect(() => {
        loadData();
    }, [page]);

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (page !== 1) setPage(1);
            else loadData();
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = { page, page_size: pageSize, search: searchTerm };

            if (activeTab === 'fleet') {
                const res = await transportAPI.vehicles.getAll(params);
                setVehicles(res.data?.results ?? res.data ?? []);
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'routes') {
                const res = await transportAPI.routes.getAll(params);
                setRoutes(res.data?.results ?? res.data ?? []);
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'allocations') {
                const res = await transportAPI.allocations.getAll(params);
                setAllocations(res.data?.results ?? res.data ?? []);
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'fuel') {
                const res = await transportAPI.fuel.getAll(params);
                setFuelRecords(res.data?.results ?? res.data ?? []);
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'trips') {
                const res = await transportAPI.tripLogs.getAll(params);
                setTrips(res.data?.results ?? res.data ?? []);
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'maintenance') {
                const res = await transportAPI.maintenance.getAll(params);
                setMaintenanceRecords(res.data?.results ?? res.data ?? []);
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            } else if (activeTab === 'safety') {
                const res = await transportAPI.incidents.getAll(params);
                setIncidents(res.data?.results ?? res.data ?? []);
                setTotalItems(res.data?.count ?? (res.data?.results ? res.data.results.length : 0));
            }

            // Always fetch drivers for modals if on relevant tabs
            if (['fleet', 'trips', 'maintenance', 'safety', 'fuel'].includes(activeTab)) {
                if (drivers.length === 0) {
                    const drvRes = await transportAPI.drivers.getAll({ page_size: 100 });
                    setDrivers(drvRes.data?.results ?? drvRes.data ?? []);
                }
                if (vehicles.length === 0 && activeTab !== 'fleet') {
                    const vRes = await transportAPI.vehicles.getAll({ page_size: 100 });
                    setVehicles(vRes.data?.results ?? vRes.data ?? []);
                }
            }

            // Always fetch pickups/routes for allocations
            if (activeTab === 'allocations') {
                if (routes.length === 0) {
                    const rRes = await transportAPI.routes.getAll({ page_size: 100 });
                    setRoutes(rRes.data?.results ?? rRes.data ?? []);
                }
                if (pickupPoints.length === 0) {
                    const pRes = await transportAPI.pickupPoints.getAll({ page_size: 200 });
                    setPickupPoints(pRes.data?.results ?? pRes.data ?? []);
                }
            }
            if (students.length === 0) {
                const sRes = await studentsAPI.minimalSearch();
                setStudents(sRes.data?.results ?? sRes.data ?? []);
            }

        } catch (error: any) {
            toast.error("Failed to load transport data.");
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
                assigned_driver_id: vehicleForm.assigned_driver_id ? Number(vehicleForm.assigned_driver_id) : null,
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
                seating_capacity: 14, status: 'ACTIVE', insurance_expiry: '',
                assigned_driver_id: ''
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
            insurance_expiry: v.insurance_expiry || '',
            assigned_driver_id: v.assigned_driver_id ? String(v.assigned_driver_id) : ''
        });
        setIsVehicleModalOpen(true);
    };

    const handleDeleteVehicle = async (id: number) => {
        if (!await confirm('Are you sure you want to delete this vehicle?')) return;
        try {
            await transportAPI.vehicles.delete(id);
            toast.success('Vehicle deleted successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete vehicle.');
        }
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

    const handleDeleteRoute = async (id: number) => {
        if (!await confirm('Delete this route?')) return;
        try {
            await transportAPI.routes.delete(id);
            toast.success('Route deleted successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete route.');
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
            const payload = {
                route: pointForm.route_id,
                point_name: pointForm.point_name,
                pickup_time: pointForm.pickup_time,
                dropoff_time: pointForm.dropoff_time,
                distance_from_school: parseFloat(pointForm.distance_from_school.toString()),
                additional_cost: parseFloat(pointForm.additional_cost.toString())
            };

            if (pointId) await transportAPI.pickupPoints.update(pointId, payload);
            else await transportAPI.pickupPoints.create(payload);

            toast.success('Pickup point saved');
            loadData();
            setIsPointModalOpen(false);
            setPointId(null);
            setPointForm({ route_id: 0, point_name: '', pickup_time: '', dropoff_time: '', distance_from_school: 0, additional_cost: 0 });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save point');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditPoint = (p: any) => {
        setPointId(p.id);
        setPointForm({
            route_id: p.route,
            point_name: p.point_name,
            pickup_time: p.pickup_time,
            dropoff_time: p.dropoff_time,
            distance_from_school: parseFloat(p.distance_from_school || 0),
            additional_cost: parseFloat(p.additional_cost || 0)
        });
        setIsPointModalOpen(true);
    };

    const handleDeletePoint = async (id: number) => {
        if (!await confirm('Delete this point?')) return;
        try {
            await transportAPI.pickupPoints.delete(id);
            toast.success('Point removed');
            loadData();
        } catch (error: any) {
            toast.error('Failed to delete point');
        }
    };

    const handleTripSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { ...tripForm, route: Number(tripForm.route), vehicle: Number(tripForm.vehicle), driver: Number(tripForm.driver) };
            if (tripId) await transportAPI.tripLogs.update(tripId, payload);
            else await transportAPI.tripLogs.create(payload);
            toast.success('Trip log saved');
            loadData();
            setIsTripModalOpen(false);
            setTripId(null);
        } catch (error: any) {
            toast.error('Failed to save trip log');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditTrip = (t: any) => {
        setTripId(t.id);
        setTripForm({ ...t, route: String(t.route), vehicle: String(t.vehicle), driver: String(t.driver) });
        setIsTripModalOpen(true);
    };

    const handleDeleteTrip = async (id: number) => {
        if (await confirm('Delete trip record?')) {
            await transportAPI.tripLogs.delete(id);
            toast.success('Record deleted');
            loadData();
        }
    };

    const handleMaintenanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { ...maintenanceForm, vehicle: Number(maintenanceForm.vehicle) };
            if (maintenanceId) await transportAPI.maintenance.update(maintenanceId, payload);
            else await transportAPI.maintenance.create(payload);
            toast.success('Maintenance record saved');
            loadData();
            setIsMaintenanceModalOpen(false);
        } catch (error: any) {
            toast.error('Failed to save record');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditMaintenance = (m: any) => {
        setMaintenanceId(m.id);
        setMaintenanceForm({ ...m, vehicle: String(m.vehicle) });
        setIsMaintenanceModalOpen(true);
    };

    const handleDeleteMaintenance = async (id: number) => {
        if (await confirm('Delete maintenance record?')) {
            await transportAPI.maintenance.delete(id);
            toast.success('Record deleted');
            loadData();
        }
    };

    const handleSafetySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { ...safetyForm, vehicle: Number(safetyForm.vehicle) };
            if (incidentId) await transportAPI.incidents.update(incidentId, payload);
            else await transportAPI.incidents.create(payload);
            toast.success('Incident reported');
            loadData();
            setIsSafetyModalOpen(false);
        } catch (error: any) {
            toast.error('Failed to report incident');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditIncident = (i: any) => {
        setIncidentId(i.id);
        setSafetyForm({ ...i, vehicle: String(i.vehicle) });
        setIsSafetyModalOpen(true);
    };

    const handleDeleteIncident = async (id: number) => {
        if (await confirm('Delete incident record?')) {
            await transportAPI.incidents.delete(id);
            toast.success('Record deleted');
            loadData();
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
            await transportAPI.fuel.create({ ...fuelForm, vehicle: Number(fuelForm.vehicle) });
            toast.success('Fuel logged');
            setIsFuelModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error('Failed to log fuel');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFuel = async (id: number) => {
        if (await confirm('Delete fuel record?')) {
            await transportAPI.fuel.delete(id);
            toast.success('Record deleted');
            loadData();
        }
    };

    const stats = {
        totalFleet: vehicles.length,
        activeRoutes: routes.length,
        totalEnrolled: allocations.length,
        fuelCostTerm: fuelRecords.reduce((acc, f) => acc + parseFloat(f.amount || 0), 0)
    };

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    const studentOptions = students.map(s => ({ id: String(s.id), label: s.full_name, subLabel: s.admission_number }));
    const routeOptions = routes.map(r => ({ id: String(r.id), label: r.name, subLabel: r.route_code }));
    const vehicleOptions = vehicles.map(v => ({ id: String(v.id), label: v.registration_number, subLabel: v.make_model }));
    const driverOptions = drivers.map(d => ({ id: String(d.id), label: d.full_name }));

    return (
        <div className="fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black">Institutional Logistics</h1>
                    <p className="text-secondary text-sm">Fleet, routes, and student safety</p>
                </div>
                <div className="flex-grow max-w-md mx-6 no-print">
                    <div className="search-container">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            className="input search-input text-xs"
                            placeholder="Search fleet, routes, or allocations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2 no-print">
                    <Button variant="primary" size="sm" onClick={() => setIsAllocationModalOpen(true)} icon={<Plus size={14} />}>Enroll</Button>
                    <Button variant="outline" size="sm" onClick={() => setIsVehicleModalOpen(true)} icon={<Bus size={14} />}>Add Bus</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Fleet Size" value={stats.totalFleet} icon={<Bus />} gradient="linear-gradient(135deg, #1e3c72, #2a5298)" />
                <StatCard title="Active Routes" value={stats.activeRoutes} icon={<Navigation />} gradient="linear-gradient(135deg, #4facfe, #00f2fe)" />
                <StatCard title="Enrollments" value={stats.totalEnrolled} icon={<Users />} gradient="linear-gradient(135deg, #667eea, #764ba2)" />
                <StatCard title="Fuel Term" value={stats.fuelCostTerm.toLocaleString()} icon={<Droplet />} gradient="linear-gradient(135deg, #f093fb, #f5576c)" />
            </div>

            <div className="nav-tab-container no-print mb-6">
                {['fleet', 'routes', 'allocations', 'trips', 'maintenance', 'fuel', 'safety'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-tab ${activeTab === tab ? 'active' : ''}`}>
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            {activeTab === 'fleet' && (
                <div className="fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {vehicles.map(v => (
                            <div key={v.id} className="card border-top-4 border-primary hover-scale">
                                <div className="flex justify-between items-start mb-4">
                                    <div><h3 className="mb-0">{v.registration_number}</h3><span className="text-xs text-secondary">{v.make_model}</span></div>
                                    <div className="badge badge-success"><Bus size={14} /></div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Seats:</span><span>{v.seating_capacity}</span></div>
                                    <div className="flex justify-between"><span>Status:</span><span className="badge badge-ghost capitalize">{v.status}</span></div>
                                </div>
                                <div className="flex gap-2 mt-6 border-top pt-4">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditVehicle(v)} className="flex-1 text-primary">Edit</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteVehicle(v.id)} className="text-error"><Trash2 size={14} /></Button>
                                    <Button variant="outline" size="sm" onClick={() => handleLogFuel(v)} className="flex-1 text-xs">Log Fuel</Button>
                                </div>
                            </div>
                        ))}
                        <div className="card border-dashed border-2 flex flex-col items-center justify-center p-8 text-secondary cursor-pointer hover-bg-secondary" onClick={() => setIsVehicleModalOpen(true)}>
                            <Plus size={32} />
                            <p className="font-bold mt-2">Add New Vehicle</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl no-print">
                        <div className="text-[10px] uppercase font-black text-secondary">Showing {vehicles.length} of {totalItems} Vehicles</div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)}>Next</Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'routes' && (
                <div className="fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {routes.map(r => (
                            <div key={r.id} className="card border-left-4 border-primary">
                                <div className="flex justify-between mb-4">
                                    <div><span className="badge badge-primary">{r.route_code}</span><h3 className="mb-0">{r.name}</h3></div>
                                    <div className="text-right"><p className="text-xs uppercase font-bold text-secondary">Term Fee</p><h3 className="text-primary">{r.base_cost?.toLocaleString()}</h3></div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    {pickupPoints.filter(p => p.route === r.id).map(p => (
                                        <div key={p.id} className="flex justify-between text-xs items-center bg-slate-50 p-2 rounded">
                                            <span>{p.point_name}</span>
                                            <div className="flex gap-2 items-center">
                                                <span className="text-secondary">{p.pickup_time}</span>
                                                <button className="text-primary" onClick={() => handleEditPoint(p)}><Edit size={10} /></button>
                                                <button className="text-error" onClick={() => handleDeletePoint(p.id)}><Trash2 size={10} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="ghost" size="sm" className="w-full border-dashed border text-xs" onClick={() => { setPointId(null); setPointForm({ ...pointForm, route_id: r.id }); setIsPointModalOpen(true); }}>+ Add Point</Button>
                                </div>
                                <div className="flex justify-between items-center border-top pt-4">
                                    <span className="text-xs font-bold text-secondary">{r.distance_km} KM</span>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditRoute(r)} className="text-primary"><Edit size={14} /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRoute(r.id)} className="text-error"><Trash2 size={14} /></Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="card border-dashed border-2 flex flex-col items-center justify-center p-8 text-secondary cursor-pointer hover-bg-secondary" onClick={() => setIsRouteModalOpen(true)}>
                            <MapPin size={32} />
                            <p className="font-bold mt-2">Map New Route</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl no-print">
                        <div className="text-[10px] uppercase font-black text-secondary">Showing {routes.length} of {totalItems} Routes</div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)}>Next</Button>
                        </div>
                    </div>
                </div>
            )}

            {['allocations', 'trips', 'maintenance', 'fuel', 'safety'].includes(activeTab) && (
                <div className="table-wrapper fade-in">
                    <table className="table">
                        <thead>
                            {activeTab === 'allocations' && <tr><th>Student</th><th>Route/Point</th><th>Start Date</th><th>Status</th><th>Actions</th></tr>}
                            {activeTab === 'trips' && <tr><th>Date</th><th>Route/Vehicle</th><th>Time</th><th>Driver</th><th>Actions</th></tr>}
                            {activeTab === 'maintenance' && <tr><th>Date</th><th>Vehicle</th><th>Issue</th><th>Cost</th><th>Status</th><th>Actions</th></tr>}
                            {activeTab === 'fuel' && <tr><th>Date</th><th>Vehicle</th><th>Liters</th><th>Amount</th><th>Mileage</th><th>Actions</th></tr>}
                            {activeTab === 'safety' && <tr><th>Date</th><th>Vehicle</th><th>Type</th><th>Severity</th><th>Description</th><th>Actions</th></tr>}
                        </thead>
                        <tbody>
                            {activeTab === 'allocations' && allocations.map(a => (
                                <tr key={a.id}>
                                    <td className="font-bold">{a.student_name}</td>
                                    <td>{a.route_name} / {a.pickup_point_name}</td>
                                    <td>{a.start_date}</td>
                                    <td><span className={`badge ${a.status === 'ACTIVE' ? 'badge-success' : 'badge-ghost'}`}>{a.status}</span></td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="text-primary" onClick={() => handleEditAllocation(a)}><Edit size={14} /></button>
                                            <button className="text-error" onClick={() => handleDeleteAllocation(a.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {activeTab === 'trips' && trips.map(t => (
                                <tr key={t.id}>
                                    <td>{t.date}</td>
                                    <td>{routes.find(r => r.id === t.route)?.name} / {vehicles.find(v => v.id === t.vehicle)?.registration_number}</td>
                                    <td>{t.departure_time} - {t.arrival_time}</td>
                                    <td>{drivers.find(d => d.id === t.driver)?.full_name}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="text-primary" onClick={() => handleEditTrip(t)}><Edit size={14} /></button>
                                            <button className="text-error" onClick={() => handleDeleteTrip(t.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {activeTab === 'maintenance' && maintenanceRecords.map(m => (
                                <tr key={m.id}>
                                    <td>{m.service_date}</td>
                                    <td>{vehicles.find(v => v.id === m.vehicle)?.registration_number}</td>
                                    <td>{m.description}</td>
                                    <td>{m.cost?.toLocaleString()}</td>
                                    <td><span className={`badge ${m.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{m.status}</span></td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="text-primary" onClick={() => handleEditMaintenance(m)}><Edit size={14} /></button>
                                            <button className="text-error" onClick={() => handleDeleteMaintenance(m.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {activeTab === 'fuel' && fuelRecords.map(f => (
                                <tr key={f.id}>
                                    <td>{f.date}</td>
                                    <td>{vehicles.find(v => v.id === f.vehicle)?.registration_number}</td>
                                    <td>{f.liters}L</td>
                                    <td>{parseFloat(f.amount || 0).toLocaleString()}</td>
                                    <td>{f.mileage?.toLocaleString()}</td>
                                    <td><button className="text-error" onClick={() => handleDeleteFuel(f.id)}><Trash2 size={14} /></button></td>
                                </tr>
                            ))}
                            {activeTab === 'safety' && incidents.map(i => (
                                <tr key={i.id}>
                                    <td>{i.date}</td>
                                    <td>{vehicles.find(v => v.id === i.vehicle)?.registration_number}</td>
                                    <td>{i.incident_type}</td>
                                    <td><span className={`badge ${i.severity === 'MAJOR' ? 'badge-error' : 'badge-warning'}`}>{i.severity}</span></td>
                                    <td className="text-xs max-w-xs">{i.description}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="text-primary" onClick={() => handleEditIncident(i)}><Edit size={14} /></button>
                                            <button className="text-error" onClick={() => handleDeleteIncident(i.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-between items-center mt-6 bg-slate-50 p-4 rounded-xl no-print">
                        <div className="text-[10px] uppercase font-black text-secondary">Showing {totalItems > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, totalItems)} of {totalItems} Records</div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                            <Button variant="primary" size="sm" disabled={page * pageSize >= totalItems} onClick={() => setPage(page + 1)}>Next</Button>
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} title={vehicleId ? "Edit Vehicle" : "Add Vehicle"}>
                <form onSubmit={handleVehicleSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Reg Number</label><input type="text" className="input" value={vehicleForm.registration_number} onChange={e => setVehicleForm({ ...vehicleForm, registration_number: e.target.value })} required /></div>
                    <div className="form-group"><label className="label">Make/Model</label><input type="text" className="input" value={vehicleForm.make_model} onChange={e => setVehicleForm({ ...vehicleForm, make_model: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Capacity</label><input type="number" className="input" value={vehicleForm.seating_capacity} onChange={e => setVehicleForm({ ...vehicleForm, seating_capacity: parseInt(e.target.value) })} /></div>
                        <div className="form-group"><label className="label">Status</label><select className="select" value={vehicleForm.status} onChange={e => setVehicleForm({ ...vehicleForm, status: e.target.value })}><option value="ACTIVE">Active</option><option value="MAINTENANCE">Maintenance</option></select></div>
                    </div>
                    <div className="form-group">
                        <label className="label">Driver</label>
                        <select className="select" value={vehicleForm.assigned_driver_id} onChange={e => setVehicleForm({ ...vehicleForm, assigned_driver_id: e.target.value })}>
                            <option value="">None</option>
                            {driverOptions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                        </select>
                    </div>
                    <Button type="submit" className="w-full" loading={isSaving}>Save Vehicle</Button>
                </form>
            </Modal>

            <Modal isOpen={isRouteModalOpen} onClose={() => setIsRouteModalOpen(false)} title={routeId ? "Edit Route" : "Map Route"}>
                <form onSubmit={handleRouteSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Route Name</label><input type="text" className="input" value={routeForm.name} onChange={e => setRouteForm({ ...routeForm, name: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Code</label><input type="text" className="input" value={routeForm.route_code} onChange={e => setRouteForm({ ...routeForm, route_code: e.target.value })} /></div>
                        <div className="form-group"><label className="label">Fee</label><input type="number" className="input" value={routeForm.base_cost} onChange={e => setRouteForm({ ...routeForm, base_cost: parseFloat(e.target.value) })} /></div>
                    </div>
                    <Button type="submit" className="w-full" loading={isSaving}>Save Route</Button>
                </form>
            </Modal>

            <Modal isOpen={isPointModalOpen} onClose={() => setIsPointModalOpen(false)} title="Pickup Point">
                <form onSubmit={handlePointSubmit} className="space-y-4">
                    <div className="form-group"><label className="label">Point Name</label><input type="text" className="input" value={pointForm.point_name} onChange={e => setPointForm({ ...pointForm, point_name: e.target.value })} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Time</label><input type="time" className="input" value={pointForm.pickup_time} onChange={e => setPointForm({ ...pointForm, pickup_time: e.target.value })} /></div>
                        <div className="form-group"><label className="label">Cost</label><input type="number" className="input" value={pointForm.additional_cost} onChange={e => setPointForm({ ...pointForm, additional_cost: parseFloat(e.target.value) })} /></div>
                    </div>
                    <Button type="submit" className="w-full" loading={isSaving}>Save Point</Button>
                </form>
            </Modal>

            <Modal isOpen={isAllocationModalOpen} onClose={() => setIsAllocationModalOpen(false)} title="Enrollment">
                <form onSubmit={handleEnrollmentSubmit} className="space-y-4">
                    <SearchableSelect label="Student" options={studentOptions} value={enrollmentForm.student} onChange={val => setEnrollmentForm({ ...enrollmentForm, student: val.toString() })} required />
                    <SearchableSelect label="Route" options={routeOptions} value={enrollmentForm.route} onChange={val => setEnrollmentForm({ ...enrollmentForm, route: val.toString() })} required />
                    <PremiumDateInput
                        label="Enrollment Start Date"
                        value={enrollmentForm.start_date}
                        onChange={(val) => setEnrollmentForm({ ...enrollmentForm, start_date: val })}
                        minDate={new Date().toISOString().split('T')[0]}
                        required
                    />
                    <div className="form-group">
                        <label className="label">Pickup Point</label>
                        <select className="select" value={enrollmentForm.pickup_point} onChange={e => setEnrollmentForm({ ...enrollmentForm, pickup_point: e.target.value })} required>
                            <option value="">Select Point...</option>
                            {pickupPoints.filter(p => p.route === Number(enrollmentForm.route)).map(p => <option key={p.id} value={p.id}>{p.point_name}</option>)}
                        </select>
                    </div>
                    <Button type="submit" className="w-full" loading={isSaving}>Enroll Student</Button>
                </form>
            </Modal>

            <Modal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} title="Log Fuel">
                <form onSubmit={handleFuelSubmit} className="space-y-4">
                    <PremiumDateInput
                        label="Date"
                        value={fuelForm.date}
                        onChange={(val) => setFuelForm({ ...fuelForm, date: val })}
                        minDate={new Date().toISOString().split('T')[0]}
                        required
                    />
                    <div className="form-group"><label className="label">Vehicle</label><select className="select" value={fuelForm.vehicle} onChange={e => setFuelForm({ ...fuelForm, vehicle: e.target.value })} required><option value="">Select Vehicle...</option>{vehicleOptions.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Liters</label><input type="number" className="input" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: parseFloat(e.target.value) })} /></div>
                        <div className="form-group"><label className="label">Amount</label><input type="number" className="input" value={fuelForm.amount} onChange={e => setFuelForm({ ...fuelForm, amount: parseFloat(e.target.value) })} /></div>
                    </div>
                    <Button type="submit" className="w-full" loading={isSaving}>Save Fuel</Button>
                </form>
            </Modal>

            <Modal isOpen={!!tripId && !_isTripModalOpen} onClose={() => setTripId(null)} title="Edit Trip Log">
                <form onSubmit={handleTripSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <PremiumDateInput
                            label="Trip Date"
                            value={tripForm.date}
                            onChange={(val) => setTripForm({ ...tripForm, date: val })}
                            minDate={new Date().toISOString().split('T')[0]}
                            required
                        />
                        <div className="form-group"><label className="label">Driver</label><select className="select" value={tripForm.driver} onChange={e => setTripForm({ ...tripForm, driver: e.target.value })}><option value="">Select Driver...</option>{driverOptions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Depart</label><input type="time" className="input" value={tripForm.start_time} onChange={e => setTripForm({ ...tripForm, start_time: e.target.value })} /></div>
                        <div className="form-group"><label className="label">Arrive</label><input type="time" className="input" value={tripForm.end_time} onChange={e => setTripForm({ ...tripForm, end_time: e.target.value })} /></div>
                    </div>
                    <Button type="submit" className="w-full" loading={isSaving}>Save Trip</Button>
                </form>
            </Modal>

            <Modal isOpen={!!maintenanceId && !_isMaintenanceModalOpen} onClose={() => setMaintenanceId(null)} title="Edit Maintenance">
                <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                    <PremiumDateInput
                        label="Date"
                        value={maintenanceForm.date}
                        onChange={(val) => setMaintenanceForm({ ...maintenanceForm, date: val })}
                        minDate={new Date().toISOString().split('T')[0]}
                        required
                    />
                    <div className="form-group"><label className="label">Description</label><textarea className="textarea" value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Cost</label><input type="number" className="input" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) })} /></div>
                        <div className="form-group"><label className="label">Status</label><select className="select" value={maintenanceForm.status} onChange={e => setMaintenanceForm({ ...maintenanceForm, status: e.target.value })}><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option></select></div>
                    </div>
                    <Button type="submit" className="w-full" loading={isSaving}>Save Record</Button>
                </form>
            </Modal>

            <Modal isOpen={!!incidentId && !_isSafetyModalOpen} onClose={() => setIncidentId(null)} title="Edit Incident">
                <form onSubmit={handleSafetySubmit} className="space-y-4">
                    <PremiumDateInput
                        label="Occurrence Date"
                        value={safetyForm.date}
                        onChange={(val) => setSafetyForm({ ...safetyForm, date: val })}
                        minDate={new Date().toISOString().split('T')[0]}
                        required
                    />
                    <div className="form-group"><label className="label">Description</label><textarea className="textarea" value={safetyForm.description} onChange={e => setSafetyForm({ ...safetyForm, description: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group"><label className="label">Type</label><input type="text" className="input" value={safetyForm.type} onChange={e => setSafetyForm({ ...safetyForm, type: e.target.value })} /></div>
                        <div className="form-group"><label className="label">Severity</label><select className="select" value={safetyForm.severity} onChange={e => setSafetyForm({ ...safetyForm, severity: e.target.value })}><option value="MINOR">Minor</option><option value="MAJOR">Major</option></select></div>
                    </div>
                    <Button type="submit" className="w-full" loading={isSaving}>Save Incident</Button>
                </form>
            </Modal>

            <style>{`
                .nav-tab-container { display: flex; gap: 1rem; border-bottom: 2px solid #e2e8f0; overflow-x: auto; }
                .nav-tab { padding: 0.75rem 1rem; font-weight: 700; color: #64748b; border: none; background: none; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
                .nav-tab.active { color: #1e3c72; border-bottom: 2px solid #1e3c72; background: rgba(30,60,114,0.05); }
                .fade-in { animation: fadeIn 0.3s ease-in; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .search-container { position: relative; width: 100%; }
                .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-input { padding-left: 2.5rem !important; border-radius: 9999px !important; }
            `}</style>
        </div>
    );
};

export default Transport;
