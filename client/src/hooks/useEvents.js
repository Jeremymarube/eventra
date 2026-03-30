import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/lib/api/events';
import { toast } from 'sonner';

export function useEvents(params = {}) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventService.getEvents(params),
    keepPreviousData: true,
  });
}

export function useEvent(id) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => eventService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.message || 'Failed to create event');
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => eventService.updateEvent(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] });
      toast.success('Event updated successfully');
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.message || 'Failed to update event');
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => eventService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event');
    },
  });
}

export function useDeleteMultipleEvents() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids) => eventService.deleteMultipleEvents(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Selected events deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting events:', error);
      toast.error(error.response?.data?.message || 'Failed to delete events');
    },
  });
}

export function useEventStats() {
  return useQuery({
    queryKey: ['eventStats'],
    queryFn: () => eventService.getEventStats(),
  });
}

export function useEventsByCategory(categoryId) {
  return useQuery({
    queryKey: ['eventsByCategory', categoryId],
    queryFn: () => eventService.getEventsByCategory(categoryId),
    enabled: !!categoryId,
  });
}

export function useSearchEvents(query) {
  return useQuery({
    queryKey: ['searchEvents', query],
    queryFn: () => eventService.searchEvents(query),
    enabled: !!query,
  });
}
