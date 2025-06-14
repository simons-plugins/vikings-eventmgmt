// src/types.d.ts

// Based on what api.js/getUserRoles returns and SectionsTable uses
export interface Section {
  sectionid: string;
  sectionname: string;
  groupname?: string; // Optional, from original data structure
  type?: string;      // Optional
  active?: boolean;   // Optional
  roleid?: string | number; // Optional
  orgid?: string | number;  // Optional
}

// Based on what api.js/getEvents returns and EventsTable uses
// (after enrichment in main.js with sectionname, sectionid, termid)
export interface Event {
  eventid: string;
  name: string;
  date: string;        // Consider if this should be Date object after parsing
  sectionid: string;
  sectionname: string;
  termid: string;
  yes?: number;         // Optional, often present
  no?: number;          // Optional
  yes_members?: number; // Optional
  yes_yls?: number;     // Optional
  yes_leaders?: number; // Optional
  // Add any other relevant event properties
}

// Based on what api.js/getEventAttendance returns and AttendanceDisplay uses
// (after enrichment in main.js with _eventName, _eventDate, sectionname)
export interface Attendee {
  firstname: string;
  lastname: string;
  memberid: string | number;
  attending: 'Yes' | 'No' | 'Invited' | string; // Or a more specific enum/union if known
  status?: string; // Often similar to attending
  age?: string;    // Optional
  patrol?: string; // Optional
  custom_data?: Record<string, any>; // If there's custom flexi data
  _eventName?: string;    // Added during processing
  _eventDate?: string;    // Added during processing
  sectionname?: string;   // Added during processing
  // Add any other relevant attendee properties
}

export interface Term {
 termid: string;
 name: string;
 startdate: string; // Consider Date
 enddate: string;   // Consider Date
}

// For the rate limit status object structure
export interface RateLimitDetail {
    limit: number | null;
    remaining: number;
    window?: string; // e.g., "per hour"
    available?: boolean;
    rateLimited?: boolean;
    retryAfter?: number;
}
export interface RateLimitStatus {
    osm: RateLimitDetail | null;
    backend: RateLimitDetail | null;
}
