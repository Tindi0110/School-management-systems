import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Bus, Navigation, Users, Droplet, Download } from 'lucide-react';
import { transportAPI, studentsAPI } from '../api/api';
import { exportToCSV } from '../utils/export';
import { StatCard } from '../components/Card';
import Button from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

// Sub-components
import FleetManager from './transport/FleetManager';
import RouteManager from './transport/RouteManager';
import AllocationManager from './transport/AllocationManager';
import TripLogs from './transport/TripLogs';
import MaintenanceManager from './transport/MaintenanceManager';
import FuelManager from './transport/FuelManager';
import SafetyManager from './transport/SafetyManager';
import TransportModals from './transport/TransportModals';

// ─── Constants ─────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0];

const INITIAL_ENROLLMENT_FORM = { student: '', route: '', pickup_point: '', start_date: TODAY };
const INITIAL_VEHICLE_FORM = { registration_number: '', make_model: '', vehicle_type: 'BUS', seating_capacity: 14, status: 'ACTIVE', insurance_expiry: '' };
const INITIAL_ROUTE_FORM = { name: '', route_code: '', distance_km: 0, base_cost: 0 };
const INITIAL_POINT_FORM = { route_id: 0, point_name: '', pickup_time: '', dropoff_time: '', distance_from_school: 0, additional_cost: 0 };
const INITIAL_TRIP_FORM = { route: '', vehicle: '', date: TODAY, start_time: '', end_time: '', driver_name: '' };
const INITIAL_MAINTENANCE_FORM = { vehicle: '', description: '', cost: 0, date: TODAY, status: 'PENDING' };
const INITIAL_SAFETY_FORM = { vehicle: '', date: TODAY, type: 'ACCIDENT', description: '', severity: 'MINOR' };
const INITIAL_FUEL_FORM = { date: TODAY, vehicle: '', liters: 0, amount: 0, mileage: 0, receipt_no: '' };

