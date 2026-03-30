import { api } from './api';

const API_URL = '/events';


export const eventService = {
  // Get all events with optional query parameters
  getEvents: async (params = {}) => {
    try {
      // Map frontend params to backend params
      const backendParams = {};
      if (params.category) {
        backendParams.category_id = params.category;
      }
      if (params.all) {
        backendParams.all = true;
      }
      
      const response = await api.get(API_URL, { params: backendParams });
      
      // If limit is specified, apply it after getting the results
      if (params.limit) {
        return response.data.slice(0, params.limit);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get a single event by ID
  getEventById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      throw error;
    }
  },

  // Create a new event
  createEvent: async (eventData) => {
    try {
      // bail out early if offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Network offline');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Creating event with data:', eventData);
      }
      
      // Create a config object without Content-Type to let the browser set it with the correct boundary
      const config = {};
      
      // If eventData is already FormData, use it directly
      if (eventData instanceof FormData) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Using existing FormData');
          console.log('FormData entries:');
        }
        for (let pair of eventData.entries()) {
          console.log(pair[0] + ': ', pair[1]);
        }
        
        const response = await api.post(API_URL, eventData, config);
        return response.data;
      }
      
      // Otherwise, create new FormData
      const formData = new FormData();
      
      // Append all fields to formData
      Object.entries(eventData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (key === 'image' && value instanceof File) {
            formData.append('image', value);
          } else if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending FormData with entries:');
      }
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }

      const response = await api.post(API_URL, formData, config);
      return response.data;
    } catch (error) {
      // convert axios network errors to more user-friendly messages
      if (error.message === 'Network offline') {
        alert('Unable to create event: you are offline. Please reconnect and try again.');
      } else if (error.message === 'Network Error') {
        alert('Unable to reach server. Please check your connection or try again later.');
      }
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Update an existing event
  updateEvent: async (id, eventData) => {
    try {
      // If eventData is already FormData, use it directly
      if (eventData instanceof FormData) {
        const response = await api.put(`${API_URL}/${id}`, eventData);
        return response.data;
      }
      
      // Otherwise, create new FormData
      const formData = new FormData();
      
      // Append all fields to formData
      Object.entries(eventData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (key === 'image' && value instanceof File) {
          formData.append('image', value);
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Updating event with data:');
      }
      for (let [key, value] of formData.entries()) {
        if (process.env.NODE_ENV === 'development') {
          console.log(key, value);
        }
      }

      const response = await api.put(`${API_URL}/${id}`, formData);
      return response.data;
    } catch (error) {
      console.error(`Error updating event ${id}:`, error);
      throw error;
    }
  },

  // Delete an event
  deleteEvent: async (id) => {
    try {
      const response = await api.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error);
      throw error;
    }
  },

  // Cancel an event
  cancelEvent: async (id) => {
    try {
      const response = await api.post(`${API_URL}/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error cancelling event ${id}:`, error);
      throw error;
    }
  },

  // Delete multiple events
  deleteMultipleEvents: async (ids) => {
    try {
      const response = await api.delete(API_URL, { data: { ids } });
      return response.data;
    } catch (error) {
      console.error('Error deleting events:', error);
      throw error;
    }
  },

  // Get event statistics
  getEventStats: async () => {
    try {
      const response = await api.get(`${API_URL}/stats/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event stats:', error);
      throw error;
    }
  },

  // Get events by category
  getEventsByCategory: async (categoryId) => {
    try {
      const response = await api.get(`${API_URL}/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching events for category ${categoryId}:`, error);
      throw error;
    }
  },

  // Search events
  searchEvents: async (query) => {
    try {
      const response = await api.get(`${API_URL}/search`, { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  },

  // Get available seats for an event
  getSeats: async (eventId) => {
    try {
      const response = await api.get(`${API_URL}/${eventId}/seats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching seats for event ${eventId}:`, error);
      throw error;
    }
  },
};

export default eventService;
