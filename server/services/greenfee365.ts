/**
 * Greenfee365 API Integration Service
 * Handles golf course searches and bookings through Greenfee365
 */

export interface CourseSearchParams {
  location?: string;
  date?: string;
  players?: number;
  courseName?: string;
}

export interface Course {
  id: string;
  name: string;
  location: string;
  region: string;
  price: number;
  currency: string;
  rating: number;
  availableSlots: TeeTimeSlot[];
  description?: string;
  imageUrl?: string;
}

export interface TeeTimeSlot {
  time: string;
  available: boolean;
  price: number;
  players: number;
}

export interface BookingRequest {
  courseId: string;
  courseName: string;
  playDate: string;
  teeTime: string;
  playerCount: number;
  userName: string;
  userEmail: string;
}

export interface BookingResponse {
  bookingId: string;
  status: "confirmed" | "pending" | "failed";
  confirmationNumber: string;
  courseName: string;
  playDate: string;
  teeTime: string;
  totalPrice: number;
  currency: string;
}

// Mock courses database for demonstration
const MOCK_COURSES: Course[] = [
  {
    id: "valderrama",
    name: "Real Club Valderrama",
    location: "Sotogrande",
    region: "Costa del Sol",
    price: 350,
    currency: "EUR",
    rating: 4.9,
    description: "One of Europe's most prestigious courses, host to the 1997 Ryder Cup.",
    imageUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1000",
    availableSlots: [
      { time: "08:00", available: true, price: 350, players: 4 },
      { time: "08:30", available: true, price: 350, players: 4 },
      { time: "09:00", available: false, price: 350, players: 4 },
      { time: "10:00", available: true, price: 380, players: 4 },
      { time: "14:00", available: true, price: 320, players: 4 },
    ],
  },
  {
    id: "sotogrande",
    name: "Sotogrande Old Course",
    location: "Sotogrande",
    region: "Costa del Sol",
    price: 180,
    currency: "EUR",
    rating: 4.7,
    description: "A beautiful Robert Trent Jones Sr. design with stunning views.",
    imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=1000",
    availableSlots: [
      { time: "07:30", available: true, price: 180, players: 4 },
      { time: "08:00", available: true, price: 180, players: 4 },
      { time: "09:00", available: true, price: 180, players: 4 },
      { time: "10:30", available: true, price: 200, players: 4 },
      { time: "13:00", available: true, price: 160, players: 4 },
    ],
  },
  {
    id: "finca-cortesin",
    name: "Finca Cortesin",
    location: "Casares",
    region: "Costa del Sol",
    price: 280,
    currency: "EUR",
    rating: 4.8,
    description: "Luxury resort course with impeccable conditions.",
    imageUrl: "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&q=80&w=1000",
    availableSlots: [
      { time: "08:00", available: true, price: 280, players: 4 },
      { time: "09:30", available: true, price: 280, players: 4 },
      { time: "11:00", available: true, price: 300, players: 4 },
      { time: "14:00", available: true, price: 260, players: 4 },
    ],
  },
  {
    id: "la-reserva",
    name: "La Reserva Club",
    location: "Sotogrande",
    region: "Costa del Sol",
    price: 220,
    currency: "EUR",
    rating: 4.6,
    description: "Modern design with spectacular mountain and sea views.",
    availableSlots: [
      { time: "07:00", available: true, price: 220, players: 4 },
      { time: "08:30", available: true, price: 220, players: 4 },
      { time: "10:00", available: true, price: 240, players: 4 },
      { time: "13:30", available: true, price: 200, players: 4 },
    ],
  },
  {
    id: "san-roque",
    name: "San Roque Club",
    location: "San Roque",
    region: "Costa del Sol",
    price: 160,
    currency: "EUR",
    rating: 4.5,
    description: "Two championship courses in a stunning setting.",
    availableSlots: [
      { time: "07:30", available: true, price: 160, players: 4 },
      { time: "09:00", available: true, price: 160, players: 4 },
      { time: "10:30", available: true, price: 180, players: 4 },
      { time: "12:00", available: true, price: 160, players: 4 },
      { time: "14:00", available: true, price: 140, players: 4 },
    ],
  },
];

export class Greenfee365Service {
  private apiKey: string | null;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GREENFEE365_API_KEY || null;
    this.baseUrl = process.env.GREENFEE365_BASE_URL || "https://api.greenfee365.com/v1";
  }

  /**
   * Search for available golf courses
   */
  async searchCourses(params: CourseSearchParams): Promise<Course[]> {
    // In production, this would call the real Greenfee365 API
    // For now, we'll use mock data with filtering
    
    let results = [...MOCK_COURSES];

    // Filter by location/region
    if (params.location) {
      const locationLower = params.location.toLowerCase();
      results = results.filter(course => 
        course.location.toLowerCase().includes(locationLower) ||
        course.region.toLowerCase().includes(locationLower) ||
        course.name.toLowerCase().includes(locationLower)
      );
    }

    // Filter by course name
    if (params.courseName) {
      const nameLower = params.courseName.toLowerCase();
      results = results.filter(course => 
        course.name.toLowerCase().includes(nameLower)
      );
    }

    // Filter available slots by date/players (simplified for demo)
    if (params.date || params.players) {
      results = results.map(course => ({
        ...course,
        availableSlots: course.availableSlots.filter(slot => slot.available),
      })).filter(course => course.availableSlots.length > 0);
    }

    return results;
  }

  /**
   * Get course details by ID
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    const course = MOCK_COURSES.find(c => c.id === courseId);
    return course || null;
  }

  /**
   * Get available tee times for a specific course and date
   */
  async getAvailableTeeTimes(courseId: string, date: string, players: number = 4): Promise<TeeTimeSlot[]> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    // Filter slots by availability and player count
    return course.availableSlots.filter(slot => 
      slot.available && slot.players >= players
    );
  }

  /**
   * Book a tee time
   */
  async bookTeeTime(request: BookingRequest): Promise<BookingResponse> {
    // In production, this would call the real Greenfee365 booking API
    const course = await this.getCourseById(request.courseId);
    
    if (!course) {
      throw new Error(`Course ${request.courseId} not found`);
    }

    // Check if slot is available
    const slot = course.availableSlots.find(s => s.time === request.teeTime && s.available);
    if (!slot) {
      throw new Error(`Tee time ${request.teeTime} is not available`);
    }

    // Generate confirmation number
    const confirmationNumber = `GF${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Calculate total price
    const totalPrice = slot.price * request.playerCount;

    return {
      bookingId: `booking-${Date.now()}`,
      status: "confirmed",
      confirmationNumber,
      courseName: request.courseName,
      playDate: request.playDate,
      teeTime: request.teeTime,
      totalPrice,
      currency: course.currency,
    };
  }
}

export const greenfee365 = new Greenfee365Service();

