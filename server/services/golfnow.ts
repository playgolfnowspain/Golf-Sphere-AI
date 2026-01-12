/**
 * GolfNow API Integration Service
 * Handles golf course searches and bookings through GolfNow's Affiliate & Partner API
 * Documentation: https://developer.golfnow.com/ or https://affiliate.gnsvc.com/
 */

export interface CourseSearchParams {
  location?: string;
  date?: string;
  players?: number;
  courseName?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
}

export interface Course {
  id: string;
  name: string;
  location: string;
  region: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  price: number;
  currency: string;
  rating: number;
  availableSlots: TeeTimeSlot[];
  description?: string;
  imageUrl?: string;
  affiliateUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface TeeTimeSlot {
  time: string;
  available: boolean;
  price: number;
  players: number;
  currency: string;
  courseId?: string;
  facilityId?: string;
}

export interface BookingRequest {
  courseId: string;
  facilityId?: string;
  courseName: string;
  playDate: string;
  teeTime: string;
  playerCount: number;
  userName: string;
  userEmail: string;
  userPhone?: string;
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
  affiliateTrackingId?: string;
}

export class GolfNowService {
  private userName: string | null;
  private password: string | null;
  private channelId: string | null;
  private affiliateId: string | null;
  private baseUrl: string;
  private isProduction: boolean;

  constructor() {
    // GolfNow API uses UserName/Password authentication (not API keys)
    this.userName = process.env.GOLFNOW_USERNAME || null;
    this.password = process.env.GOLFNOW_PASSWORD || null;
    this.channelId = process.env.GOLFNOW_CHANNEL_ID || null;
    this.affiliateId = process.env.GOLFNOW_AFFILIATE_ID || null;
    // Base URL: sandbox.api.gnsvc.com/rest for sandbox, api.gnsvc.com/rest for production
    this.baseUrl = process.env.GOLFNOW_BASE_URL || "https://sandbox.api.gnsvc.com/rest";
    this.isProduction = !!(this.userName && this.password && this.channelId);
  }

