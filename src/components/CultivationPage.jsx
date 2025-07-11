// src/components/CultivationPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { api } from '../App'; // Asegúrate de que esta importación sea correcta
import {
  Box, Typography, Button, CircularProgress, Snackbar, Alert,
  TextField, Paper, Divider, IconButton, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GrassIcon from '@mui/icons-material/Grass';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History'; // Icono para trazabilidad
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Icono para movimiento
import EcoIcon from '@mui/icons-material/Agriculture'; // Icono para evento de cultivo
import HarvestIcon from '@mui/icons-material/LocalFlorist'; // Icono para cosecha (usando flor)
import ScienceIcon from '@mui/icons-material/Science'; // Icono para muestreo
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'; // Icono para destrucción
import CloseIcon from '@mui/icons-material/Close';

import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Constantes para Mensajes y Textos ---
const SNACK_MESSAGES = {
  FACILITIES_ERROR: 'Error al cargar instalaciones.',
  STAGES_ERROR: 'Error al cargar etapas.',
  TENANTS_ERROR: 'Error al cargar inquilinos.',
  CULTIVATION_AREAS_ERROR: 'Error al cargar áreas de cultivo.',
  STAGE_NAME_REQUIRED: 'El nombre de la etapa es obligatorio.',
  STAGE_NAME_LENGTH_EXCEEDED: 'El nombre de la etapa no puede exceder los 100 caracteres.',
  STAGE_NAME_INVALID_CHARS: 'El nombre no puede contener caracteres especiales como <, >, o {}.',
  FACILITY_NAME_REQUIRED: 'El nombre de la instalación es obligatorio.',
  FACILITY_NAME_LENGTH_EXCEEDED: 'El nombre de la instalación no puede exceder los 100 caracteres.',
  FACILITY_NAME_INVALID_CHARS: 'El nombre no puede contener caracteres especiales como <, >, o {}.',
  AREA_NAME_REQUIRED: 'El nombre del área de cultivo es obligatorio.',
  AREA_NAME_LENGTH_EXCEEDED: 'El nombre del área no puede exceder los 100 caracteres.',
  AREA_NAME_INVALID_CHARS: 'El nombre no puede contener caracteres especiales como <, >, o {}.',
  AREA_FACILITY_REQUIRED: 'Debe seleccionar una instalación para el área.',
  TENANT_ID_MISSING: 'No se pudo determinar el Tenant ID.',
  STAGE_UPDATED: 'Etapa actualizada.',
  STAGE_CREATED: 'Etapa creada.',
  STAGE_DELETED: 'Etapa eliminada.',
  FACILITY_CREATED: 'Instalación creada exitosamente.',
  CULTIVATION_AREA_UPDATED: 'Área de cultivo actualizada.',
  CULTIVATION_AREA_CREATED: 'Área de cultivo creada.',
  CULTIVATION_AREA_DELETED: 'Área de cultivo eliminada.',
  CULTIVATION_AREA_MOVED: 'Área de cultivo movida.',
  DRAG_PERMISSION_DENIED: 'No tienes permiso para mover áreas como Operador de Instalación.',
  GENERAL_ERROR_SAVING_STAGE: 'Error al guardar etapa:',
  GENERAL_ERROR_SAVING_FACILITY: 'Error al crear instalación:',
  GENERAL_ERROR_SAVING_AREA: 'Error al guardar área de cultivo:',
  PERMISSION_DENIED: 'No tienes permisos para realizar esta acción.',
  VALIDATION_ERROR: 'Error de validación:',
  INVALID_DATA: 'Datos inválidos:',
  ERROR_DRAGGING: 'Error al arrastrar. Recargando datos...',
  CANNOT_DELETE_AREA_WITH_BATCHES: 'No se puede eliminar el área de cultivo: Tiene lotes asociados.',
  EVENT_REGISTERED_SUCCESS: 'Evento de trazabilidad registrado con éxito (simulado).',
  BATCH_CREATED: 'Lote creado exitosamente.',
  BATCH_NAME_REQUIRED: 'El nombre del lote es obligatorio.',
  BATCH_UNITS_REQUIRED: 'Las unidades actuales del lote son obligatorias.',
  BATCH_END_TYPE_REQUIRED: 'El tipo de finalización del lote es obligatorio.',
  BATCH_VARIETY_REQUIRED: 'La variedad del lote es obligatoria.',
};

const DIALOG_TITLES = {
  CONFIRM_STAGE_DELETION: 'Confirmar Eliminación de Etapa',
  CONFIRM_AREA_DELETION: 'Confirmar Eliminación de Área de Cultivo',
  EDIT_STAGE: 'Editar Etapa',
  CREATE_STAGE: 'Crear Nueva Etapa',
  CREATE_FACILITY: 'Crear Nueva Instalación',
  EDIT_AREA: 'Editar Área de Cultivo',
  CREATE_AREA: 'Crear Nueva Área de Cultivo',
  AREA_DETAIL: 'Detalle del Área:',
  REGISTER_EVENT: 'Registrar Evento de Trazabilidad',
  ADD_BATCH: 'Añadir Nuevo Lote',
};

const BUTTON_LABELS = {
  CANCEL: 'Cancelar',
  CONFIRM: 'Confirmar',
  SAVE_CHANGES: 'Guardar Cambios',
  CREATE_STAGE: 'Crear Etapa',
  ADD_FACILITY: 'Añadir Instalación',
  ADD_STAGE: 'Añadir Etapa',
  CREATE_FACILITY: 'Crear Instalación',
  ADD_CULTIVATION_AREA: 'Añadir un Área de Cultivo',
  CREATE_AREA: 'Crear Área',
  ADVANCE_STAGE: 'Avanzar Etapa',
  CREATE_SAMPLE: 'Crear Muestra',
  ADD_NEW_BATCH: 'Añadir Nuevo Lote',
  CLOSE: 'Cerrar',
  REGISTER_MOVEMENT: 'Registrar Movimiento',
  REGISTER_CULTIVATION_EVENT: 'Registrar Evento de Cultivo',
  REGISTER_HARVEST: 'Registrar Cosecha',
  REGISTER_SAMPLING: 'Registrar Muestreo',
  REGISTER_DESTRUCTION: 'Registrar Destrucción',
  REGISTER: 'Registrar',
  CREATE_BATCH: 'Crear Lote',
};

// --- Componente de Diálogo de Confirmación Genérico ---
const ConfirmationDialog = ({ open, title, message, onConfirm, onCancel }) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{ sx: { bgcolor: '#2d3748', color: '#e2e8f0', borderRadius: 2 } }}
    >
      <DialogTitle id="alert-dialog-title" sx={{ color: '#e2e8f0' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography id="alert-dialog-description" sx={{ color: '#a0aec0' }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} sx={{ color: '#a0aec0' }}>
          {BUTTON_LABELS.CANCEL}
        </Button>
        <Button onClick={onConfirm} color="error" autoFocus sx={{ color: '#fc8181' }}>
          {BUTTON_LABELS.CONFIRM}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConfirmationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

// --- Componente: BatchItem ---
const BatchItem = ({ batch, setParentSnack, isFacilityOperator }) => {
  const handleAdvanceStage = () => setParentSnack(`Avanzar etapa del lote: ${batch.name}`, 'info');
  const handleCreateSample = () => setParentSnack(`Crear muestra del lote: ${batch.name}`, 'info');

  return (
    <Paper elevation={1} sx={{ p: 1.5, mb: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
        Lote: {batch.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Unidades: {batch.current_units}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Variedad: {batch.variety}
      </Typography>
      {batch.advance_to_harvesting_on && (
        <Typography variant="body2" color="text.secondary">
          Cosecha: {new Date(batch.advance_to_harvesting_on).toLocaleDateString()}
        </Typography>
      )}
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button size="small" variant="outlined" onClick={handleAdvanceStage} disabled={isFacilityOperator}>{BUTTON_LABELS.ADVANCE_STAGE}</Button>
        <Button size="small" variant="outlined" onClick={handleCreateSample} disabled={isFacilityOperator}>{BUTTON_LABELS.CREATE_SAMPLE}</Button>
      </Box>
    </Paper>
  );
};

BatchItem.propTypes = {
  batch: PropTypes.object.isRequired,
  setParentSnack: PropTypes.func.isRequired,
  isFacilityOperator: PropTypes.bool.isRequired,
};

// --- Componente: CultivationAreaContent ---
const CultivationAreaContent = ({ area, handleEdit, handleDelete, isFacilityOperator, setParentSnack }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', flexGrow: 1, pr: 1 }}>
          <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
          {area.name}
        </Typography>
        <Box>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleEdit(area); }}
            sx={{ p: 0.5 }}
            aria-label={`Editar área ${area.name}`}
            disabled={isFacilityOperator}
          >
            <EditIcon sx={{ fontSize: 16, color: isFacilityOperator ? '#666' : '#004d80' }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleDelete(area); }}
            sx={{ p: 0.5 }}
            aria-label={`Eliminar área ${area.name}`}
            disabled={isFacilityOperator}
          >
            <DeleteIcon sx={{ fontSize: 16, color: isFacilityOperator ? '#666' : '#004d80' }} />
          </IconButton>
        </Box>
      </Box>
      {area.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 13, color: '#555' }}>
          {area.description.length > 70 ? `${area.description.substring(0, 70)}...` : area.description}
        </Typography>
      )}
      {area.capacity_units && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 13, color: '#555' }}>
          Capacidad: {area.capacity_units} {area.capacity_unit_type || 'unidades'}
        </Typography>
      )}
      {area.batches && area.batches.length > 0 && (
        <Typography variant="body2" sx={{ mt: 0.5, fontSize: 13, fontWeight: 500, color: '#444' }}>
          Lotes: {area.batches.length}
        </Typography>
      )}
    </Box>
  );
};

CultivationAreaContent.propTypes = {
  area: PropTypes.object.isRequired,
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func,
  isFacilityOperator: PropTypes.bool.isRequired,
  setParentSnack: PropTypes.func.isRequired,
};

// --- Componente: CultivationAreaItem ---
const CultivationAreaItem = React.memo(({ area, handleEdit, handleDelete, setParentSnack, isFacilityOperator, isGlobalAdmin, handleOpenAreaDetail }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: area.id,
    data: {
      type: 'CultivationArea',
      cultivationArea: area,
    },
    disabled: isFacilityOperator,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 9999 : 'auto',
    marginBottom: '12px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    padding: '12px',
    cursor: isFacilityOperator ? 'default' : (isDragging ? 'grabbing' : 'grab'),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => handleOpenAreaDetail(area)}>
      <CultivationAreaContent
        area={area}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        isFacilityOperator={isFacilityOperator}
        setParentSnack={setParentSnack}
      />
    </div>
  );
});

CultivationAreaItem.propTypes = {
  area: PropTypes.object.isRequired,
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func,
  setParentSnack: PropTypes.func.isRequired,
  isFacilityOperator: PropTypes.bool.isRequired,
  isGlobalAdmin: PropTypes.bool.isRequired,
  handleOpenAreaDetail: PropTypes.func.isRequired,
};

