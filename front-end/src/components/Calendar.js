import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import '@fullcalendar/core/locales/fr';
import '../styles/Calendar.css';
import { toast, ToastContainer } from 'react-toastify';
import { API_EVENTS } from "../api";

const categoryColors = {
  location: '#1E90FF',
  maintenance: '#FF6347',
};

const categoryLabels = {
  location: 'Location',
  maintenance: 'Maintenance',
};

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); 

const fetchEvents = async () => {
  setIsLoading(true);
  try {
    const response = await axios.get(API_EVENTS);
    const formattedEvents = response.data
      .filter(evt => {
        // Ne pas afficher les maintenances terminées
        if (evt.category === 'maintenance' && evt.statut === 'Terminée') {
          return false;
        }
        return true;
      })
      .map(evt => ({
        ...evt,
        id: evt._id,
        color: categoryColors[evt.category] || '#999999',
        start: evt.start,
        end: evt.end || undefined,
        extendedProps: {
          ...evt.extendedProps,
          category: evt.category,
          clientNom: evt.clientNom,
          clientPrenom: evt.clientPrenom,
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

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(evt => evt.extendedProps?.category === filter);

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
  };
  const closeDetails = () => {
    setSelectedEvent(null);
  };

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
  locale="fr"
  headerToolbar={{
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek'
  }}
  buttonText={{
    today: "Aujourd'hui",
    month: "Mois",
    week: "Semaine"
  }}
  height="auto"
  eventDisplay="block"
  displayEventTime={false}
  eventClick={handleEventClick}
/>


      {/* Affichage des détails de l'événement quand il est sélectionné */}
      {selectedEvent && (
        <div className="event-details-popup">
          <button className="close-btn" onClick={closeDetails}>X</button>
          <h3>Détails de l'événement</h3>
          <p><strong>Titre :</strong> {selectedEvent.title}</p>
          <p><strong>Date de début :</strong> {selectedEvent.start.toLocaleDateString()}</p>
          {selectedEvent.end && (
            <p><strong>Date de fin :</strong> {selectedEvent.end.toLocaleDateString()}</p>
          )}
          <p><strong>Catégorie :</strong> {selectedEvent.extendedProps.category}</p>
          {selectedEvent.extendedProps.description && (
            <p><strong>Description :</strong> {selectedEvent.extendedProps.description}</p>
          )}
          {/* Ajout des informations du client */}
          {selectedEvent.extendedProps.clientNom && (
            <p><strong>Client :</strong> {selectedEvent.extendedProps.clientNom} {selectedEvent.extendedProps.clientPrenom}</p>
          )}
        </div>
      )}

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