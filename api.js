const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('smart_rail_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('smart_rail_token', token);
    } else {
      localStorage.removeItem('smart_rail_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = this.getHeaders();
    
    const config = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.detail || data?.message || `HTTP Error ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth APIs
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Train & Station APIs
  async getStations() {
    return this.request('/trains/stations');
  }

  async searchTrains(sourceCode, destCode, journeyDate, travelClass = '', quota = 'General') {
    const params = new URLSearchParams({
      source_code: sourceCode,
      destination_code: destCode,
      journey_date: journeyDate,
      quota: quota,
    });
    if (travelClass) {
      params.append('travel_class', travelClass);
    }
    return this.request(`/trains/search?${params.toString()}`);
  }

  async getTrainDetails(trainId) {
    return this.request(`/trains/${trainId}`);
  }

  // Booking & Journey APIs
  async createBooking(bookingData) {
    return this.request('/bookings/create', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getMyJourneys(category = 'all') {
    return this.request(`/bookings/my-journeys?category=${category}`);
  }

  async getReservationByPnr(pnr) {
    return this.request(`/bookings/pnr/${pnr}`);
  }

  async getTicketByNumber(ticketNumber) {
    return this.request(`/bookings/ticket/${ticketNumber}`);
  }

  async cancelReservation(reservationId) {
    return this.request(`/bookings/cancel/${reservationId}`, {
      method: 'POST',
    });
  }

  // Verification & Scanner APIs
  async verifyQRScan(scanData) {
    return this.request('/verify/scan', {
      method: 'POST',
      body: JSON.stringify(scanData),
    });
  }

  async updateBoardingStatus(ticketId, boardingStatus, stationId = null, notes = '') {
    return this.request('/verify/update-boarding-status', {
      method: 'POST',
      body: JSON.stringify({
        ticket_id: ticketId,
        boarding_status: boardingStatus,
        station_id: stationId,
        notes: notes,
      }),
    });
  }

  // Staff APIs
  async getDutyManifest(trainId = null, journeyDate = null, coachFilter = null) {
    const params = new URLSearchParams();
    if (trainId) params.append('train_id', trainId);
    if (journeyDate) params.append('journey_date', journeyDate);
    if (coachFilter) params.append('coach_filter', coachFilter);
    return this.request(`/staff/duty-manifest?${params.toString()}`);
  }

  async getStaffScans(limit = 50) {
    return this.request(`/staff/my-scans?limit=${limit}`);
  }

  // Admin APIs
  async getAdminAnalytics() {
    return this.request('/admin/analytics');
  }

  async getAuditLogs(limit = 100, resultFilter = null) {
    const params = new URLSearchParams({ limit });
    if (resultFilter) params.append('result_filter', resultFilter);
    return this.request(`/admin/audit-logs?${params.toString()}`);
  }

  async getStaffList() {
    return this.request('/admin/staff-list');
  }

  async createStaff(staffData) {
    return this.request('/admin/create-staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async getAllTrainsAdmin() {
    return this.request('/admin/all-trains');
  }

  async toggleTrainStatus(trainId) {
    return this.request(`/admin/toggle-train/${trainId}`, {
      method: 'POST',
    });
  }

  // TTR / Staff Management
  async updateStaff(userId, staffData) {
    return this.request(`/admin/staff/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  }

  async toggleStaffStatus(userId) {
    return this.request(`/admin/staff/${userId}/toggle-status`, {
      method: 'POST',
    });
  }

  async deleteStaff(userId) {
    return this.request(`/admin/staff/${userId}`, {
      method: 'DELETE',
    });
  }

  // Passenger & User Management
  async getAdminPassengers(search = '', statusFilter = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter) params.append('status_filter', statusFilter);
    return this.request(`/admin/passengers?${params.toString()}`);
  }

  async getPassengerReservations(userId) {
    return this.request(`/admin/passengers/${userId}/reservations`);
  }

  async updateUser(userId, userData) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async toggleUserStatus(userId) {
    return this.request(`/admin/users/${userId}/toggle-status`, {
      method: 'POST',
    });
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Database Management & Inspector
  async getDatabaseOverview() {
    return this.request('/admin/database/overview');
  }

  async getDatabaseTable(tableName, limit = 50, offset = 0, search = '') {
    const params = new URLSearchParams({ limit, offset });
    if (search) params.append('search', search);
    return this.request(`/admin/database/table/${tableName}?${params.toString()}`);
  }

  async resetDatabaseSeed() {
    return this.request('/admin/database/reset-seed', {
      method: 'POST',
    });
  }

  async cleanupExpiredTokens() {
    return this.request('/admin/database/cleanup-expired', {
      method: 'POST',
    });
  }

  async exportDatabaseSnapshot() {
    return this.request('/admin/database/export');
  }

  // Global Reservations Management
  async getAllReservationsAdmin(search = '', statusFilter = '', trainId = null, limit = 50, offset = 0) {
    const params = new URLSearchParams({ limit, offset });
    if (search) params.append('search', search);
    if (statusFilter) params.append('status_filter', statusFilter);
    if (trainId) params.append('train_id', trainId);
    return this.request(`/admin/all-reservations?${params.toString()}`);
  }

  async adminCancelReservation(reservationId) {
    return this.request(`/admin/reservations/${reservationId}/cancel`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
