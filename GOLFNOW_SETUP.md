# GolfNow API Integration Setup

This application is integrated with GolfNow's Affiliate & Partner API to enable real-time golf course bookings through the AI chatbot.

## Features

- ✅ Full API integration for course search and booking
- ✅ Affiliate commission tracking
- ✅ Real-time tee time availability
- ✅ Direct booking through AI chatbot conversation

## Getting Started

### 1. Register for GolfNow API Access

Visit the GolfNow developer/affiliate portal:
- **Developer Portal**: https://developer.golfnow.com/
- **Affiliate Portal**: https://affiliate.gnsvc.com/

### 2. Get Your API Credentials

After registration, you'll receive:
- **API Key**: For authenticating API requests
- **Affiliate ID**: For tracking commissions on bookings

### 3. Set Environment Variables

Add these to your environment (`.env` file or environment configuration):

```bash
# GolfNow API Configuration
GOLFNOW_API_KEY=your_api_key_here
GOLFNOW_AFFILIATE_ID=your_affiliate_id_here
GOLFNOW_BASE_URL=https://api.golfnow.com/v1  # Default, may vary
```

### 4. Integration Details

The service automatically:
- Uses real GolfNow API when credentials are provided
- Falls back to mock data for development/testing
- Includes affiliate tracking in all bookings for commission tracking

## API Endpoints Used

Based on GolfNow's standard API structure:

1. **Search Courses**: `GET /facilities`
   - Search by location, date, players
   - Returns available courses

2. **Get Tee Times**: `GET /tee-times`
   - Get available tee times for a course and date
   - Returns time slots with pricing

3. **Book Tee Time**: `POST /bookings`
   - Complete booking with customer details
   - Returns confirmation number

## Affiliate Commissions

- All bookings include your affiliate ID for commission tracking
- Commissions are tracked automatically through the API
- Check GolfNow's affiliate dashboard for earnings

## Fallback Mode

If API credentials are not configured, the system uses mock data:
- 5 sample courses in Costa del Sol region
- Mock tee times and pricing
- Simulated booking confirmations

This allows development and testing without API access.

## Support

For API documentation and support:
- GolfNow Developer Documentation: https://developer.golfnow.com/
- GolfNow Affiliate Support: https://affiliate.gnsvc.com/

For application support, contact: playgolfnowspain@gmail.com

