import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import '@fullcalendar/core/locales/fr';
import '../styles/Calendar.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_EVENTS } from "../api";
import Modal from 'react-modal';

Modal.setAppElement('#root');

const categoryColors = {
  location: '#1E90FF',
  maintenance: '#FF6347',
  autre: '#A9A9A9'
};

const categoryLabels = {
  location: 'Location',
  maintenance: 'Maintenance',
  autre: 'Autre'
};

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('location');
  const [endDate, setEndDate] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [clickInfo, setClickInfo] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_EVENTS);
      const formattedEvents = response.data.map(evt => ({
        ...evt,
        id: evt._id,
        color: categoryColors[evt.category] || categoryColors.autre,
        start: evt.start,
        end: evt.end || undefined,
        extendedProps: {
          ...evt.extendedProps,
          category: evt.category
        }
      }));
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Erreur récupération events:', err);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const handleEventsUpdate = () => fetchEvents();
    window.addEventListener('eventsUpdated', handleEventsUpdate);
    return () => window.removeEventListener('eventsUpdated', handleEventsUpdate);
  }, []);

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setEndDate(arg.dateStr);
    setClickInfo(arg);
    setIsEventFormOpen(true);
  };

  const handleSubmitEvent = async () => {
    if (!title || !selectedDate) {
      toast.warn('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    const eventData = {
      title,
      start: selectedDate,
      end: endDate === selectedDate ? undefined : endDate,
      category
    };

    try {
      if (eventToEdit) {
        await axios.put(`${API_EVENTS}/${eventToEdit.id}`, eventData);
        toast.success('✏️ Événement modifié avec succès');
      } else {
        await axios.post(API_EVENTS, eventData);
        toast.success(' Événement ajouté avec succès');
      }

      window.dispatchEvent(new Event("eventsUpdated"));
      resetForm();
      setIsEventFormOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout/modification:", error);
      toast.error(" Erreur lors de la sauvegarde de l'événement");
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('location');
    setSelectedDate(null);
    setEndDate('');
    setEventToEdit(null);
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    setTitle(event.title);
    setCategory(event.extendedProps?.category || 'location');
    setSelectedDate(event.startStr);
    setEndDate(event.endStr ? event.endStr.split('T')[0] : '');
    setEventToEdit(event);
    setClickInfo(clickInfo);
    setIsEventFormOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      await axios.delete(`${API_EVENTS}/${eventToDelete.id}`);
      toast.success('🗑️ Événement supprimé avec succès');
      window.dispatchEvent(new Event("eventsUpdated"));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error(" Erreur lors de la suppression");
    }
  };

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(evt => evt.extendedProps?.category === filter);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="calendar-title">Calendrier</h2>
        {isLoading && <div className="loading-spinner">Chargement...</div>}
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les événements</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={filteredEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        selectable={true}
        locale="fr"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
        height="auto"
        eventDisplay="block"
      />

      {isEventFormOpen && clickInfo && (
        <div
          className="event-form-popup"
          style={{
            position: 'absolute',
            top: `${clickInfo.jsEvent.pageY}px`,
            left: `${clickInfo.jsEvent.pageX}px`,
            zIndex: 100
          }}
        >
          <div className="popup-content">
            <h3>{eventToEdit ? "Modifier l'événement" : `Nouvel événement (${new Date(selectedDate).toLocaleDateString('fr-FR')})`}</h3>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titre"
              autoFocus
              className="form-input"
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="form-select"
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <label className="form-label">Date de fin (optionnelle)</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={selectedDate}
              className="form-input"
            />
            <div className="form-buttons">
              <button onClick={handleSubmitEvent} className="btn-primary">
                {eventToEdit ? "Modifier" : "Ajouter"}
              </button>
              <button
                onClick={() => setIsEventFormOpen(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              {eventToEdit && (
                <button
                  onClick={() => {
                    setEventToDelete(eventToEdit);
                    setIsEventFormOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="btn1-danger"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        contentLabel="Confirmation de suppression"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Confirmer la suppression</h2>
        <p>Voulez-vous vraiment supprimer l'événement :</p>
        <p><strong>{eventToDelete?.title}</strong> ({categoryLabels[eventToDelete?.category]})</p>
        <div className="modal-buttons">
          <button onClick={handleDeleteEvent} className="btn-danger">Confirmer</button>
          <button onClick={() => setIsDeleteModalOpen(false)} className="btn-cancel">Annuler</button>
        </div>
      </Modal>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Calendar;