// ─── Component ─────────────────────────────────────────────────────────────────
const Transport = () => {
    // ── Hooks ────────────────────────────────────────────────────────────────
    const toast = useToast();
    const { confirm } = useConfirm();

    // ── State: Active tab & global ────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('fleet');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // ── State: Data lists ─────────────────────────────────────────────────────
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [fuelRecords, setFuelRecords] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    // ── State: Pagination ─────────────────────────────────────────────────────
    const [pagination, setPagination] = useState({
        allocations: { page: 1, total: 0, pageSize: 15 },
        trips: { page: 1, total: 0, pageSize: 10 },
        maintenance: { page: 1, total: 0, pageSize: 10 },
        fuel: { page: 1, total: 0, pageSize: 15 },
        safety: { page: 1, total: 0, pageSize: 10 },
    });

    // ── State: Modal visibility ───────────────────────────────────────────────
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [isPointModalOpen, setIsPointModalOpen] = useState(false);
    const [isTripModalOpen, setIsTripModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
    const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);

    // ── State: Editing IDs ────────────────────────────────────────────────────
    const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
    const [vehicleId, setVehicleId] = useState<number | null>(null);
    const [routeId, setRouteId] = useState<number | null>(null);
    const [pointId, setPointId] = useState<number | null>(null);
    const [tripId, setTripId] = useState<number | null>(null);
    const [maintenanceId, setMaintenanceId] = useState<number | null>(null);
    const [incidentId, setIncidentId] = useState<number | null>(null);

    // ── State: Forms ──────────────────────────────────────────────────────────
    const [enrollmentForm, setEnrollmentForm] = useState(INITIAL_ENROLLMENT_FORM);
    const [vehicleForm, setVehicleForm] = useState(INITIAL_VEHICLE_FORM);
    const [routeForm, setRouteForm] = useState(INITIAL_ROUTE_FORM);
    const [pointForm, setPointForm] = useState(INITIAL_POINT_FORM);
    const [tripForm, setTripForm] = useState(INITIAL_TRIP_FORM);
    const [maintenanceForm, setMaintenanceForm] = useState(INITIAL_MAINTENANCE_FORM);
    const [safetyForm, setSafetyForm] = useState(INITIAL_SAFETY_FORM);
    const [fuelForm, setFuelForm] = useState(INITIAL_FUEL_FORM);

    // ── Debounced search ──────────────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPagination(prev => ({
                ...prev,
                allocations: { ...prev.allocations, page: 1 },
                trips: { ...prev.trips, page: 1 },
                maintenance: { ...prev.maintenance, page: 1 },
                fuel: { ...prev.fuel, page: 1 },
                safety: { ...prev.safety, page: 1 },
            }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ── Data loaders ──────────────────────────────────────────────────────────
    const loadBaseData = useCallback(async () => {
        try {
            const [vRes, rRes, pRes, sRes] = await Promise.all([
                transportAPI.vehicles.getAll({ page_size: 100 }),
                transportAPI.routes.getAll({ page_size: 200 }),
                transportAPI.pickupPoints.getAll({ page_size: 500 }),
                studentsAPI.getAll({ page_size: 1000 }),
            ]);
            setVehicles(vRes.data?.results ?? vRes.data ?? []);
            setRoutes(rRes.data?.results ?? rRes.data ?? []);
            setPickupPoints(pRes.data?.results ?? pRes.data ?? []);
            setStudents(sRes.data?.results ?? sRes.data ?? []);
        } catch {
            toast.error('Failed to load reference data.');
        }
    }, []);

    const loadTabData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'allocations') {
                const res = await transportAPI.allocations.getAll({ page: pagination.allocations.page, page_size: pagination.allocations.pageSize, search: debouncedSearch });
                setAllocations(res.data.results ?? []);
                setPagination(prev => ({ ...prev, allocations: { ...prev.allocations, total: res.data.count } }));
            } else if (activeTab === 'trips') {
                const res = await transportAPI.tripLogs.getAll({ page: pagination.trips.page, page_size: pagination.trips.pageSize, search: debouncedSearch });
                setTrips(res.data.results ?? []);
                setPagination(prev => ({ ...prev, trips: { ...prev.trips, total: res.data.count } }));
            } else if (activeTab === 'maintenance') {
                const res = await transportAPI.maintenance.getAll({ page: pagination.maintenance.page, page_size: pagination.maintenance.pageSize, search: debouncedSearch });
                setMaintenanceRecords(res.data.results ?? []);
                setPagination(prev => ({ ...prev, maintenance: { ...prev.maintenance, total: res.data.count } }));
            } else if (activeTab === 'fuel') {
                const res = await transportAPI.fuel.getAll({ page: pagination.fuel.page, page_size: pagination.fuel.pageSize, search: debouncedSearch });
                setFuelRecords(res.data.results ?? []);
                setPagination(prev => ({ ...prev, fuel: { ...prev.fuel, total: res.data.count } }));
            } else if (activeTab === 'safety') {
                const res = await transportAPI.incidents.getAll({ page: pagination.safety.page, page_size: pagination.safety.pageSize, search: debouncedSearch });
                setIncidents(res.data.results ?? []);
                setPagination(prev => ({ ...prev, safety: { ...prev.safety, total: res.data.count } }));
            }
        } catch {
            toast.error(`Failed to load ${activeTab} data.`);
        } finally {
            setLoading(false);
        }
    }, [activeTab, debouncedSearch, pagination.allocations.page, pagination.trips.page, pagination.maintenance.page, pagination.fuel.page, pagination.safety.page]);

    /** Refreshes both reference data and the current tab's paginated data. */
    const refreshData = useCallback(() => {
        loadBaseData();
        loadTabData();
    }, [loadBaseData, loadTabData]);

    useEffect(() => { loadBaseData(); }, []);
    useEffect(() => { loadTabData(); }, [activeTab, debouncedSearch, pagination.allocations.page, pagination.trips.page, pagination.maintenance.page, pagination.fuel.page, pagination.safety.page]);

    // ── Memoised derived values ───────────────────────────────────────────────
    const stats = useMemo(() => ({
        totalFleet: vehicles.length,
        activeRoutes: routes.length,
        totalEnrolled: allocations.filter(a => a?.status === 'ACTIVE').length,
        fuelCostTerm: fuelRecords.reduce((acc, f) => acc + (parseFloat(f?.amount) || 0), 0),
    }), [vehicles, routes, allocations, fuelRecords]);

    const studentOptions = useMemo(() => students.map(s => ({
        id: String(s.id),
        label: s.full_name,
        subLabel: `ID: ${s.admission_number}`,
    })), [students]);

    const routeOptions = useMemo(() => routes.map(r => ({
        id: String(r.id),
        label: `${r.route_code} - ${r.name}`,
        subLabel: `Cost: KES ${parseFloat(r.base_cost).toLocaleString()}`,
    })), [routes]);

    // ── Handlers: Enrollment ──────────────────────────────────────────────────
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
            setIsAllocationModalOpen(false);
            setEnrollmentId(null);
            setEnrollmentForm(INITIAL_ENROLLMENT_FORM);
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save enrollment.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditAllocation = (a: any) => {
        setEnrollmentId(a.id);
        setEnrollmentForm({ student: String(a.student), route: String(a.route), pickup_point: String(a.pickup_point), start_date: a.start_date });
        setIsAllocationModalOpen(true);
    };

    const handleDeleteAllocation = async (id: number) => {
        if (!await confirm('Remove this student from transport?', { type: 'danger' })) return;
        try {
            await transportAPI.allocations.delete(id);
            toast.success('Enrollment removed successfully');
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to remove enrollment');
        }
    };

    // ── Handlers: Vehicles ────────────────────────────────────────────────────
    const handleVehicleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { ...vehicleForm, insurance_expiry: vehicleForm.insurance_expiry || null };
            if (vehicleId) {
                await transportAPI.vehicles.update(vehicleId, payload);
                toast.success('Vehicle information updated');
            } else {
                await transportAPI.vehicles.create(payload);
                toast.success('New vehicle registered to fleet');
            }
            setIsVehicleModalOpen(false);
            setVehicleId(null);
            setVehicleForm(INITIAL_VEHICLE_FORM);
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save vehicle');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditVehicle = (v: any) => {
        setVehicleId(v.id);
        setVehicleForm({ registration_number: v.registration_number, make_model: v.make_model, vehicle_type: v.vehicle_type, seating_capacity: v.seating_capacity, status: v.status, insurance_expiry: v.insurance_expiry || '' });
        setIsVehicleModalOpen(true);
    };

    const handleDeleteVehicle = async (id: number) => {
        if (!await confirm('Delete this vehicle? This action cannot be undone.', { type: 'danger' })) return;
        try {
            await transportAPI.vehicles.delete(id);
            toast.success('Vehicle removed from fleet');
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Could not delete — vehicle may be linked to trips or maintenance records.');
        }
    };

    // ── Handlers: Routes ──────────────────────────────────────────────────────
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
            setIsRouteModalOpen(false);
            setRouteId(null);
            setRouteForm(INITIAL_ROUTE_FORM);
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save route.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditRoute = (r: any) => {
        setRouteId(r.id);
        setRouteForm({ name: r.name, route_code: r.route_code, distance_km: parseFloat(r.distance_km || 0), base_cost: parseFloat(r.base_cost || 0) });
        setIsRouteModalOpen(true);
    };

    const handleDeleteRoute = async (id: number) => {
        if (!await confirm('Delete this route? All linked pickup points and allocations will be affected.', { type: 'danger' })) return;
        try {
            await transportAPI.routes.delete(id);
            toast.success('Route deleted successfully');
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete route — check for linked allocations.');
        }
    };

    // ── Handlers: Pickup Points ───────────────────────────────────────────────
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
                additional_cost: parseFloat(calculatedCost.toFixed(2)),
            };
            if (pointId) {
                await transportAPI.pickupPoints.update(pointId, payload);
                toast.success('Pickup point updated');
            } else {
                await transportAPI.pickupPoints.create(payload);
                toast.success(`Service point added — fee set to KES ${payload.additional_cost}`);
            }
            setIsPointModalOpen(false);
            setPointId(null);
            setPointForm(INITIAL_POINT_FORM);
            refreshData();
        } catch (error: any) {
            toast.error(`Failed to save pickup point: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditPoint = (p: any) => {
        setPointId(p.id);
        setPointForm({ route_id: p.route, point_name: p.point_name, pickup_time: p.pickup_time, dropoff_time: p.dropoff_time, distance_from_school: parseFloat(p.distance_from_school || 0), additional_cost: parseFloat(p.additional_cost) });
        setIsPointModalOpen(true);
    };

    const handleDeletePoint = async (id: number) => {
        if (!await confirm('Delete this pickup point?', { type: 'danger' })) return;
        try {
            await transportAPI.pickupPoints.delete(id);
            toast.success('Pickup point deleted');
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete point.');
        }
    };

    // ── Handlers: Trip Logs ───────────────────────────────────────────────────
    const handleTripSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripForm.route || !tripForm.vehicle || !tripForm.driver_name) {
            toast.error('Please fill in all required fields: Route, Vehicle, and Driver.');
            return;
        }
        setIsSaving(true);
        try {
            const payload = { route: Number(tripForm.route), vehicle: Number(tripForm.vehicle), date: tripForm.date, departure_time: tripForm.start_time, arrival_time: tripForm.end_time, attendant: tripForm.driver_name, trip_type: 'MORNING', driver: null };
            if (tripId) {
                await transportAPI.tripLogs.update(tripId, payload);
                toast.success('Trip log updated');
            } else {
                await transportAPI.tripLogs.create(payload);
                toast.success('Trip log recorded');
            }
            setIsTripModalOpen(false);
            setTripId(null);
            setTripForm(INITIAL_TRIP_FORM);
            refreshData();
        } catch (error: any) {
            toast.error(`Failed to save trip log: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditTrip = (t: any) => {
        setTripId(t.id);
        setTripForm({ route: String(t.route), vehicle: String(t.vehicle), date: t.date, start_time: t.start_time, end_time: t.end_time, driver_name: t.driver_name });
        setIsTripModalOpen(true);
    };

    const handleDeleteTrip = async (id: number) => {
        if (!await confirm('Delete this trip log?', { type: 'danger' })) return;
        try {
            await transportAPI.tripLogs.delete(id);
            toast.success('Trip log deleted');
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete trip log.');
        }
    };

    // ── Handlers: Maintenance ─────────────────────────────────────────────────
    const handleMaintenanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!maintenanceForm.vehicle || !maintenanceForm.description) {
            toast.error('Please select a vehicle and describe the issue.');
            return;
        }
        setIsSaving(true);
        try {
            const payload = { vehicle: Number(maintenanceForm.vehicle), description: maintenanceForm.description, cost: maintenanceForm.cost, service_date: maintenanceForm.date, status: maintenanceForm.status };
            if (maintenanceId) {
                await transportAPI.maintenance.update(maintenanceId, payload);
                toast.success('Maintenance record updated');
            } else {
                await transportAPI.maintenance.create(payload);
                toast.success('Maintenance request logged');
            }
            setIsMaintenanceModalOpen(false);
            setMaintenanceId(null);
            setMaintenanceForm(INITIAL_MAINTENANCE_FORM);
            refreshData();
        } catch (error: any) {
            toast.error(`Failed to save maintenance record: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditMaintenance = (m: any) => {
        setMaintenanceId(m.id);
        setMaintenanceForm({ vehicle: String(m.vehicle), description: m.description, cost: parseFloat(m.cost), date: m.date, status: m.status });
        setIsMaintenanceModalOpen(true);
    };

    const handleDeleteMaintenance = async (id: number) => {
        if (!await confirm('Delete this maintenance record?', { type: 'danger' })) return;
        try {
            await transportAPI.maintenance.delete(id);
            toast.success('Maintenance record deleted');
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete maintenance record.');
        }
    };

    // ── Handlers: Safety / Incidents ──────────────────────────────────────────
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
            setIsSafetyModalOpen(false);
            setIncidentId(null);
            setSafetyForm(INITIAL_SAFETY_FORM);
            refreshData();
        } catch (error: any) {
            toast.error(`Failed to save incident report: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditIncident = (i: any) => {
        setIncidentId(i.id);
        setSafetyForm({ vehicle: String(i.vehicle), date: i.date, type: i.type, description: i.description, severity: i.severity });
        setIsSafetyModalOpen(true);
    };

    const handleDeleteIncident = async (id: number) => {
        if (!await confirm('Delete this incident report?', { type: 'danger' })) return;
        try {
            await transportAPI.incidents.delete(id);
            toast.success('Incident report deleted');
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete incident.');
        }
    };

    // ── Handlers: Fuel ────────────────────────────────────────────────────────
    const handleLogFuel = (v: any) => {
        setFuelForm({ ...INITIAL_FUEL_FORM, vehicle: String(v.id) });
        setIsFuelModalOpen(true);
    };

    const handleFuelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await transportAPI.fuel.create({ ...fuelForm, vehicle: Number(fuelForm.vehicle) });
            toast.success('Fuel record saved & synced to Finance');
            setIsFuelModalOpen(false);
            setFuelForm(INITIAL_FUEL_FORM);
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to save fuel record.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFuel = async (id: number) => {
        if (!await confirm('Delete this fuel record?', { type: 'danger' })) return;
        try {
            await transportAPI.fuel.delete(id);
            toast.success('Fuel record deleted');
            refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete fuel record.');
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const handleExport = () => {
        const exportMap: Record<string, any[]> = {
            allocations: allocations,
            routes: routes,
            trips: trips,
            maintenance: maintenanceRecords,
            fuel: fuelRecords,
        };
        const data = exportMap[activeTab] ?? [];
        exportToCSV(data, `Transport_${activeTab}`);
    };

    const handlePageChange = (tab: keyof typeof pagination, page: number) => {
        setPagination(prev => ({ ...prev, [tab]: { ...prev[tab], page } }));
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="fade-in px-4">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Institutional Logistics</h1>
                    <p className="text-secondary text-sm font-medium">Fleet management, route optimization, and student safety</p>
                </div>
                <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                    <Button variant="outline" size="sm" onClick={() => { setEnrollmentId(null); setEnrollmentForm(INITIAL_ENROLLMENT_FORM); setIsAllocationModalOpen(true); }} icon={<Plus size={14} />}>
                        Enroll Student
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => { setVehicleId(null); setVehicleForm(INITIAL_VEHICLE_FORM); setIsVehicleModalOpen(true); }} icon={<Bus size={18} />}>
                        Add Bus
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
                <StatCard title="Fleet Size" value={stats.totalFleet} icon={<Bus />} gradient="linear-gradient(135deg, #1e3c72, #2a5298)" />
                <StatCard title="Active Routes" value={stats.activeRoutes} icon={<Navigation />} gradient="linear-gradient(135deg, #4facfe, #00f2fe)" />
                <StatCard title="Enrollments" value={stats.totalEnrolled} icon={<Users />} gradient="linear-gradient(135deg, #667eea, #764ba2)" />
                <StatCard title="Fuel (Term)" value={`KES ${stats.fuelCostTerm.toLocaleString()}`} icon={<Droplet />} gradient="linear-gradient(135deg, #f093fb, #f5576c)" />
            </div>

            {/* Tab Navigation */}
            <div className="nav-tab-container no-print">
                {(['fleet', 'routes', 'allocations', 'trips', 'maintenance', 'fuel', 'safety'] as const).map(tab => (
                    <button key={tab} className={`nav-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab === 'fleet' ? 'Fleet' : tab === 'routes' ? 'Routes' : tab === 'allocations' ? 'Allocations' : tab === 'trips' ? 'Trip Logs' : tab === 'maintenance' ? 'Repairs' : tab === 'fuel' ? 'Fuel' : 'Safety'}
                    </button>
                ))}
            </div>

            {/* Search & Export toolbar */}
            <div className="card mb-6 no-print p-4">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="relative flex-grow w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            className="input pl-10 h-11 bg-slate-50 border-transparent focus:bg-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExport} icon={<Download size={14} />}>
                        Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </Button>
                </div>
            </div>

            {/* Tab Content */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="spinner" />
                </div>
            ) : (
                <>
                    {activeTab === 'fleet' && (
                        <FleetManager
                            vehicles={vehicles}
                            searchTerm={searchTerm}
                            onEdit={handleEditVehicle}
                            onDelete={handleDeleteVehicle}
                            onLogFuel={handleLogFuel}
                            onAdd={() => { setVehicleId(null); setVehicleForm(INITIAL_VEHICLE_FORM); setIsVehicleModalOpen(true); }}
                        />
                    )}
                    {activeTab === 'routes' && (
                        <RouteManager
                            routes={routes}
                            pickupPoints={pickupPoints}
                            searchTerm={searchTerm}
                            onEditRoute={handleEditRoute}
                            onDeleteRoute={handleDeleteRoute}
                            onAddRoute={() => { setRouteId(null); setRouteForm(INITIAL_ROUTE_FORM); setIsRouteModalOpen(true); }}
                            onEditPoint={handleEditPoint}
                            onDeletePoint={handleDeletePoint}
                            onAddPoint={routeId => { setPointId(null); setPointForm({ ...INITIAL_POINT_FORM, route_id: routeId }); setIsPointModalOpen(true); }}
                        />
                    )}
                    {activeTab === 'allocations' && (
                        <AllocationManager
                            allocations={allocations}
                            searchTerm={searchTerm}
                            onEdit={handleEditAllocation}
                            onDelete={handleDeleteAllocation}
                            page={pagination.allocations.page}
                            total={pagination.allocations.total}
                            pageSize={pagination.allocations.pageSize}
                            onPageChange={p => handlePageChange('allocations', p)}
                        />
                    )}
                    {activeTab === 'trips' && (
                        <TripLogs
                            trips={trips}
                            onAdd={() => { setTripId(null); setTripForm(INITIAL_TRIP_FORM); setIsTripModalOpen(true); }}
                            onEdit={handleEditTrip}
                            onDelete={handleDeleteTrip}
                            page={pagination.trips.page}
                            total={pagination.trips.total}
                            pageSize={pagination.trips.pageSize}
                            onPageChange={p => handlePageChange('trips', p)}
                        />
                    )}
                    {activeTab === 'maintenance' && (
                        <MaintenanceManager
                            records={maintenanceRecords}
                            vehicles={vehicles}
                            onAdd={() => { setMaintenanceId(null); setMaintenanceForm(INITIAL_MAINTENANCE_FORM); setIsMaintenanceModalOpen(true); }}
                            onEdit={handleEditMaintenance}
                            onDelete={handleDeleteMaintenance}
                            page={pagination.maintenance.page}
                            total={pagination.maintenance.total}
                            pageSize={pagination.maintenance.pageSize}
                            onPageChange={p => handlePageChange('maintenance', p)}
                        />
                    )}
                    {activeTab === 'fuel' && (
                        <FuelManager
                            records={fuelRecords}
                            vehicles={vehicles}
                            onDelete={handleDeleteFuel}
                            page={pagination.fuel.page}
                            total={pagination.fuel.total}
                            pageSize={pagination.fuel.pageSize}
                            onPageChange={p => handlePageChange('fuel', p)}
                        />
                    )}
                    {activeTab === 'safety' && (
                        <SafetyManager
                            incidents={incidents}
                            vehicles={vehicles}
                            onAdd={() => { setIncidentId(null); setSafetyForm(INITIAL_SAFETY_FORM); setIsSafetyModalOpen(true); }}
                            onEdit={handleEditIncident}
                            onDelete={handleDeleteIncident}
                            page={pagination.safety.page}
                            total={pagination.safety.total}
                            pageSize={pagination.safety.pageSize}
                            onPageChange={p => handlePageChange('safety', p)}
                        />
                    )}
                </>
            )}

            {/* Modals */}
            <TransportModals
                modals={{ isAllocationModalOpen, isVehicleModalOpen, isRouteModalOpen, isPointModalOpen, isTripModalOpen, isMaintenanceModalOpen, isSafetyModalOpen, isFuelModalOpen }}
                forms={{ enrollmentForm, vehicleForm, routeForm, pointForm, tripForm, maintenanceForm, safetyForm, fuelForm }}
                data={{ studentOptions, routeOptions, pickupPoints, vehicles, routes }}
                handlers={{
                    setIsAllocationModalOpen, setIsVehicleModalOpen, setIsRouteModalOpen,
                    setIsPointModalOpen, setIsTripModalOpen, setIsMaintenanceModalOpen,
                    setIsSafetyModalOpen, setIsFuelModalOpen,
                    setEnrollmentForm, setVehicleForm, setRouteForm, setPointForm,
                    setTripForm, setMaintenanceForm, setSafetyForm, setFuelForm,
                    handleEnrollmentSubmit, handleVehicleSubmit, handleRouteSubmit,
                    handlePointSubmit, handleTripSubmit, handleMaintenanceSubmit,
                    handleSafetySubmit, handleFuelSubmit,
                }}
                status={{ isSaving, enrollmentId, vehicleId, routeId, pointId, tripId, maintenanceId, incidentId }}
            />
        </div>
    );
};

export default Transport;
