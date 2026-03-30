import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '@/components/admin/event-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API calls
jest.mock('@/lib/api/events', () => ({
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
}));

// Mock the file upload utility
jest.mock('@/lib/utils/fileUpload', () => ({
  createImagePreview: jest.fn(),
  isImageFile: jest.fn().mockReturnValue(true),
  validateFileSize: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderEventForm = (props = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <EventForm {...props} />
    </QueryClientProvider>
  );
};

describe('EventForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the form with default values', () => {
    renderEventForm();
    
    // Check if form fields are rendered
    expect(screen.getByLabelText(/event title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total seats/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/free event/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/publish event/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderEventForm();
    
    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));
    
    // Check for validation errors
    expect(await screen.findByText('Title must be at least 3 characters')).toBeInTheDocument();
    expect(await screen.findByText('Description must be at least 10 characters')).toBeInTheDocument();
    expect(await screen.findByText('Please select a category')).toBeInTheDocument();
    expect(await screen.findByText('Venue must be at least 3 characters')).toBeInTheDocument();
  });

  it('handles form submission for new event', async () => {
    const mockEvent = {
      title: 'Test Event',
      description: 'This is a test event',
      category_id: '1',
      date: new Date('2024-12-31'),
      time: '19:00',
      venue: 'Test Venue',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zip_code: '12345',
      country: 'Test Country',
      total_seats: 100,
      is_free: false,
      price: 29.99,
      is_published: true,
    };

    const { createEvent } = require('@/lib/api/events');
    createEvent.mockResolvedValueOnce({ id: '123', ...mockEvent });

    renderEventForm();

    // Fill in the form
    userEvent.type(screen.getByLabelText(/event title/i), mockEvent.title);
    userEvent.type(screen.getByLabelText(/description/i), mockEvent.description);
    
    // Select category
    fireEvent.mouseDown(screen.getByLabelText(/category/i));
    fireEvent.click(await screen.findByText('Music'));
    
    // Fill in other fields
    userEvent.type(screen.getByLabelText(/venue name/i), mockEvent.venue);
    userEvent.type(screen.getByLabelText(/address/i), mockEvent.address);
    userEvent.type(screen.getByLabelText(/city/i), mockEvent.city);
    userEvent.type(screen.getByLabelText(/state/i), mockEvent.state);
    userEvent.type(screen.getByLabelText(/zip/i), mockEvent.zip_code);
    userEvent.type(screen.getByLabelText(/country/i), mockEvent.country);
    userEvent.type(screen.getByLabelText(/total seats/i), mockEvent.total_seats.toString());
    userEvent.type(screen.getByLabelText(/price/i), mockEvent.price.toString());
    
    // Toggle published
    userEvent.click(screen.getByLabelText(/publish event/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    // Check if the API was called with the correct data
    await waitFor(() => {
      expect(createEvent).toHaveBeenCalledTimes(1);
      expect(createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockEvent.title,
          description: mockEvent.description,
          category_id: expect.any(Number),
          venue: mockEvent.venue,
          address: mockEvent.address,
          city: mockEvent.city,
          state: mockEvent.state,
          zip_code: mockEvent.zip_code,
          country: mockEvent.country,
          total_seats: mockEvent.total_seats,
          price: mockEvent.price,
          is_published: mockEvent.is_published,
        })
      );
    });
  });

  it('handles image upload', async () => {
    const { createImagePreview } = require('@/lib/utils/fileUpload');
    createImagePreview.mockResolvedValue('data:image/jpeg;base64,test');
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    renderEventForm();
    
    // Simulate file upload
    const fileInput = screen.getByTestId('file-upload');
    userEvent.upload(fileInput, file);
    
    // Check if the image preview is displayed
    expect(await screen.findByAltText('Preview')).toBeInTheDocument();
    
    // Check if the remove button is displayed
    const removeButton = screen.getByRole('button', { name: /remove image/i });
    expect(removeButton).toBeInTheDocument();
    
    // Test removing the image
    userEvent.click(removeButton);
    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
  });

  it('handles edit mode', () => {
    const mockEvent = {
      id: '123',
      title: 'Existing Event',
      description: 'This is an existing event',
      category_id: '1',
      date: '2024-12-31T19:00:00.000Z',
      time: '19:00',
      venue: 'Existing Venue',
      address: '123 Existing St',
      city: 'Existing City',
      state: 'Existing State',
      zip_code: '54321',
      country: 'Existing Country',
      total_seats: 200,
      is_free: true,
      price: 0,
      is_published: true,
      image_url: 'https://example.com/image.jpg',
    };
    
    renderEventForm({ event: mockEvent });
    
    // Check if form is populated with event data
    expect(screen.getByLabelText(/event title/i)).toHaveValue(mockEvent.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(mockEvent.description);
    expect(screen.getByLabelText(/venue name/i)).toHaveValue(mockEvent.venue);
    expect(screen.getByLabelText(/free event/i)).toBeChecked();
    expect(screen.getByLabelText(/publish event/i)).toBeChecked();
    expect(screen.getByRole('button', { name: /update event/i })).toBeInTheDocument();
  });
});
