export const categories = [
   { id: '1', name: 'Music', icon: '🎵' },
   { id: '2', name: 'Tech', icon: '💻' },
   { id: '3', name: 'Sports', icon: '⚽' },
   { id: '4', name: 'Business', icon: '💼' },
 ];
 
 export const events = [
   {
     id: '1',
     title: 'Afrobeats Night Live',
     description: 'Experience the best of African music with top artists performing live. A night of rhythm, dance, and unforgettable memories.',
     date: '2025-03-15',
     time: '19:00',
     location: 'Nairobi, Kenya',
     venue: 'Kenyatta International Convention Centre',
     categoryId: '1',
     category: 'Music',
     price: 2500,
     currency: 'KES',
     image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop',
     totalSeats: 500,
     availableSeats: 342,
     featured: true,
   },
   {
     id: '2',
     title: 'DevCon Africa 2025',
     description: 'The largest developer conference in Africa. Learn from industry leaders, network with peers, and discover the latest in tech.',
     date: '2025-04-20',
     time: '09:00',
     location: 'Lagos, Nigeria',
     venue: 'Eko Hotels & Suites',
     categoryId: '2',
     category: 'Tech',
     price: 15000,
     currency: 'NGN',
     image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
     totalSeats: 1000,
     availableSeats: 567,
     featured: true,
   },
   {
     id: '3',
     title: 'Kenya vs Tanzania - AFCON Qualifier',
     description: 'Witness the intense rivalry as Kenya takes on Tanzania in this crucial AFCON qualifier match.',
     date: '2025-03-28',
     time: '16:00',
     location: 'Nairobi, Kenya',
     venue: 'Kasarani Stadium',
     categoryId: '3',
     category: 'Sports',
     price: 1500,
     currency: 'KES',
     image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop',
     totalSeats: 40000,
     availableSeats: 12500,
   },
   {
     id: '4',
     title: 'Africa Startup Summit',
     description: 'Connect with investors, founders, and innovators shaping the future of African business.',
     date: '2025-05-10',
     time: '08:30',
     location: 'Cape Town, South Africa',
     venue: 'Cape Town International Convention Centre',
     categoryId: '4',
     category: 'Business',
     price: 5000,
     currency: 'ZAR',
     image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop',
     totalSeats: 800,
     availableSeats: 234,
     featured: true,
   },
   {
     id: '5',
     title: 'Jazz Under the Stars',
     description: 'An intimate evening of smooth jazz under the beautiful African sky.',
     date: '2025-04-05',
     time: '20:00',
     location: 'Johannesburg, South Africa',
     venue: 'The Venue at Melrose Arch',
     categoryId: '1',
     category: 'Music',
     price: 750,
     currency: 'ZAR',
     image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&auto=format&fit=crop',
     totalSeats: 200,
     availableSeats: 45,
   },
   {
     id: '6',
     title: 'AI & Machine Learning Workshop',
     description: 'Hands-on workshop on building AI solutions for African challenges.',
     date: '2025-04-12',
     time: '10:00',
     location: 'Accra, Ghana',
     venue: 'Impact Hub Accra',
     categoryId: '2',
     category: 'Tech',
     price: 500,
     currency: 'GHS',
     image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
     totalSeats: 50,
     availableSeats: 12,
   },
 ];
 
 // Generate seats for an event
 export const generateSeats = (eventId, rows = 10, seatsPerRow = 10) => {
   const seats = [];
   const rowLabels = 'ABCDEFGHIJ'.split('');
   
   for (let r = 0; r < rows; r++) {
     for (let s = 1; s <= seatsPerRow; s++) {
       const randomStatus = Math.random();
       let status = 'available';
       if (randomStatus > 0.85) status = 'booked';
       else if (randomStatus > 0.75) status = 'reserved';
       
       seats.push({
         id: `${eventId}-${rowLabels[r]}${s}`,
         eventId,
         row: rowLabels[r],
         number: s,
         status,
         price: r < 3 ? 150 : r < 6 ? 100 : 75, // VIP, Standard, Economy
       });
     }
   }
   
   return seats;
 };