  /**
   * Get API headers with authentication
   * GolfNow API uses UserName and Password headers for simple authentication
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate",
      "AdvancedErrorCodes": "True",
    };

    if (this.userName && this.password) {
      headers["UserName"] = this.userName;
      headers["Password"] = this.password;
    }

    return headers;
  }

  /**
   * Add affiliate tracking to URLs
   */
  private addAffiliateTracking(url: string): string {
    if (this.affiliateId) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}affiliate_id=${this.affiliateId}`;
    }
    return url;
  }

  /**
   * Search for available golf courses
   */
  async searchCourses(params: CourseSearchParams): Promise<Course[]> {
    if (this.isProduction) {
      try {
        // Build query parameters for GolfNow API
        const queryParams = new URLSearchParams();
        
        // GolfNow uses q=geo-location for location-based searches
        if (params.latitude && params.longitude) {
          queryParams.append("q", "geo-location");
          queryParams.append("latitude", params.latitude.toString());
          queryParams.append("longitude", params.longitude.toString());
          // proximity is in miles (default 25 if not specified)
          queryParams.append("proximity", (params.radius || 25).toString());
        } else if (params.location) {
          queryParams.append("q", params.location);
        }
        
        // Expand to get facility details and rates
        queryParams.append("expand", "FacilityDetail.Ratesets");
        
        if (params.date) {
          queryParams.append("playDate", params.date);
        }
        if (params.players) {
          queryParams.append("players", params.players.toString());
        }

        // GolfNow API endpoint: /rest/channel/{channelId}/facilities
        const url = `${this.baseUrl}/channel/${this.channelId}/facilities?${queryParams.toString()}`;
        const response = await fetch(url, {
          method: "GET",
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`GolfNow API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform GolfNow response to our Course format
        // Note: Adjust mapping based on actual GolfNow API response structure
        return this.transformGolfNowFacilities(data.facilities || data.data || []);
      } catch (error) {
        console.error("GolfNow API error:", error);
        // Fallback to mock data if API fails
        return this.getMockCourses(params);
      }
    }

    // Use mock data when API key is not configured
    return this.getMockCourses(params);
  }

  /**
   * Transform GolfNow facility data to Course format
   */
  private transformGolfNowFacilities(facilities: any[]): Course[] {
    return facilities.map((facility: any) => ({
      id: facility.id?.toString() || facility.facilityId?.toString() || "",
      name: facility.name || facility.facilityName || "Unknown Course",
      location: facility.city || facility.location || "",
      region: facility.state || facility.region || "",
      address: facility.address,
      city: facility.city,
      state: facility.state,
      country: facility.country || "Spain",
      price: facility.minPrice || facility.averagePrice || 0,
      currency: facility.currency || "EUR",
      rating: facility.rating || 4.5,
      latitude: facility.latitude,
      longitude: facility.longitude,
      description: facility.description,
      imageUrl: facility.imageUrl || facility.images?.[0],
      affiliateUrl: facility.bookingUrl ? this.addAffiliateTracking(facility.bookingUrl) : undefined,
      availableSlots: [],
    }));
  }

  /**
   * Get course details by ID
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    if (this.isProduction) {
      try {
        const url = `${this.baseUrl}/facilities/${courseId}`;
        const response = await fetch(url, {
          method: "GET",
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          return null;
        }

        const facility = await response.json();
        const courses = this.transformGolfNowFacilities([facility]);
        return courses[0] || null;
      } catch (error) {
        console.error("GolfNow API error:", error);
        return this.getMockCourseById(courseId);
      }
    }

    return this.getMockCourseById(courseId);
  }

  /**
   * Get available tee times for a specific course and date
   */
  async getAvailableTeeTimes(
    courseId: string,
    date: string,
    players: number = 4
  ): Promise<TeeTimeSlot[]> {
    if (this.isProduction) {
      try {
        const queryParams = new URLSearchParams({
          facilityId: courseId,
          playDate: date,
          players: players.toString(),
        });

        const url = `${this.baseUrl}/tee-times?${queryParams.toString()}`;
        const response = await fetch(url, {
          method: "GET",
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tee times: ${response.status}`);
        }

        const data = await response.json();
        return this.transformTeeTimes(data.teeTimes || data.data || []);
      } catch (error) {
        console.error("GolfNow API error:", error);
        // Fallback to mock data
        const course = await this.getCourseById(courseId);
        return this.getMockTeeTimes(courseId, date, players, course);
      }
    }

    // Mock data
    const course = await this.getCourseById(courseId);
    return this.getMockTeeTimes(courseId, date, players, course);
  }

  /**
   * Transform GolfNow tee time data
   */
  private transformTeeTimes(teeTimes: any[]): TeeTimeSlot[] {
    return teeTimes
      .filter((tt: any) => tt.available !== false)
      .map((tt: any) => ({
        time: tt.time || tt.teeTime || "",
        available: tt.available !== false,
        price: tt.price || tt.rate || 0,
        players: tt.players || tt.maxPlayers || 4,
        currency: tt.currency || "EUR",
        courseId: tt.facilityId?.toString(),
        facilityId: tt.facilityId?.toString(),
      }));
  }

  /**
   * Book a tee time through GolfNow
   */
  async bookTeeTime(request: BookingRequest): Promise<BookingResponse> {
    if (this.isProduction) {
      try {
        const bookingPayload = {
          facilityId: request.courseId,
          playDate: request.playDate,
          teeTime: request.teeTime,
          players: request.playerCount,
          customer: {
            name: request.userName,
            email: request.userEmail,
            phone: request.userPhone,
          },
          affiliateId: this.affiliateId,
        };

        const url = `${this.baseUrl}/bookings`;
        const response = await fetch(url, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(bookingPayload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Booking failed: ${response.status}`);
        }

        const booking = await response.json();
        
        return {
          bookingId: booking.bookingId || booking.id || `golfnow-${Date.now()}`,
          status: booking.status || "confirmed",
          confirmationNumber: booking.confirmationNumber || booking.confirmation || "",
          courseName: request.courseName,
          playDate: request.playDate,
          teeTime: request.teeTime,
          totalPrice: booking.totalPrice || booking.amount || 0,
          currency: booking.currency || "EUR",
          affiliateTrackingId: booking.affiliateTrackingId || this.affiliateId || undefined,
        };
      } catch (error) {
        console.error("GolfNow booking error:", error);
        throw error;
      }
    }

    // Mock booking when API is not available
    return this.createMockBooking(request);
  }

  // Mock data methods (fallback when API is not configured)
  private getMockCourses(params: CourseSearchParams): Course[] {
    const mockCourses: Course[] = [
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
        availableSlots: [],
        affiliateUrl: this.affiliateId ? `https://www.golfnow.com/tee-times/facility/valderrama?affiliate_id=${this.affiliateId}` : undefined,
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
        availableSlots: [],
        affiliateUrl: this.affiliateId ? `https://www.golfnow.com/tee-times/facility/sotogrande?affiliate_id=${this.affiliateId}` : undefined,
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
        availableSlots: [],
        affiliateUrl: this.affiliateId ? `https://www.golfnow.com/tee-times/facility/finca-cortesin?affiliate_id=${this.affiliateId}` : undefined,
      },
    ];

    // Filter by location if provided
    if (params.location) {
      const locationLower = params.location.toLowerCase();
      return mockCourses.filter(course =>
        course.location.toLowerCase().includes(locationLower) ||
        course.region.toLowerCase().includes(locationLower) ||
        course.name.toLowerCase().includes(locationLower)
      );
    }

    return mockCourses;
  }

  private getMockCourseById(courseId: string): Course | null {
    const courses = this.getMockCourses({});
    return courses.find(c => c.id === courseId) || null;
  }

  private getMockTeeTimes(courseId: string, date: string, players: number, course: Course | null): TeeTimeSlot[] {
    const basePrice = course?.price || 200;
    return [
      { time: "08:00", available: true, price: basePrice, players, currency: "EUR", courseId },
      { time: "08:30", available: true, price: basePrice, players, currency: "EUR", courseId },
      { time: "09:00", available: true, price: basePrice + 20, players, currency: "EUR", courseId },
      { time: "10:00", available: true, price: basePrice + 30, players, currency: "EUR", courseId },
      { time: "14:00", available: true, price: basePrice - 30, players, currency: "EUR", courseId },
    ];
  }

  private createMockBooking(request: BookingRequest): BookingResponse {
    const confirmationNumber = `GN${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const course = this.getMockCourseById(request.courseId);
    const slot = course ? this.getMockTeeTimes(request.courseId, request.playDate, request.playerCount, course)
      .find(s => s.time === request.teeTime) : null;
    const totalPrice = (slot?.price || 200) * request.playerCount;

    return {
      bookingId: `golfnow-${Date.now()}`,
      status: "confirmed",
      confirmationNumber,
      courseName: request.courseName,
      playDate: request.playDate,
      teeTime: request.teeTime,
      totalPrice,
      currency: slot?.currency || "EUR",
      affiliateTrackingId: this.affiliateId || undefined,
    };
  }
}

export const golfNow = new GolfNowService();