// --- Componente: StageView ---
const StageView = React.memo(({ stage, cultivationAreas, tenantId, refreshCultivationAreas, handleDeleteStage, setParentSnack, setParentConfirmDialog, setParentConfirmDialogOpen, selectedFacilityId, facilities, isFacilityOperator, isGlobalAdmin }) => {
  const [openAddAreaDialog, setOpenAddAreaDialog] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState(''); 
  const [areaCapacityUnits, setAreaCapacityUnits] = useState('');
  const [areaCapacityUnitType, setAreaCapacityUnitType] = useState('');
  const [areaFacilityId, setAreaFacilityId] = useState(selectedFacilityId);
  const [editingArea, setEditingArea] = useState(null);
  const [areaDialogLoading, setAreaDialogLoading] = useState(false);

  // --- Estados y Handlers para el nuevo módulo de Trazabilidad (dentro de StageView para el diálogo de detalle de área) ---
  const [openAreaDetailDialog, setOpenAreaDetailDialog] = useState(false);
  const [currentAreaDetail, setCurrentAreaDetail] = useState(null); // El área de cultivo seleccionada para ver el detalle
  const [traceabilityEvents, setTraceabilityEvents] = useState([]); // Datos simulados por ahora

  // Estados para el diálogo de registro de eventos (ahora dentro de StageView)
  const [openRegisterEventDialog, setOpenRegisterEventDialog] = useState(false);
  const [currentEventType, setCurrentEventType] = useState(''); // 'movement', 'cultivation', 'harvest', 'sampling', 'destruction'
  const [eventBatchId, setEventBatchId] = useState('');
  const [eventQuantity, setEventQuantity] = useState('');
  const [eventUnit, setEventUnit] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventFromLocation, setEventFromLocation] = useState(''); // Para movimientos
  const [eventToLocation, setEventToLocation] = useState('');     // Para movimientos
  const [eventMethod, setEventMethod] = useState('');             // Para destrucción / tipo de cultivo
  const [eventReason, setEventReason] = useState('');             // Para destrucción / propósito muestreo
  const [eventNewBatchId, setEventNewBatchId] = useState('');     // Para cosecha

  // Estados para el diálogo de añadir lote
  const [openAddBatchDialog, setOpenAddBatchDialog] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchCurrentUnits, setBatchCurrentUnits] = useState('');
  const [batchEndType, setBatchEndType] = useState('');
  const [batchVariety, setBatchVariety] = useState('');
  const [batchProjectedYield, setBatchProjectedYield] = useState('');
  const [batchAdvanceToHarvestingOn, setBatchAdvanceToHarvestingOn] = useState('');
  const [batchDialogLoading, setBatchDialogLoading] = useState(false);

  // Obtener los lotes actualmente en esta área para el filtro de trazabilidad
  const batchesInCurrentArea = useMemo(() => {
    return currentAreaDetail?.batches || [];
  }, [currentAreaDetail]);

  const [selectedBatchForTraceability, setSelectedBatchForTraceability] = useState('all'); // Filtro de lotes para trazabilidad

  // Función para cargar los lotes de un área específica
  const fetchBatchesForArea = useCallback(async (areaId) => {
    console.log('fetchBatchesForArea: Current tenantId from props:', tenantId);
    console.log('fetchBatchesForArea: isGlobalAdmin from props:', isGlobalAdmin);
    console.log('fetchBatchesForArea: selectedFacilityId from props:', selectedFacilityId);
    console.log('fetchBatchesForArea: facilities from props:', facilities);


    const headers = {};
    let effectiveTenantId = null;

    if (isGlobalAdmin) {
      if (selectedFacilityId) {
        const selectedFac = facilities.find(f => f.id === selectedFacilityId);
        if (selectedFac && selectedFac.tenant_id) {
          effectiveTenantId = String(selectedFac.tenant_id);
          console.log('fetchBatchesForArea: Global Admin, using X-Tenant-ID from selected facility:', effectiveTenantId);
        } else {
          setParentSnack('Error: Como Super Admin, la instalación seleccionada no tiene un Tenant ID válido para cargar lotes.', 'error');
          return []; // Previene la llamada a la API si no hay tenant_id válido
        }
      } else {
        setParentSnack('Error: Como Super Admin, debe seleccionar una instalación para cargar lotes.', 'error');
        return []; // Previene la llamada a la API si no hay instalación seleccionada
      }
    } else if (tenantId) {
      effectiveTenantId = String(tenantId);
      console.log('fetchBatchesForArea: Tenant user, using X-Tenant-ID from user:', effectiveTenantId);
    } else {
      setParentSnack('Error: No se pudo determinar el Tenant ID para cargar lotes.', 'error');
      return []; // Previene la llamada a la API si no hay tenant_id
    }

    if (effectiveTenantId) {
      headers['X-Tenant-ID'] = effectiveTenantId;
    }

    try {
      const response = await api.get(`/cultivation-areas/${areaId}/batches`, { headers }); // Pasa los headers aquí
      console.log('fetchBatchesForArea: Batches fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('fetchBatchesForArea: Error fetching batches for area:', error.response?.data || error.message);
      setParentSnack('Error al cargar lotes para el área.', 'error');
      return [];
    }
  }, [setParentSnack, tenantId, isGlobalAdmin, selectedFacilityId, facilities]); // Añade facilities a las dependencias

  // Mock data for traceability events (replace with API call later)
  const fetchTraceabilityEvents = useCallback(async (areaId) => {
    // Simula una llamada API
    return new Promise(resolve => {
      setTimeout(() => {
        const mockEvents = [
          { id: 1, date: '2025-07-01 08:00', type: 'Entrada de Lote', batch: 'LoteA', details: 'Lote transferido desde Propagación.', user: 'Eduard Berrio' },
          { id: 2, date: '2025-07-01 08:00', type: 'Entrada de Lote', batch: 'LoteB', details: 'Lote transferido desde Propagación.', user: 'Eduard Berrio' },
          { id: 3, date: '2025-07-03 10:30', type: 'Aplicación Nutriente', batch: 'LoteA', details: 'Aplicación de Nutriente X (50g).', user: 'Juan Pérez' },
          { id: 4, date: '2025-07-05 02:00', type: 'Riego', batch: 'LoteA, LoteB', details: 'Riego general del área.', user: 'Ana Gómez' },
          { id: 5, date: '2025-07-08 09:00', type: 'Muestreo', batch: 'LoteA', details: 'Muestra tomada para análisis de THC.', user: 'Eduard Berrio' },
          { id: 6, date: '2025-07-10 03:00', type: 'Salida de Lote', batch: 'LoteA', details: 'Lote transferido a Vegetación (Room3).', user: 'Juan Pérez' },
          { id: 7, date: '2025-07-15 11:00', type: 'Cosecha', batch: 'LoteB', details: 'Cosecha completada. Peso húmedo: 2.5 kg.', user: 'Ana Gómez' },
          { id: 8, date: '2025-07-15 11:30', type: 'Salida de Lote', batch: 'LoteB', details: 'Lote de cosecha transferido a Área de Secado.', user: 'Ana Gómez' },
        ];
        // Filtra por lote si se selecciona uno
        const filteredEvents = selectedBatchForTraceability === 'all'
          ? mockEvents
          : mockEvents.filter(event => event.batch.includes(selectedBatchForTraceability));
        resolve(filteredEvents);
      }, 500); // Simula un delay de red
    });
  }, [selectedBatchForTraceability]);

  const handleOpenAreaDetail = useCallback(async (area) => {
    setOpenAreaDetailDialog(true);
    console.log('StageView: Opening area detail for:', area);
    console.log('StageView: Tenant ID available (from props):', tenantId);
    console.log('StageView: isGlobalAdmin available (from props):', isGlobalAdmin);

    // Carga los lotes y eventos para el área seleccionada
    try {
        const batches = await fetchBatchesForArea(area.id);
        const events = await fetchTraceabilityEvents(area.id);
        setCurrentAreaDetail({ ...area, batches: batches }); // Actualiza el currentAreaDetail con los lotes reales
        setTraceabilityEvents(events);
    } catch (error) {
        console.error('StageView: Error in handleOpenAreaDetail:', error);
        setParentSnack('Error al cargar detalles del área o lotes.', 'error');
    }
  }, [fetchBatchesForArea, fetchTraceabilityEvents, tenantId, isGlobalAdmin, setParentSnack]);

  const handleCloseAreaDetail = useCallback(() => {
    setOpenAreaDetailDialog(false);
    setCurrentAreaDetail(null);
    setTraceabilityEvents([]);
    setSelectedBatchForTraceability('all'); // Resetear filtro al cerrar
  }, []);

  // Handlers para el diálogo de registro de eventos
  const handleOpenRegisterEventDialog = useCallback((eventType) => {
    setCurrentEventType(eventType);
    // Resetear campos del formulario al abrir
    setEventBatchId('');
    setEventQuantity('');
    setEventUnit('');
    setEventDescription('');
    setEventFromLocation('');
    setEventToLocation('');
    setEventMethod('');
    setEventReason('');
    setEventNewBatchId('');
    setOpenRegisterEventDialog(true);
  }, []);

  const handleCloseRegisterEventDialog = useCallback(() => {
    setOpenRegisterEventDialog(false);
    setCurrentEventType('');
  }, []);

  const handleRegisterEvent = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar los datos a la API de trazabilidad
    // Por ahora, solo mostramos un snackbar
    setParentSnack(SNACK_MESSAGES.EVENT_REGISTERED_SUCCESS, 'success');
    handleCloseRegisterEventDialog();
    // En una implementación real, aquí se llamaría a fetchTraceabilityEvents
    // para actualizar la lista de eventos después de registrar uno nuevo.
  };

  // Renderiza el formulario específico para cada tipo de evento
  const renderEventForm = useCallback(() => {
    const unitOptions = ['g', 'kg', 'unidades', 'ml', 'L']; // Opciones de unidad de medida

    switch (currentEventType) {
      case 'movement':
        return (
          <Box component="form" onSubmit={handleRegisterEvent} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Lote a Mover</InputLabel>
              <Select value={eventBatchId} onChange={(e) => setEventBatchId(e.target.value)} required sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: '#fff' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#004060', color: '#fff' } } }}
              >
                <MenuItem value="" disabled><em>Seleccionar Lote</em></MenuItem>
                {batchesInCurrentArea.length === 0 ? (
                  <MenuItem value="" disabled><em>No hay lotes disponibles en esta área</em></MenuItem>
                ) : (
                  batchesInCurrentArea.map(batch => <MenuItem key={batch.id} value={batch.id}>{batch.name}</MenuItem>)
                )}
              </Select>
            </FormControl>
            <TextField label="Cantidad" type="number" value={eventQuantity} onChange={(e) => setEventQuantity(e.target.value)} fullWidth required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Unidad</InputLabel>
              <Select value={eventUnit} onChange={(e) => setEventUnit(e.target.value)} required sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: '#fff' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#004060', color: '#fff' } } }}
              >
                {unitOptions.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Origen (ej. 'Room2')" value={eventFromLocation} onChange={(e) => setEventFromLocation(e.target.value)} fullWidth sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <TextField label="Destino (ej. 'Secado')" value={eventToLocation} onChange={(e) => setEventToLocation(e.target.value)} fullWidth required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <TextField label="Notas Adicionales" multiline rows={3} value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} fullWidth sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <DialogActions sx={{ bgcolor: '#3a506b', mt: 2 }}>
              <Button onClick={handleCloseRegisterEventDialog} sx={{ color: '#a0aec0' }}>{BUTTON_LABELS.CANCEL}</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#43A047' } }}>{BUTTON_LABELS.REGISTER}</Button>
            </DialogActions>
          </Box>
        );
      case 'cultivation':
        return (
          <Box component="form" onSubmit={handleRegisterEvent} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Lote(s) Afectado(s)</InputLabel>
              <Select value={eventBatchId} onChange={(e) => setEventBatchId(e.target.value)} required sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: '#fff' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#004060', color: '#fff' } } }}
              >
                <MenuItem value="" disabled><em>Seleccionar Lote</em></MenuItem>
                {batchesInCurrentArea.length === 0 ? (
                  <MenuItem value="" disabled><em>No hay lotes disponibles en esta área</em></MenuItem>
                ) : (
                  batchesInCurrentArea.map(batch => <MenuItem key={batch.id} value={batch.id}>{batch.name}</MenuItem>)
                )}
              </Select>
            </FormControl>
            <TextField label="Tipo de Evento (ej. Riego, Poda, Aplicación)" value={eventMethod} onChange={(e) => setEventMethod(e.target.value)} fullWidth required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <TextField label="Descripción/Notas" multiline rows={4} value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} fullWidth sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <DialogActions sx={{ bgcolor: '#3a506b', mt: 2 }}>
              <Button onClick={handleCloseRegisterEventDialog} sx={{ color: '#a0aec0' }}>{BUTTON_LABELS.CANCEL}</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#43A047' } }}>{BUTTON_LABELS.REGISTER}</Button>
            </DialogActions>
          </Box>
        );
      case 'harvest':
        return (
          <Box component="form" onSubmit={handleRegisterEvent} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Lote a Cosechar</InputLabel>
              <Select value={eventBatchId} onChange={(e) => setEventBatchId(e.target.value)} required sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: '#fff' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#004060', color: '#fff' } } }}
              >
                <MenuItem value="" disabled><em>Seleccionar Lote</em></MenuItem>
                {batchesInCurrentArea.length === 0 ? (
                  <MenuItem value="" disabled><em>No hay lotes disponibles en esta área</em></MenuItem>
                ) : (
                  batchesInCurrentArea.map(batch => <MenuItem key={batch.id} value={batch.id}>{batch.name}</MenuItem>)
                )}
              </Select>
            </FormControl>
            <TextField label="Peso Húmedo (g)" type="number" value={eventQuantity} onChange={(e) => setEventQuantity(e.target.value)} fullWidth required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <TextField label="Nuevo ID de Lote de Cosecha" value={eventNewBatchId} onChange={(e) => setEventNewBatchId(e.target.value)} fullWidth required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <TextField label="Notas Adicionales" multiline rows={3} value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} fullWidth sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <DialogActions sx={{ bgcolor: '#3a506b', mt: 2 }}>
              <Button onClick={handleCloseRegisterEventDialog} sx={{ color: '#a0aec0' }}>{BUTTON_LABELS.CANCEL}</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#43A047' } }}>{BUTTON_LABELS.REGISTER}</Button>
            </DialogActions>
          </Box>
        );
      case 'sampling':
        return (
          <Box component="form" onSubmit={handleRegisterEvent} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Lote a Muestrear</InputLabel>
              <Select value={eventBatchId} onChange={(e) => setEventBatchId(e.target.value)} required sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: '#fff' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#004060', color: '#fff' } } }}
              >
                <MenuItem value="" disabled><em>Seleccionar Lote</em></MenuItem>
                {batchesInCurrentArea.length === 0 ? (
                  <MenuItem value="" disabled><em>No hay lotes disponibles en esta área</em></MenuItem>
                ) : (
                  batchesInCurrentArea.map(batch => <MenuItem key={batch.id} value={batch.id}>{batch.name}</MenuItem>)
                )}
              </Select>
            </FormControl>
            <TextField label="Cantidad de Muestra" type="number" value={eventQuantity} onChange={(e) => setEventQuantity(e.target.value)} fullWidth required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Unidad de Muestra</InputLabel>
              <Select value={eventUnit} onChange={(e) => setEventUnit(e.target.value)} required sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: '#fff' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#004060', color: '#fff' } } }}
              >
                {unitOptions.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Propósito del Muestreo" value={eventReason} onChange={(e) => setEventReason(e.target.value)} fullWidth sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <TextField label="Notas Adicionales" multiline rows={3} value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} fullWidth sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <DialogActions sx={{ bgcolor: '#3a506b', mt: 2 }}>
              <Button onClick={handleCloseRegisterEventDialog} sx={{ color: '#a0aec0' }}>{BUTTON_LABELS.CANCEL}</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#43A047' } }}>{BUTTON_LABELS.REGISTER}</Button>
            </DialogActions>
          </Box>
        );
      case 'destruction':
        return (
          <Box component="form" onSubmit={handleRegisterEvent} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Lote a Destruir</InputLabel>
              <Select value={eventBatchId} onChange={(e) => setEventBatchId(e.target.value)} required sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: '#fff' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#004060', color: '#fff' } } }}
              >
                <MenuItem value="" disabled><em>No hay lotes disponibles en esta área</em></MenuItem>
                {batchesInCurrentArea.length === 0 ? (
                  <MenuItem value="" disabled><em>No hay lotes disponibles en esta área</em></MenuItem>
                ) : (
                  batchesInCurrentArea.map(batch => <MenuItem key={batch.id} value={batch.id}>{batch.name}</MenuItem>)
                )}
              </Select>
            </FormControl>
            <TextField label="Cantidad Destruida" type="number" value={eventQuantity} onChange={(e) => setEventQuantity(e.target.value)} fullWidth required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Unidad de Destrucción</InputLabel>
              <Select value={eventUnit} onChange={(e) => setEventUnit(e.target.value)} required sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: '#fff' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#004060', color: '#fff' } } }}
              >
                {unitOptions.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Método de Destrucción" value={eventMethod} onChange={(e) => setEventMethod(e.target.value)} fullWidth required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <TextField label="Razón de la Destrucción" multiline rows={3} value={eventReason} onChange={(e) => setEventReason(e.target.value)} fullWidth required sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <TextField label="Notas Adicionales" multiline rows={3} value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} fullWidth sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }} />
            <DialogActions sx={{ bgcolor: '#3a506b', mt: 2 }}>
              <Button onClick={handleCloseRegisterEventDialog} sx={{ color: '#a0aec0' }}>{BUTTON_LABELS.CANCEL}</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#43A047' } }}>{BUTTON_LABELS.REGISTER}</Button>
            </DialogActions>
          </Box>
        );
      default:
        return <Typography sx={{ color: '#a0aec0' }}>Selecciona un tipo de evento para registrar.</Typography>;
    }
  }, [currentEventType, eventBatchId, eventQuantity, eventUnit, eventDescription, eventFromLocation, eventToLocation, eventMethod, eventReason, eventNewBatchId, handleRegisterEvent, handleCloseRegisterEventDialog, batchesInCurrentArea]);

  // Handlers para el diálogo de añadir lote
  const handleOpenAddBatchDialog = useCallback(() => {
    setBatchName('');
    setBatchCurrentUnits('');
    setBatchEndType('');
    setBatchVariety('');
    setBatchProjectedYield('');
    setBatchAdvanceToHarvestingOn('');
    setOpenAddBatchDialog(true);
    setBatchDialogLoading(false);
  }, []);

  const handleCloseAddBatchDialog = useCallback(() => {
    setOpenAddBatchDialog(false);
    setBatchName('');
    setBatchCurrentUnits('');
    setBatchEndType('');
    setBatchVariety('');
    setBatchProjectedYield('');
    setBatchAdvanceToHarvestingOn('');
    setBatchDialogLoading(false);
  }, []);

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!currentAreaDetail || !currentAreaDetail.id) {
      setParentSnack('Error: No se pudo determinar el área de cultivo para el nuevo lote.', 'error');
      return;
    }
    if (!batchName.trim()) {
      setParentSnack(SNACK_MESSAGES.BATCH_NAME_REQUIRED, 'warning');
      return;
    }
    if (batchCurrentUnits === '' || isNaN(parseInt(batchCurrentUnits))) {
      setParentSnack(SNACK_MESSAGES.BATCH_UNITS_REQUIRED, 'warning');
      return;
    }
    if (!batchEndType.trim()) {
      setParentSnack(SNACK_MESSAGES.BATCH_END_TYPE_REQUIRED, 'warning');
      return;
    }
    if (!batchVariety.trim()) {
      setParentSnack(SNACK_MESSAGES.BATCH_VARIETY_REQUIRED, 'warning');
      return;
    }

    setBatchDialogLoading(true);
    const headers = {};
    let effectiveTenantId = null;

    if (isGlobalAdmin) {
        if (selectedFacilityId) {
            const selectedFac = facilities.find(f => f.id === selectedFacilityId);
            if (selectedFac && selectedFac.tenant_id) {
                effectiveTenantId = String(selectedFac.tenant_id);
                console.log('handleSaveBatch: Global Admin, adding X-Tenant-ID from selected facility:', effectiveTenantId);
            } else {
                setParentSnack('Error: Como Super Admin, la instalación seleccionada no tiene un inquilino válido para crear un lote.', 'error');
                setBatchDialogLoading(false);
                return;
            }
        } else {
            setParentSnack('Error: Como Super Admin, debe seleccionar una instalación para crear un lote.', 'error');
            setBatchDialogLoading(false);
            return;
        }
    } else if (tenantId) {
        effectiveTenantId = String(tenantId);
        console.log('handleSaveBatch: Tenant user, adding X-Tenant-ID from user:', effectiveTenantId);
    } else {
        setParentSnack('Error: No se pudo determinar el Tenant ID para crear el lote.', 'error');
        setBatchDialogLoading(false);
        return;
    }

    if (effectiveTenantId) {
      headers['X-Tenant-ID'] = effectiveTenantId;
    }

    try {
      const batchData = {
        name: batchName,
        current_units: parseInt(batchCurrentUnits, 10),
        end_type: batchEndType,
        variety: batchVariety,
        projected_yield: batchProjectedYield === '' ? null : parseFloat(batchProjectedYield),
        advance_to_harvesting_on: batchAdvanceToHarvestingOn || null,
        cultivation_area_id: currentAreaDetail.id, // Asocia el lote al área actual
      };

      const response = await api.post('/batches', batchData, { headers }); // Pasa los headers aquí
      console.log('Batch created successfully:', response.data);
      setParentSnack(SNACK_MESSAGES.BATCH_CREATED, 'success');
      
      // Refrescar los lotes del área después de añadir uno nuevo
      const updatedBatches = await fetchBatchesForArea(currentAreaDetail.id);
      setCurrentAreaDetail(prev => ({ ...prev, batches: updatedBatches }));
      handleCloseAddBatchDialog();
    } catch (err) {
      console.error('Error al guardar lote:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 422) {
        const errors = err.response?.data?.details;
        const firstError = errors ? Object.values(errors)[0][0] : errorMessage;
        setParentSnack(`${SNACK_MESSAGES.VALIDATION_ERROR} ${firstError}`, 'error');
      } else if (err.response?.status === 400) {
        setParentSnack(`${SNACK_MESSAGES.INVALID_DATA} ${errorMessage}`, 'error');
      } else if (err.response?.status === 403) {
        setParentSnack(SNACK_MESSAGES.PERMISSION_DENIED, 'error');
      } else {
        setParentSnack(`Error al guardar lote: ${errorMessage}`, 'error');
      }
    } finally {
      setBatchDialogLoading(false);
    }
  };


  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'Stage',
      stageId: stage.id,
    },
  });

  useEffect(() => {
    setAreaFacilityId(selectedFacilityId);
  }, [selectedFacilityId]);


  const handleOpenAddAreaDialog = useCallback((area = null) => {
    setEditingArea(area);
    setAreaName(area ? area.name : '');
    setAreaDescription(area ? (area.description || '') : '');
    setAreaCapacityUnits(area ? (area.capacity_units || '') : '');
    setAreaCapacityUnitType(area ? (area.capacity_unit_type || '') : '');
    setAreaFacilityId(area ? (area.facility_id || selectedFacilityId) : selectedFacilityId);
    setOpenAddAreaDialog(true);
    setAreaDialogLoading(false);
  }, [selectedFacilityId]);

  const handleCloseAddAreaDialog = useCallback(() => {
    setOpenAddAreaDialog(false);
    setEditingArea(null);
    setAreaName('');
    setAreaDescription('');
    setAreaCapacityUnits('');
    setAreaCapacityUnitType('');
    setAreaFacilityId(selectedFacilityId);
    setAreaDialogLoading(false);
  }, [selectedFacilityId]);

  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!areaName.trim()) {
      setParentSnack(SNACK_MESSAGES.AREA_NAME_REQUIRED, 'warning');
      return;
    }
    if (areaName.length > 100) {
      setParentSnack(SNACK_MESSAGES.AREA_NAME_LENGTH_EXCEEDED, 'warning');
      return;
    }
    if (/[<>{}]/.test(areaName)) {
      setParentSnack(SNACK_MESSAGES.AREA_NAME_INVALID_CHARS, 'warning');
      return;
    }
    if (!areaFacilityId) {
      setParentSnack(SNACK_MESSAGES.AREA_FACILITY_REQUIRED, 'warning');
      return;
    }
    setAreaDialogLoading(true);
    
    const headers = {};
    let effectiveTenantId = null;

    if (isGlobalAdmin) {
        if (selectedFacilityId) {
            const selectedFac = facilities.find(f => f.id === selectedFacilityId);
            if (selectedFac && selectedFac.tenant_id) {
                effectiveTenantId = String(selectedFac.tenant_id);
                console.log('handleSaveArea: Global Admin, adding X-Tenant-ID from selected facility:', effectiveTenantId);
            } else {
                setParentSnack('Error: Como Super Admin, la instalación seleccionada no tiene un Tenant ID válido para crear/editar áreas.', 'error');
                setAreaDialogLoading(false);
                return;
            }
        } else {
            setParentSnack('Error: Como Super Admin, debe seleccionar una instalación para crear/editar áreas.', 'error');
            setAreaDialogLoading(false);
            return;
        }
    } else if (tenantId) {
        effectiveTenantId = String(tenantId);
        console.log('handleSaveArea: Tenant user, adding X-Tenant-ID from user:', effectiveTenantId);
    } else {
        setParentSnack('Error: No se pudo determinar el Tenant ID para crear/editar áreas.', 'error');
        setAreaDialogLoading(false);
        return;
    }

    if (effectiveTenantId) {
      headers['X-Tenant-ID'] = effectiveTenantId;
    }

    try {
      const areaData = {
        name: areaName,
        description: areaDescription,
        capacity_units: areaCapacityUnits === '' ? null : parseInt(areaCapacityUnits, 10),
        capacity_unit_type: areaCapacityUnitType,
        facility_id: areaFacilityId,
        current_stage_id: stage.id,
      };

      if (editingArea) {
        await api.put(`/cultivation-areas/${editingArea.id}`, areaData, { headers }); // Pass headers
        setParentSnack(SNACK_MESSAGES.CULTIVATION_AREA_UPDATED, 'success');
      } else {
        await api.post('/cultivation-areas', areaData, { headers }); // Pass headers
        setParentSnack(SNACK_MESSAGES.CULTIVATION_AREA_CREATED, 'success');
      }
      await refreshCultivationAreas(); // Llama a la función de refresco del padre
      handleCloseAddAreaDialog();
    } catch (err) {
      console.error('Error al guardar área de cultivo:', err);
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 422) {
        const errors = err.response?.data?.details;
        const firstError = errors ? Object.values(errors)[0][0] : errorMessage;
        setParentSnack(`${SNACK_MESSAGES.VALIDATION_ERROR} ${firstError}`, 'error');
      } else if (err.response?.status === 400) {
        setParentSnack(`${SNACK_MESSAGES.INVALID_DATA} ${errorMessage}`, 'error');
      } else if (err.response?.status === 403) {
        setParentSnack(SNACK_MESSAGES.PERMISSION_DENIED, 'error');
      } else {
        setParentSnack(`Error al eliminar área: ${errorMessage}`, 'error');
      }
    } finally {
      setAreaDialogLoading(false);
    }
  };

  const handleDeleteAreaConfirm = useCallback(async (areaToDelete) => {
    setAreaDialogLoading(true); // Activa el loading para el diálogo de área
    
    const headers = {};
    let effectiveTenantId = null;

    if (isGlobalAdmin) {
        if (selectedFacilityId) {
            const selectedFac = facilities.find(f => f.id === selectedFacilityId);
            if (selectedFac && selectedFac.tenant_id) {
                effectiveTenantId = String(selectedFac.tenant_id);
            } else {
                setParentSnack('Error: Como Super Admin, la instalación seleccionada no tiene un Tenant ID válido para eliminar áreas.', 'error');
                setAreaDialogLoading(false);
                setParentConfirmDialogOpen(false);
                return;
            }
        } else {
            setParentSnack('Error: Como Super Admin, debe seleccionar una instalación para eliminar áreas.', 'error');
            setAreaDialogLoading(false);
            setParentConfirmDialogOpen(false);
            return;
        }
    } else if (tenantId) {
        effectiveTenantId = String(tenantId);
    } else {
        setParentSnack('Error: No se pudo determinar el Tenant ID para eliminar el área.', 'error');
        setAreaDialogLoading(false);
        setParentConfirmDialogOpen(false);
        return;
    }

    if (effectiveTenantId) {
      headers['X-Tenant-ID'] = effectiveTenantId;
    }

    try {
      await api.delete(`/cultivation-areas/${areaToDelete.id}`, { headers }); // Pasa los headers aquí
      setParentSnack(SNACK_MESSAGES.CULTIVATION_AREA_DELETED, 'info');
      await refreshCultivationAreas(); // Llama a la función de refresco del padre
    } catch (err) {
      console.error('Error al eliminar área de cultivo:', err);
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 400) {
        setParentSnack(`${SNACK_MESSAGES.INVALID_DATA} ${errorMessage}`, 'error');
      } else if (err.response?.status === 403) {
        setParentSnack(SNACK_MESSAGES.PERMISSION_DENIED, 'error');
      } else if (err.response?.status === 409) { // Conflict
        setParentSnack(SNACK_MESSAGES.CANNOT_DELETE_AREA_WITH_BATCHES, 'error');
      } else {
        setParentSnack(`Error al eliminar área: ${errorMessage}`, 'error');
      }
    } finally {
      setParentConfirmDialogOpen(false);
      setAreaDialogLoading(false); // Desactiva el loading para el diálogo de área
    }
  }, [refreshCultivationAreas, setParentSnack, setParentConfirmDialogOpen, isGlobalAdmin, selectedFacilityId, facilities, tenantId]);

  const handleDeleteAreaClick = useCallback((areaToDelete) => {
    setParentConfirmDialog({
      title: DIALOG_TITLES.CONFIRM_AREA_DELETION,
      message: `¿Estás seguro de que quieres eliminar el área de cultivo "${areaToDelete.name}"? Esto fallará si tiene lotes asociados.`,
      onConfirm: () => handleDeleteAreaConfirm(areaToDelete),
    });
    setParentConfirmDialogOpen(true);
  }, [handleDeleteAreaConfirm, setParentConfirmDialog, setParentConfirmDialogOpen]);

  return (
    <Paper
      sx={{
        bgcolor: '#283e51',
        borderRadius: 2,
        p: 1.5,
        minWidth: 280,
        maxWidth: 280,
        flexShrink: 0,
        boxShadow: '0 1px 0 rgba(9,30,66,.25)',
        color: '#fff',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', flexGrow: 1 }}>
          {stage.name}
        </Typography>
        <IconButton
          size="small"
          onClick={() => handleDeleteStage(stage)}
          aria-label={`Eliminar etapa ${stage.name}`}
          disabled={isFacilityOperator}
        >
          <DeleteIcon sx={{ fontSize: 18, color: isFacilityOperator ? '#666' : '#aaa' }} />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 1.5, bgcolor: 'rgba(255,255,255,0.2)' }} />
      <Box
        ref={setNodeRef}
        sx={{
          maxHeight: 'calc(100vh - 250px)',
          overflowY: 'auto',
          pr: 1,
          bgcolor: isOver ? 'rgba(255,255,255,0.1)' : 'transparent',
          minHeight: cultivationAreas.length === 0 ? '80px' : 'auto',
          transition: 'background-color 0.2s ease',
          pb: 1,
        }}
      >
        {cultivationAreas.map((area) => (
          <CultivationAreaItem
            key={area.id}
            area={area}
            handleEdit={handleOpenAddAreaDialog}
            handleDelete={handleDeleteAreaClick}
            setParentSnack={setParentSnack}
            isFacilityOperator={isFacilityOperator}
            isGlobalAdmin={isGlobalAdmin}
            handleOpenAreaDetail={handleOpenAreaDetail} // Pasar el handler para abrir el detalle
          />
        ))}
        {cultivationAreas.length === 0 && !isOver && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center', color: '#aaa' }}>
            Arrastra áreas aquí o añade una nueva.
          </Typography>
        )}
      </Box>
      <Button
        variant="text"
        startIcon={<AddIcon />}
        onClick={() => handleOpenAddAreaDialog(null)}
        fullWidth
        disabled={isFacilityOperator}
        sx={{ mt: 1, color: isFacilityOperator ? '#666' : '#b0c4de', '&:hover': { bgcolor: isFacilityOperator ? 'transparent' : 'rgba(255,255,255,0.1)' } }}
      >
        {BUTTON_LABELS.ADD_CULTIVATION_AREA}
      </Button>

      <Dialog open={openAddAreaDialog} onClose={handleCloseAddAreaDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: '#2d3748', color: '#e2e8f0', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#3a506b', color: '#fff' }}>{editingArea ? DIALOG_TITLES.EDIT_AREA : DIALOG_TITLES.CREATE_AREA}</DialogTitle>
        <form onSubmit={handleSaveArea}>
          <DialogContent sx={{ pt: '20px !important' }}>
            <TextField
              label="Nombre del Área"
              value={areaName}
              onChange={e => setAreaName(e.target.value)}
              fullWidth
              required
              sx={{ mt: 1, mb: 2,
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              }}
              disabled={areaDialogLoading || isFacilityOperator}
              inputProps={{ maxLength: 100 }}
              aria-label="Nombre del área de cultivo"
            />
            <TextField
              label="Descripción"
              value={areaDescription}
              onChange={e => setAreaDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 2,
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              }}
              disabled={areaDialogLoading || isFacilityOperator}
              aria-label="Descripción del área de cultivo"
            />
            <TextField
              label="Unidades de Capacidad"
              value={areaCapacityUnits}
              onChange={e => setAreaCapacityUnits(e.target.value)}
              type="number"
              fullWidth
              sx={{ mb: 2,
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              }}
              disabled={areaDialogLoading || isFacilityOperator}
              aria-label="Unidades de capacidad"
            />
            <TextField
              label="Tipo de Unidad de Capacidad"
              value={areaCapacityUnitType}
              onChange={e => setAreaCapacityUnitType(e.target.value)}
              fullWidth
              sx={{ mb: 2,
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              }}
              disabled={areaDialogLoading || isFacilityOperator}
              aria-label="Tipo de unidad de capacidad"
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="area-facility-select-label" sx={{ color: '#fff' }}>Instalación Asignada</InputLabel>
              <Select
                labelId="area-facility-select-label"
                value={areaFacilityId}
                label="Instalación Asignada"
                onChange={(e) => setAreaFacilityId(e.target.value)}
                required
                disabled={areaDialogLoading || isFacilityOperator}
                aria-label="Seleccionar instalación asignada"
                sx={{
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                  '.MuiSvgIcon-root': { color: '#fff' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { bgcolor: '#004060', color: '#fff' },
                  },
                }}
              >
                {facilities.length === 0 ? (
                  <MenuItem value="" sx={{ color: '#aaa' }}>
                    <em>No hay instalaciones disponibles</em>
                  </MenuItem>
                ) : (
                  facilities.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#3a506b' }}>
            <Button onClick={handleCloseAddAreaDialog} disabled={areaDialogLoading || isFacilityOperator} sx={{ color: '#a0aec0' }}>{BUTTON_LABELS.CANCEL}</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={areaDialogLoading || !areaName.trim() || isFacilityOperator}
              sx={{
                bgcolor: '#4CAF50',
                '&:hover': { bgcolor: '#43A047' }
              }}
            >
              {areaDialogLoading ? <CircularProgress size={24} /> : (editingArea ? BUTTON_LABELS.SAVE_CHANGES : BUTTON_LABELS.CREATE_AREA)}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- Diálogo de Detalle del Área (Ampliado con Trazabilidad) --- */}
      <Dialog open={openAreaDetailDialog} onClose={handleCloseAreaDetail} maxWidth="lg" fullWidth // Ampliado a lg
        PaperProps={{ sx: { bgcolor: '#2d3748', color: '#e2e8f0', borderRadius: 2, minHeight: '80vh' } }} // Altura mínima
      >
        <DialogTitle sx={{
          bgcolor: '#3a506b',
          color: '#fff',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' }, // Column on small, row on larger
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' }, // Align items based on direction
          pb: { xs: 2, sm: 1 }, // Add some padding bottom for column layout
          pt: { xs: 2, sm: 1 },
          px: { xs: 2, sm: 3 },
          gap: { xs: 2, sm: 1 }, // Gap between title and buttons, and between buttons
          flexWrap: 'wrap', // Allow wrapping if space is tight, but try to keep it one row
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', mr: 1 }}>
              {DIALOG_TITLES.AREA_DETAIL} {currentAreaDetail?.name}
            </Typography>
            <IconButton onClick={handleCloseAreaDetail} sx={{ color: '#e2e8f0', ml: 'auto' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* New container for all action buttons */}
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap', // Allow wrapping for buttons if space is limited
            gap: 1, // Small gap between buttons
            alignItems: 'center',
            flexGrow: 1, // Allow buttons to take available space
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }, // Align buttons to end on larger screens
          }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddBatchDialog}
              sx={{
                bgcolor: '#4CAF50',
                color: '#fff',
                '&:hover': { bgcolor: '#43A047' },
                borderRadius: 1,
                textTransform: 'none',
                py: '6px', // Smaller padding
                px: '10px',
                fontSize: '0.75rem', // Smaller font size
                whiteSpace: 'nowrap', // Prevent text wrapping within button
              }}
              disabled={isFacilityOperator}
            >
              {BUTTON_LABELS.ADD_NEW_BATCH}
            </Button>
            <Button
              variant="contained"
              startIcon={<TrendingUpIcon />}
              onClick={() => handleOpenRegisterEventDialog('movement')}
              sx={{
                bgcolor: '#4a5568',
                color: '#e2e8f0',
                '&:hover': { bgcolor: '#66748c' },
                borderRadius: 1,
                textTransform: 'none',
                py: '6px',
                px: '10px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
              }}
              disabled={isFacilityOperator}
            >
              {BUTTON_LABELS.REGISTER_MOVEMENT}
            </Button>
            <Button
              variant="contained"
              startIcon={<EcoIcon />}
              onClick={() => handleOpenRegisterEventDialog('cultivation')}
              sx={{
                bgcolor: '#4a5568',
                color: '#e2e8f0',
                '&:hover': { bgcolor: '#66748c' },
                borderRadius: 1,
                textTransform: 'none',
                py: '6px',
                px: '10px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
              }}
              disabled={isFacilityOperator}
            >
              {BUTTON_LABELS.REGISTER_CULTIVATION_EVENT}
            </Button>
            <Button
              variant="contained"
              startIcon={<HarvestIcon />}
              onClick={() => handleOpenRegisterEventDialog('harvest')}
              sx={{
                bgcolor: '#4a5568',
                color: '#e2e8f0',
                '&:hover': { bgcolor: '#66748c' },
                borderRadius: 1,
                textTransform: 'none',
                py: '6px',
                px: '10px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
              }}
              disabled={isFacilityOperator}
            >
              {BUTTON_LABELS.REGISTER_HARVEST}
            </Button>
            <Button
              variant="contained"
              startIcon={<ScienceIcon />}
              onClick={() => handleOpenRegisterEventDialog('sampling')}
              sx={{
                bgcolor: '#4a5568',
                color: '#e2e8f0',
                '&:hover': { bgcolor: '#66748c' },
                borderRadius: 1,
                textTransform: 'none',
                py: '6px',
                px: '10px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
              }}
              disabled={isFacilityOperator}
            >
              {BUTTON_LABELS.REGISTER_SAMPLING}
            </Button>
            <Button
              variant="contained"
              startIcon={<DeleteForeverIcon />}
              onClick={() => handleOpenRegisterEventDialog('destruction')}
              sx={{
                bgcolor: '#4a5568',
                color: '#e2e8f0',
                '&:hover': { bgcolor: '#66748c' },
                borderRadius: 1,
                textTransform: 'none',
                py: '6px',
                px: '10px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
              }}
              disabled={isFacilityOperator}
            >
              {BUTTON_LABELS.REGISTER_DESTRUCTION}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{
          pt: '20px !important',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }, // Columnas en móvil, fila en desktop
          gap: { xs: 3, md: 4 }, // Espacio entre secciones
        }}>
          {/* Sección Izquierda: Información General y Lotes */}
          <Box sx={{ flexGrow: 1, minWidth: { md: '40%' } }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#e2e8f0' }}>Información General</Typography>
            <Typography variant="subtitle1" sx={{ mt: 1, mb: 1, color: '#e2e8f0' }}>
              Descripción: {currentAreaDetail?.description || 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Capacidad: {currentAreaDetail?.capacity_units} {currentAreaDetail?.capacity_unit_type || 'unidades'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Etapa Actual: {currentAreaDetail?.current_stage?.name || 'Cargando...'}
            </Typography>
            <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
            <Typography variant="h6" sx={{ mb: 2, color: '#e2e8f0' }}>Lotes en esta Área:</Typography>
            {currentAreaDetail?.batches && currentAreaDetail.batches.length > 0 ? (
              currentAreaDetail.batches.map(batch => (
                <BatchItem key={batch.id} batch={batch} setParentSnack={setParentSnack} isFacilityOperator={isFacilityOperator} />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                No hay lotes en esta área.
              </Typography>
            )}
            {/* El botón "Añadir Nuevo Lote" se ha movido al DialogTitle */}
          </Box>

          {/* Sección Derecha: Trazabilidad del Lote */}
          <Box sx={{ width: { md: '60%' }, flexShrink: 0, ml: { md: 4 } }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#e2e8f0', display: 'flex', alignItems: 'center' }}>
              <HistoryIcon sx={{ mr: 1, color: '#a0aec0' }} />
              Trazabilidad del Lote
            </Typography>

            {/* Los botones de acción se han movido al DialogTitle */}

            {/* Filtro de Lotes para Trazabilidad */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Ver Eventos para</InputLabel>
              <Select
                value={selectedBatchForTraceability}
                onChange={(e) => setSelectedBatchForTraceability(e.target.value)}
                label="Ver Eventos para"
                sx={{
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                  '.MuiSvgIcon-root': { color: '#fff' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { bgcolor: '#004060', color: '#fff' },
                  },
                }}
              >
                <MenuItem value="all">Todos los Lotes</MenuItem>
                {currentAreaDetail?.batches?.map(batch => (
                  <MenuItem key={batch.id} value={batch.name}>{batch.name}</MenuItem>
                ))}
                {/* Aquí podrían ir lotes históricos que ya no están en el área pero tienen eventos aquí */}
                {/* <MenuItem value="LoteC (Histórico)">LoteC (Histórico)</MenuItem> */}
              </Select>
            </FormControl>

            {/* Tabla/Lista de Eventos de Trazabilidad */}
            <Box sx={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #4a5568', borderRadius: 1, mb: 2 }}>
              <List disablePadding>
                {/* Encabezados de la tabla */}
                <ListItem sx={{ bgcolor: '#3a506b', py: 1, borderBottom: '1px solid #4a5568' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={2}><Typography variant="caption" sx={{ fontWeight: 600, color: '#fff' }}>Fecha/Hora</Typography></Grid>
                    <Grid item xs={2}><Typography variant="caption" sx={{ fontWeight: 600, color: '#fff' }}>Tipo Evento</Typography></Grid>
                    <Grid item xs={2}><Typography variant="caption" sx={{ fontWeight: 600, color: '#fff' }}>Lote</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" sx={{ fontWeight: 600, color: '#fff' }}>Detalles</Typography></Grid>
                    <Grid item xs={2}><Typography variant="caption" sx={{ fontWeight: 600, color: '#fff' }}>Realizado Por</Typography></Grid>
                  </Grid>
                </ListItem>
                {traceabilityEvents.length > 0 ? (
                  traceabilityEvents.map(event => (
                    <ListItem key={event.id} sx={{ py: 1, borderBottom: '1px solid #4a5568', '&:last-child': { borderBottom: 'none' } }}>
                      <Grid container spacing={1}>
                        <Grid item xs={2}><Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 12 }}>{event.date}</Typography></Grid>
                        <Grid item xs={2}><Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 12 }}>{event.type}</Typography></Grid>
                        <Grid item xs={2}><Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 12 }}>{event.batch}</Typography></Grid>
                        <Grid item xs={4}><Typography variant="body2" sx={{ color: '#a0aec0', fontSize: 12 }}>{event.details}</Typography></Grid>
                        <Grid item xs={2}><Typography variant="body2" sx={{ color: '#a0aec0', fontSize: 12 }}>{event.user}</Typography></Grid>
                      </Grid>
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No hay eventos de trazabilidad registrados para esta área." primaryTypographyProps={{ sx: { color: '#a0aec0', textAlign: 'center', py: 2 } }} />
                  </ListItem>
                )}
              </List>
            </Box>
          </Box>
        </DialogContent>
        {/* DialogActions removed as Close button is now in DialogTitle */}
      </Dialog>

      {/* --- Diálogo para Añadir Nuevo Lote --- */}
      <Dialog open={openAddBatchDialog} onClose={handleCloseAddBatchDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: '#2d3748', color: '#e2e8f0', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#3a506b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {DIALOG_TITLES.ADD_BATCH}
          <IconButton onClick={handleCloseAddBatchDialog} sx={{ color: '#e2e8f0' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSaveBatch}>
          <DialogContent sx={{ pt: '20px !important' }}>
            <TextField
              label="Nombre del Lote"
              value={batchName}
              onChange={e => setBatchName(e.target.value)}
              fullWidth
              required
              sx={{ mt: 1, mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
              disabled={batchDialogLoading}
            />
            <TextField
              label="Unidades Actuales"
              type="number"
              value={batchCurrentUnits}
              onChange={e => setBatchCurrentUnits(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
              disabled={batchDialogLoading}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Tipo de Finalización</InputLabel>
              <Select
                value={batchEndType}
                onChange={e => setBatchEndType(e.target.value)}
                required
                sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' }, '.MuiSvgIcon-root': { color: '#fff' } }}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#004060', color: '#fff' } } }}
                disabled={batchDialogLoading}
              >
                <MenuItem value="" disabled><em>Seleccionar Tipo</em></MenuItem>
                <MenuItem value="Dried">Dried</MenuItem>
                <MenuItem value="Fresh">Fresh</MenuItem>
                {/* Añade más tipos según sea necesario */}
              </Select>
            </FormControl>
            <TextField
              label="Variedad"
              value={batchVariety}
              onChange={e => setBatchVariety(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
              disabled={batchDialogLoading}
            />
            <TextField
              label="Rendimiento Proyectado"
              type="number"
              value={batchProjectedYield}
              onChange={e => setBatchProjectedYield(e.target.value)}
              fullWidth
              sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
              disabled={batchDialogLoading}
            />
            <TextField
              label="Fecha de Cosecha (Opcional)"
              type="date"
              value={batchAdvanceToHarvestingOn}
              onChange={e => setBatchAdvanceToHarvestingOn(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2, '& .MuiInputBase-input': { color: '#fff' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
              disabled={batchDialogLoading}
            />
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#3a506b' }}>
            <Button onClick={handleCloseAddBatchDialog} disabled={batchDialogLoading} sx={{ color: '#a0aec0' }}>{BUTTON_LABELS.CANCEL}</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={batchDialogLoading || !batchName.trim() || batchCurrentUnits === '' || !batchEndType.trim() || !batchVariety.trim()}
              sx={{
                bgcolor: '#4CAF50',
                '&:hover': { bgcolor: '#43A047' }
              }}
            >
              {batchDialogLoading ? <CircularProgress size={24} /> : BUTTON_LABELS.CREATE_BATCH}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- Diálogo Global de Registro de Eventos --- */}
      <Dialog open={openRegisterEventDialog} onClose={handleCloseRegisterEventDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: '#2d3748', color: '#e2e8f0', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#3a506b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {DIALOG_TITLES.REGISTER_EVENT}
          <IconButton onClick={handleCloseRegisterEventDialog} sx={{ color: '#e2e8f0' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {renderEventForm()}
        </DialogContent>
      </Dialog>
    </Paper>
  );
});

StageView.propTypes = {
  stage: PropTypes.object.isRequired,
  cultivationAreas: PropTypes.array.isRequired,
  tenantId: PropTypes.number, // Puede ser null para Super Admin
  refreshCultivationAreas: PropTypes.func.isRequired,
  handleDeleteStage: PropTypes.func.isRequired,
  setParentSnack: PropTypes.func.isRequired,
  setParentConfirmDialog: PropTypes.func.isRequired,
  setParentConfirmDialogOpen: PropTypes.func.isRequired,
  selectedFacilityId: PropTypes.number, // Asumiendo que facilityId es numérico
  facilities: PropTypes.array.isRequired,
  isFacilityOperator: PropTypes.bool.isRequired,
  isGlobalAdmin: PropTypes.bool.isRequired,
};

// --- Componente principal del Módulo de Cultivo ---
const CultivationPage = ({ tenantId, isAppReady, userFacilityId, isGlobalAdmin, setParentSnack }) => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [stages, setStages] = useState([]);
  const [rawAreas, setRawAreas] = useState([]);
  const [cultivationAreas, setCultivationAreas] = useState([]);
  const [loading, setLoading] = useState(true); // Estado de carga principal
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [openStageDialog, setOpenStageDialog] = useState(false);
  const [stageName, setStageName] = useState('');
  const [editingStage, setEditingStage] = useState(null);
  const [stageDialogLoading, setStageDialogLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({ title: '', message: '', onConfirm: () => {} });
  const [activeDraggableId, setActiveDraggableId] = useState(null);

  const [openFacilityDialog, setOpenFacilityDialog] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState('');
  const [facilityDialogLoading, setFacilityDialogLoading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantForNewFacility, setSelectedTenantForNewFacility] = useState('');

  const isFacilityOperator = !!userFacilityId;

  // Utilidad para mostrar notificaciones
  const showSnack = useCallback((message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  }, []);

  // Memoización para organizar las áreas por etapa
  const organizedAreas = useMemo(() => {
    return stages.length > 0
      ? stages.map(stage => ({
          ...stage,
          cultivationAreas: rawAreas
            .filter(area => area.current_stage_id === stage.id)
            .sort((a, b) => a.order - b.order || 0),
        }))
      : [];
  }, [stages, rawAreas]);

  // Actualiza el estado de las áreas de cultivo organizadas
  useEffect(() => {
    setCultivationAreas(organizedAreas);
  }, [organizedAreas]);

  // Función para obtener instalaciones
  const fetchFacilities = useCallback(async () => {
    try {
      const response = await api.get('/facilities');
      let fetchedFacilities = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      if (isFacilityOperator && userFacilityId) {
        fetchedFacilities = fetchedFacilities.filter(f => f.id === userFacilityId);
      }

      setFacilities(fetchedFacilities);

      // Si hay instalaciones y no hay una seleccionada o la seleccionada ya no existe, selecciona la primera
      if (fetchedFacilities.length > 0) {
        const currentFacilityExists = fetchedFacilities.some(f => f.id === selectedFacilityId);
        if (!selectedFacilityId || !currentFacilityExists) {
          setSelectedFacilityId(fetchedFacilities[0].id);
        }
      } else {
        setSelectedFacilityId(''); // Si no hay instalaciones, limpia la selección
      }
      return fetchedFacilities; // Devuelve las instalaciones para Promise.all
    } catch (error) {
      console.error('CultivationPage: Error fetching facilities:', error);
      showSnack(SNACK_MESSAGES.FACILITIES_ERROR, 'error');
      return [];
    }
  }, [showSnack, isFacilityOperator, userFacilityId, selectedFacilityId]);

  // Función para obtener etapas
  const fetchStages = useCallback(async () => {
    try {
      const response = await api.get('/stages');
      const fetchedStages = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setStages(fetchedStages.sort((a, b) => a.order - b.order));
      return fetchedStages; // Devuelve las etapas para Promise.all
    } catch (error) {
      console.error('CultivationPage: Error fetching stages:', error);
      showSnack(SNACK_MESSAGES.STAGES_ERROR, 'error');
      return [];
    }
  }, [showSnack]);

  // Función para obtener inquilinos (solo para administradores globales)
  const fetchTenants = useCallback(async () => {
    if (!isGlobalAdmin) {
      return [];
    }
    try {
      const response = await api.get('/tenants');
      const fetchedTenants = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setTenants(fetchedTenants);
      if (fetchedTenants.length > 0 && !selectedTenantForNewFacility) {
        setSelectedTenantForNewFacility(fetchedTenants[0].id);
      }
      return fetchedTenants; // Devuelve los inquilinos para Promise.all
    } catch (error) {
      console.error('CultivationPage: Error fetching tenants:', error);
      showSnack(SNACK_MESSAGES.TENANTS_ERROR, 'error');
      return [];
    }
  }, [isGlobalAdmin, showSnack, selectedTenantForNewFacility]);

  // Función para obtener áreas de cultivo
  const fetchCultivationAreas = useCallback(async (currentSelectedFacilityId) => {
    if (!isAppReady || (!tenantId && !isGlobalAdmin)) {
      return;
    }
    // Si es operador de instalación y no hay facility seleccionada (porque solo hay una),
    // o si es global admin y no hay facility seleccionada, no se hace la llamada.
    // La carga inicial para operadores ya se maneja en loadInitialData.
    if (!currentSelectedFacilityId && !isFacilityOperator && isGlobalAdmin) {
        console.log('fetchCultivationAreas: Global Admin, no facility selected. Skipping area fetch.');
        setRawAreas([]); // Limpiar áreas si no hay instalación seleccionada
        return;
    }

    try {
      let url = '/cultivation-areas';
      if (currentSelectedFacilityId) {
        url = `/facilities/${currentSelectedFacilityId}/cultivation-areas`;
      }
      const response = await api.get(url); // El X-Tenant-ID se maneja en App.jsx para esta llamada
      const fetchedAreas = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setRawAreas(fetchedAreas);
    } catch (error) {
      console.error('CultivationPage: Error fetching cultivation areas:', error);
      showSnack(SNACK_MESSAGES.CULTIVATION_AREAS_ERROR, 'error');
    }
  }, [tenantId, isAppReady, showSnack, isGlobalAdmin, isFacilityOperator]);


  // Effect para la carga inicial de datos (facilities, stages, y tenants si es admin global)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isAppReady || (!tenantId && !isGlobalAdmin)) {
        setLoading(false); // Asegura que el estado de carga se desactive si no hay contexto válido
        return;
      }

      setLoading(true); // Activa el estado de carga al inicio de la carga inicial
      try {
        const [fetchedFacs] = await Promise.all([
          fetchFacilities(),
          fetchStages(),
          isGlobalAdmin ? fetchTenants() : Promise.resolve([])
        ]);

        let facilityToFetchAreas = null;
        if (isFacilityOperator && userFacilityId) {
          facilityToFetchAreas = userFacilityId;
        } else if (selectedFacilityId) {
          facilityToFetchAreas = selectedFacilityId;
        } else if (fetchedFacs.length > 0) {
          facilityToFetchAreas = fetchedFacs[0].id;
        }
        
        // Solo llamar a fetchCultivationAreas si hay una instalación para la cual cargar áreas
        if (facilityToFetchAreas) {
          await fetchCultivationAreas(facilityToFetchAreas);
        } else if (isGlobalAdmin && fetchedFacs.length === 0) {
          // Si es global admin y no hay instalaciones, limpiar áreas
          setRawAreas([]);
        }

      } catch (error) {
        console.error('CultivationPage: Error in initial data load:', error);
        showSnack('Error loading initial data.', 'error');
      } finally {
        setLoading(false); // Desactiva el estado de carga una vez que todas las promesas se resuelven
      }
    };

    loadInitialData();
  }, [tenantId, isAppReady, isGlobalAdmin, fetchFacilities, fetchStages, fetchTenants, userFacilityId, selectedFacilityId, fetchCultivationAreas]); // Añadida selectedFacilityId a las dependencias

  // Effect para cargar áreas de cultivo cuando la instalación seleccionada cambia
  useEffect(() => {
    // Este efecto se encarga de recargar áreas cuando selectedFacilityId cambia explícitamente.
    // La lógica de carga inicial para isFacilityOperator ya está en loadInitialData.
    if (isAppReady && (tenantId || isGlobalAdmin) && selectedFacilityId) {
      fetchCultivationAreas(selectedFacilityId);
    } else if (isAppReady && isGlobalAdmin && !selectedFacilityId) {
      // Si es global admin y se deselecciona la instalación, limpiar áreas
      setRawAreas([]);
    }
  }, [selectedFacilityId, isAppReady, tenantId, isGlobalAdmin, fetchCultivationAreas]);

  // Handlers para la UI de Etapas y Diálogos
  const handleOpenStageDialog = (stage = null) => {
    setEditingStage(stage);
    setStageName(stage ? stage.name : '');
    setOpenStageDialog(true);
    setStageDialogLoading(false);
  };

  const handleCloseStageDialog = () => {
    setOpenStageDialog(false);
    setEditingStage(null);
    setStageName('');
    setStageDialogLoading(false);
  };

  const handleSaveStage = async (e) => {
    e.preventDefault();
    if (!stageName.trim()) {
      showSnack(SNACK_MESSAGES.STAGE_NAME_REQUIRED, 'warning');
      return;
    }
    if (stageName.length > 100) {
      showSnack(SNACK_MESSAGES.STAGE_NAME_LENGTH_EXCEEDED, 'warning');
      return;
    }
    if (/[<>{}]/.test(stageName)) {
      showSnack(SNACK_MESSAGES.STAGE_NAME_INVALID_CHARS, 'warning');
      return;
    }

    setStageDialogLoading(true);
    const headers = {};
    const stageData = { name: stageName };
    let effectiveTenantId = null;

    if (isGlobalAdmin) {
      if (selectedFacilityId) {
        const selectedFac = facilities.find(f => f.id === selectedFacilityId);
        if (selectedFac && selectedFac.tenant_id) {
          effectiveTenantId = String(selectedFac.tenant_id);
          stageData.tenant_id = parseInt(effectiveTenantId, 10); // También en el payload si es necesario por backend
          console.log('handleSaveStage: Global Admin, using X-Tenant-ID from selected facility:', effectiveTenantId);
        } else {
          showSnack('Error: Como Super Admin, la instalación seleccionada no tiene un inquilino válido para crear/editar etapas.', 'error');
          setStageDialogLoading(false);
          return;
        }
      } else {
        showSnack('Error: Como Super Admin, debe seleccionar una instalación para crear/editar etapas.', 'error');
        setStageDialogLoading(false);
        return;
      }
    } else if (tenantId) {
        effectiveTenantId = String(tenantId);
        console.log('handleSaveStage: Tenant user, using X-Tenant-ID from user:', effectiveTenantId);
    } else {
        showSnack('Error: No se pudo determinar el Tenant ID para crear/editar etapas.', 'error');
        setStageDialogLoading(false);
        return;
    }

    if (effectiveTenantId) {
      headers['X-Tenant-ID'] = effectiveTenantId;
    }

    try {
      if (editingStage) {
        await api.put(`/stages/${editingStage.id}`, stageData, { headers }); // Pasa los headers aquí
        showSnack(SNACK_MESSAGES.STAGE_UPDATED, 'success');
      } else {
        await api.post('/stages', stageData, { headers }); // Pasa los headers aquí
        showSnack(SNACK_MESSAGES.STAGE_CREATED, 'success');
      }
      await fetchStages(); // Vuelve a cargar las etapas para actualizar la UI
      handleCloseStageDialog();
    } catch (err) {
      console.error('CultivationPage: Error saving stage:', err);
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 422) {
        const errors = err.response?.data?.details;
        const firstError = errors ? Object.values(errors)[0][0] : errorMessage;
        showSnack(`${SNACK_MESSAGES.VALIDATION_ERROR} ${firstError}`, 'error');
      } else if (err.response?.status === 400) {
        showSnack(`${SNACK_MESSAGES.INVALID_DATA} ${errorMessage}`, 'error');
      } else if (err.response?.status === 403) {
        showSnack(SNACK_MESSAGES.PERMISSION_DENIED, 'error');
      } else {
        showSnack(`${SNACK_MESSAGES.GENERAL_ERROR_SAVING_STAGE} ${errorMessage}`, 'error');
      }
    } finally {
      setStageDialogLoading(false);
    }
  };

  const handleDeleteStageConfirm = useCallback(async (stageToDelete) => {
    setLoading(true); // Activa el loading mientras se borra
    
    const headers = {};
    let effectiveTenantId = null;

    if (isGlobalAdmin) {
        if (selectedFacilityId) {
            const selectedFac = facilities.find(f => f.id === selectedFacilityId);
            if (selectedFac && selectedFac.tenant_id) {
                effectiveTenantId = String(selectedFac.tenant_id);
            } else {
                showSnack('Error: Como Super Admin, la instalación seleccionada no tiene un Tenant ID válido para eliminar etapas.', 'error');
                setLoading(false);
                setConfirmDialogOpen(false);
                return;
            }
        } else {
            showSnack('Error: Como Super Admin, debe seleccionar una instalación para eliminar etapas.', 'error');
            setLoading(false);
            setConfirmDialogOpen(false);
            return;
        }
    } else if (tenantId) {
        effectiveTenantId = String(tenantId);
    } else {
        showSnack('Error: No se pudo determinar el Tenant ID para eliminar la etapa.', 'error');
        setLoading(false);
        setConfirmDialogOpen(false);
        return;
    }

    if (effectiveTenantId) {
      headers['X-Tenant-ID'] = effectiveTenantId;
    }

    try {
      await api.delete(`/stages/${stageToDelete.id}`, { headers }); // Pasa los headers aquí
      showSnack(SNACK_MESSAGES.STAGE_DELETED, 'info');
      await fetchStages(); // Vuelve a cargar las etapas para actualizar la UI
    } catch (err) {
      console.error('CultivationPage: Error deleting stage:', err);
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 400) {
        showSnack(`${SNACK_MESSAGES.INVALID_DATA} ${errorMessage}`, 'error');
      } else if (err.response?.status === 403) {
        showSnack(SNACK_MESSAGES.PERMISSION_DENIED, 'error');
      } else {
        showSnack(`Error deleting stage: ${errorMessage}`, 'error');
      }
    } finally {
      setLoading(false); // Desactiva el loading
      setConfirmDialogOpen(false);
    }
  }, [fetchStages, showSnack, isGlobalAdmin, selectedFacilityId, facilities, tenantId]);

  const handleDeleteStageClick = useCallback((stageToDelete) => {
    setConfirmDialogData({
      title: DIALOG_TITLES.CONFIRM_STAGE_DELETION,
      message: `¿Estás seguro de que quieres eliminar la etapa "${stageToDelete.name}"? Esto fallará si tiene áreas de cultivo asociadas.`,
      onConfirm: () => handleDeleteStageConfirm(stageToDelete),
    });
    setConfirmDialogOpen(true);
  }, [handleDeleteStageConfirm]);

  // Handlers para el Diálogo de Instalación
  const handleOpenFacilityDialog = () => {
    setNewFacilityName('');
    if (tenants.length > 0) {
      setSelectedTenantForNewFacility(tenants[0].id);
    } else {
      setSelectedTenantForNewFacility('');
    }
    setOpenFacilityDialog(true);
    setFacilityDialogLoading(false);
  };

  const handleCloseFacilityDialog = () => {
    setOpenFacilityDialog(false);
    setNewFacilityName('');
    setSelectedTenantForNewFacility('');
    setFacilityDialogLoading(false);
  };

  const handleSaveFacility = async (e) => {
    e.preventDefault();
    if (!newFacilityName.trim()) {
      showSnack(SNACK_MESSAGES.FACILITY_NAME_REQUIRED, 'warning');
      return;
    }
    if (newFacilityName.length > 100) {
      showSnack(SNACK_MESSAGES.FACILITY_NAME_LENGTH_EXCEEDED, 'warning');
      return;
    }
    if (/[<>{}]/.test(newFacilityName)) {
      showSnack(SNACK_MESSAGES.FACILITY_NAME_INVALID_CHARS, 'warning');
      return;
    }
    if (isGlobalAdmin && !selectedTenantForNewFacility) {
      showSnack('Como Super Admin, debes seleccionar un inquilino para la nueva instalación.', 'error');
      return;
    }
    
    setFacilityDialogLoading(true);
    const headers = {}; // No se necesita X-Tenant-ID aquí, Laravel lo maneja en el payload para instalaciones
    try {
      const facilityData = { name: newFacilityName };
      if (isGlobalAdmin) {
        facilityData.tenant_id = parseInt(selectedTenantForNewFacility, 10);
      }

      await api.post('/facilities', facilityData, { headers }); // Pasa los headers (vacíos o no)
      showSnack(SNACK_MESSAGES.FACILITY_CREATED, 'success');
      await fetchFacilities(); // Vuelve a cargar las instalaciones para actualizar la UI
      handleCloseFacilityDialog();
    } catch (err) {
      console.error('Error creating facility:', err);
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 422) {
        const errors = err.response?.data?.details;
        const firstError = errors ? Object.values(errors)[0][0] : errorMessage;
        showSnack(`${SNACK_MESSAGES.VALIDATION_ERROR} ${firstError}`, 'error');
      } else if (err.response?.status === 400) {
        showSnack(`${SNACK_MESSAGES.INVALID_DATA} ${errorMessage}`, 'error');
      } else if (err.response?.status === 403) {
        showSnack(SNACK_MESSAGES.PERMISSION_DENIED, 'error');
      } else {
        showSnack(`${SNACK_MESSAGES.GENERAL_ERROR_SAVING_FACILITY} ${errorMessage}`, 'error');
      }
    } finally {
      setFacilityDialogLoading(false);
    }
  };

  // Dnd-Kit Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event) => {
    setActiveDraggableId(event.active.id);
  }, []);

  const findDraggedArea = useCallback((areas, activeId) => {
    for (let i = 0; i < areas.length; i++) {
      const stage = areas[i];
      const areaIndex = stage.cultivationAreas.findIndex(area => area.id === activeId);
      if (areaIndex !== -1) {
        return { draggedArea: stage.cultivationAreas[areaIndex], sourceStage: stage, sourceAreaIndex: areaIndex };
      }
    }
    return { draggedArea: null, sourceStage: null, sourceAreaIndex: -1 };
  }, []);

  const parseDragDestination = useCallback((over) => {
    let targetStageId = over.id;
    let targetAreaId = null;
    if (over.data.current?.type === 'CultivationArea') {
      targetStageId = over.data.current.cultivationArea.current_stage_id;
      targetAreaId = over.id;
    }
    return { targetStageId, targetAreaId };
  }, []);

  const handleSameStageDrag = useCallback(async (sourceStage, destinationStage, sourceAreaIndex, targetAreaId) => {
    const oldIndex = sourceAreaIndex;
    const newIndex = targetAreaId
      ? destinationStage.cultivationAreas.findIndex(area => area.id === targetAreaId)
      : destinationStage.cultivationAreas.length;
    if (oldIndex !== newIndex) {
      const updatedAreas = arrayMove(sourceStage.cultivationAreas, oldIndex, newIndex);
      sourceStage.cultivationAreas = updatedAreas.map((area, idx) => ({ ...area, order: idx }));
      await api.put(`/stages/${sourceStage.id}/cultivation-areas/reorder`, {
        area_ids: updatedAreas.map(area => area.id),
      });
    }
  }, []);

  const handleCrossStageDrag = useCallback(async (draggedArea, sourceStage, destinationStage, sourceAreaIndex, targetAreaId) => {
    sourceStage.cultivationAreas.splice(sourceAreaIndex, 1);
    const targetIndex = targetAreaId
      ? destinationStage.cultivationAreas.findIndex(area => area.id === targetAreaId)
      : destinationStage.cultivationAreas.length;
    destinationStage.cultivationAreas.splice(targetIndex, 0, {
      ...draggedArea,
      current_stage_id: destinationStage.id,
    });
    sourceStage.cultivationAreas = sourceStage.cultivationAreas.map((area, idx) => ({ ...area, order: idx }));
    destinationStage.cultivationAreas = destinationStage.cultivationAreas.map((area, idx) => ({ ...area, order: idx }));

    await api.put(`/cultivation-areas/${draggedArea.id}`, {
      current_stage_id: destinationStage.id,
      order: targetIndex,
      name: draggedArea.name,
      description: draggedArea.description,
      capacity_units: draggedArea.capacity_units,
      capacity_unit_type: draggedArea.capacity_unit_type,
      facility_id: draggedArea.facility_id,
    });
    await api.put(`/stages/${sourceStage.id}/cultivation-areas/reorder`, {
      area_ids: sourceStage.cultivationAreas.map(area => area.id),
    });
    await api.put(`/stages/${destinationStage.id}/cultivation-areas/reorder`, {
      area_ids: destinationStage.cultivationAreas.map(area => area.id),
    });
  }, []);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    setActiveDraggableId(null);
    if (!over || active.id === over.id) {
      return;
    }

    if (isFacilityOperator) {
      showSnack(SNACK_MESSAGES.DRAG_PERMISSION_DENIED, 'error');
      return;
    }

    const newCultivationAreasState = JSON.parse(JSON.stringify(cultivationAreas));
    const { draggedArea, sourceStage, sourceAreaIndex } = findDraggedArea(newCultivationAreasState, active.id);
    if (!draggedArea || !sourceStage) {
      console.error('CultivationPage: Dragged area or source stage not found.');
      return;
    }

    const { targetStageId, targetAreaId } = parseDragDestination(over);
    const destinationStage = newCultivationAreasState.find(stage => stage.id === targetStageId);
    if (!destinationStage) {
      console.error('CultivationPage: Destination stage not found.');
      return;
    }

    setLoading(true); // Activa el loading durante la operación de arrastre
    try {
      if (sourceStage.id === destinationStage.id) {
        await handleSameStageDrag(sourceStage, destinationStage, sourceAreaIndex, targetAreaId);
      } else {
        await handleCrossStageDrag(draggedArea, sourceStage, destinationStage, sourceAreaIndex, targetAreaId);
      }
      setCultivationAreas(newCultivationAreasState);
      showSnack(SNACK_MESSAGES.CULTIVATION_AREA_MOVED, 'success');
    } catch (error) {
      console.error('CultivationPage: Error in drag operation:', error);
      showSnack(SNACK_MESSAGES.ERROR_DRAGGING, 'error');
    } finally {
      await fetchCultivationAreas(selectedFacilityId); // Vuelve a cargar las áreas para asegurar la consistencia
      setLoading(false); // Desactiva el loading
    }
  }, [cultivationAreas, isFacilityOperator, showSnack, findDraggedArea, parseDragDestination, handleSameStageDrag, handleCrossStageDrag, fetchCultivationAreas, selectedFacilityId]);

  const getActiveCultivationArea = useCallback(() => {
    if (!activeDraggableId) return null;
    for (const stage of cultivationAreas) {
      const area = stage.cultivationAreas.find(a => a.id === activeDraggableId);
      if (area) return area;
    }
    return null;
  }, [activeDraggableId, cultivationAreas]);

  return (
    <Box sx={{
      p: { xs: 2, sm: 3 },
      minHeight: 'calc(100vh - 64px)',
      bgcolor: '#004d80',
      color: '#fff',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <GrassIcon sx={{ fontSize: 32, color: '#fff', mr: 1 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
          Gestión de Cultivo
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <FormControl sx={{ minWidth: 200, mr: 1 }}>
          <InputLabel id="facility-select-label" sx={{ color: '#fff' }}>Instalación</InputLabel>
          <Select
            labelId="facility-select-label"
            value={selectedFacilityId}
            label="Instalación"
            onChange={(e) => {
                setSelectedFacilityId(e.target.value);
            }}
            disabled={loading || facilities.length === 0 || isFacilityOperator}
            sx={{
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              '.MuiSvgIcon-root': { color: '#fff' },
            }}
            MenuProps={{
              PaperProps: {
                sx: { bgcolor: '#004060', color: '#fff' },
              },
            }}
          >
            {facilities.length === 0 && !loading ? (
              <MenuItem value="" sx={{ color: '#aaa' }}>
                <em>No hay instalaciones disponibles</em>
              </MenuItem>
            ) : (
              facilities.map((facility) => (
                <MenuItem key={facility.id} value={facility.id}>
                  {facility.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenFacilityDialog}
          disabled={loading || isFacilityOperator}
          sx={{
            borderRadius: 2,
            borderColor: '#b0c4de',
            color: '#b0c4de',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)',
              borderColor: '#fff',
            },
          }}
        >
          {BUTTON_LABELS.ADD_FACILITY}
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenStageDialog(null)}
          disabled={loading || isFacilityOperator}
          sx={{
            borderRadius: 2,
            bgcolor: '#4CAF50',
            '&:hover': { bgcolor: '#43A047' },
          }}
        >
          {BUTTON_LABELS.ADD_STAGE}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#fff' }}>
          <CircularProgress color="inherit" />
          <Typography variant="body1" sx={{ ml: 2, color: '#fff' }}>Cargando datos de cultivo...</Typography>
        </Box>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 2,
              pb: 2,
              alignItems: 'flex-start',
              minHeight: '200px',
            }}
          >
            {stages.length === 0 ? (
              <Typography variant="h6" sx={{ color: '#aaa', textAlign: 'center', width: '100%', mt: 5 }}>
                No hay etapas de cultivo. ¡Añade una para empezar!
              </Typography>
            ) : (
              stages.map((stage) => (
                <StageView
                  key={stage.id}
                  stage={stage}
                  cultivationAreas={cultivationAreas.find(s => s.id === stage.id)?.cultivationAreas || []}
                  tenantId={tenantId}
                  refreshCultivationAreas={() => fetchCultivationAreas(selectedFacilityId)} // Pasa la función con el ID actual
                  handleDeleteStage={handleDeleteStageClick}
                  setParentSnack={showSnack}
                  setParentConfirmDialog={setConfirmDialogData}
                  setParentConfirmDialogOpen={setConfirmDialogOpen}
                  selectedFacilityId={selectedFacilityId}
                  facilities={facilities}
                  isFacilityOperator={isFacilityOperator}
                  isGlobalAdmin={isGlobalAdmin}
                />
              ))
            )}
          </Box>
          <DragOverlay>
            {activeDraggableId ? (
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: '#fff',
                  borderRadius: 1.5,
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  cursor: 'grabbing',
                  width: '280px',
                  opacity: 0.8,
                }}
              >
                <CultivationAreaContent area={getActiveCultivationArea()} setParentSnack={showSnack} />
              </Paper>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.message}
        </Alert>
      </Snackbar>

      <Dialog open={openStageDialog} onClose={handleCloseStageDialog} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#283e51', color: '#fff', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#3a506b', color: '#fff' }}>{editingStage ? DIALOG_TITLES.EDIT_STAGE : DIALOG_TITLES.CREATE_STAGE}</DialogTitle>
        <form onSubmit={handleSaveStage}>
          <DialogContent sx={{ pt: '20px !important' }}>
            <TextField
              label="Nombre de la Etapa"
              value={stageName}
              onChange={e => setStageName(e.target.value)}
              fullWidth
              required
              sx={{ mt: 1, mb: 2,
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              }}
              disabled={stageDialogLoading}
              helperText={!stageName.trim() && openStageDialog ? SNACK_MESSAGES.STAGE_NAME_REQUIRED : ''}
              error={!stageName.trim() && openStageDialog}
              inputProps={{ maxLength: 100 }}
              aria-label="Nombre de la etapa"
            />
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#3a506b' }}>
            <Button onClick={handleCloseStageDialog} disabled={stageDialogLoading} sx={{ color: '#a0aec0' }}>{BUTTON_LABELS.CANCEL}</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={stageDialogLoading || !stageName.trim()}
              sx={{
                bgcolor: '#4CAF50',
                '&:hover': { bgcolor: '#43A047' }
              }}
            >
              {stageDialogLoading ? <CircularProgress size={24} /> : (editingStage ? BUTTON_LABELS.SAVE_CHANGES : BUTTON_LABELS.CREATE_STAGE)}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openFacilityDialog} onClose={handleCloseFacilityDialog} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#2d3748', color: '#e2e8f0', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#3a506b', color: '#fff' }}>{DIALOG_TITLES.CREATE_FACILITY}</DialogTitle>
        <form onSubmit={handleSaveFacility}>
          <DialogContent sx={{ pt: '20px !important' }}>
            <TextField
              label="Nombre de la Instalación"
              value={newFacilityName}
              onChange={e => setNewFacilityName(e.target.value)}
              fullWidth
              required
              sx={{ mt: 1, mb: 2,
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              }}
              disabled={facilityDialogLoading}
              inputProps={{ maxLength: 100 }}
              aria-label="Nombre de la instalación"
            />
            {isGlobalAdmin && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="tenant-select-label" sx={{ color: '#fff' }}>Asignar a Inquilino</InputLabel>
                <Select
                  labelId="tenant-select-label"
                  value={selectedTenantForNewFacility}
                  label="Asignar a Inquilino"
                  onChange={(e) => setSelectedTenantForNewFacility(e.target.value)}
                  required
                  disabled={facilityDialogLoading}
                  sx={{
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                    '.MuiSvgIcon-root': { color: '#fff' },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { bgcolor: '#004060', color: '#fff' },
                    },
                  }}
                >
                  {tenants.length === 0 ? (
                    <MenuItem value="" sx={{ color: '#aaa' }}>
                      <em>No hay inquilinos disponibles</em>
                    </MenuItem>
                  ) : (
                    tenants.map((tenant) => (
                      <MenuItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions sx={{ bgcolor: '#3a506b' }}>
            <Button onClick={handleCloseFacilityDialog} disabled={facilityDialogLoading} sx={{ color: '#a0aec0' }}>{BUTTON_LABELS.CANCEL}</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={facilityDialogLoading || !newFacilityName.trim() || (isGlobalAdmin && !selectedTenantForNewFacility)}
              sx={{
                bgcolor: '#4CAF50',
                '&:hover': { bgcolor: '#43A047' }
              }}
            >
              {facilityDialogLoading ? <CircularProgress size={24} /> : BUTTON_LABELS.CREATE_FACILITY}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmationDialog
        open={confirmDialogOpen}
        title={confirmDialogData.title}
        message={confirmDialogData.message}
        onConfirm={confirmDialogData.onConfirm}
        onCancel={() => setConfirmDialogOpen(false)}
      />
    </Box>
  );
};

CultivationPage.propTypes = {
  tenantId: PropTypes.number, // Puede ser null para Super Admin
  isAppReady: PropTypes.bool.isRequired,
  userFacilityId: PropTypes.number, // Asumiendo que facilityId es numérico
  isGlobalAdmin: PropTypes.bool.isRequired,
  setParentSnack: PropTypes.func.isRequired, // Añadido propType para setParentSnack
};

export default CultivationPage;
