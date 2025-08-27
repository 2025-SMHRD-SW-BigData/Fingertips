
# Fingertips Backend API Documentation

This document outlines the backend API endpoints for the Fingertips project and provides guidance on how to integrate them with the frontend.

## Base URL

The backend server runs on `http://localhost:3000` by default. All API endpoints are prefixed with `/api`.

## Authentication

### 1. `POST /api/auth/register`

- **Description:** Registers a new admin user.
- **Request Body:**
  ```json
  {
    "admin_id": "string",
    "password": "string",
    "name": "string",
    "phone": "string" (optional),
    "email": "string"
  }
  ```
- **Response:**
  - `201 Created`: { "message": "등록이 완료되었습니다." }
  - `400 Bad Request`: { "message": "필수 정보(id, password, name, email)가 필요합니다." }
  - `409 Conflict`: { "message": "이미 존재하는 사용자 ID입니다." }
  - `500 Internal Server Error`: { "message": "서버 오류가 발생했습니다." }

### 2. `POST /api/auth/login`

- **Description:** Logs in an admin user.
- **Request Body:**
  ```json
  {
    "admin_id": "string",
    "password": "string"
  }
  ```
- **Response:**
  - `200 OK`: { "message": "로그인 성공", "adminName": "string", "admin_id": "string", "role": "string" }
  - `400 Bad Request`: { "message": "admin_id, password 필요" }
  - `401 Unauthorized`: { "message": "자격 증명 오류" }
  - `500 Internal Server Error`: { "message": "서버 오류" }

### 3. `GET /api/auth/me`

- **Description:** Retrieves the current user's information.
- **Query Parameters:**
  - `admin_id`: The ID of the admin user.
- **Response:**
  - `200 OK`: { "admin_id": "string", "name": "string", "role": "string" }
  - `400 Bad Request`: { "message": "admin_id가 필요합니다." }
  - `404 Not Found`: { "message": "관리자를 찾을 수 없습니다." }
  - `500 Internal Server Error`: { "message": "서버 오류" }

## Dashboard

### 1. `GET /api/dashboard/summary`

- **Description:** Retrieves a summary of parking and violation data for the dashboard.
- **Response:**
  ```json
  {
    "disabledParking": { "current": number, "total": number },
    "generalParking": { "current": number, "total": number },
    "todayViolations": number
  }
  ```

### 2. `GET /api/dashboard/parking-status`

- **Description:** Retrieves the current status of all parking spaces.
- **Response:**
  ```json
  [
    {
      "space_id": "string",
      "space_type": "string",
      "is_occupied": boolean,
      "ve_number": "string"
    }
  ]
  ```

### 3. `GET /api/dashboard/recent-violations`

- **Description:** Retrieves the 5 most recent violations.
- **Response:**
  ```json
  [
    {
      "violation_idx": number,
      "ve_number": "string",
      "parking_loc": "string",
      "violation_type": "string",
      "violation_date": "string" (ISO 8601),
      "admin_status": "string"
    }
  ]
  ```

### 4. `GET /api/dashboard/parking-logs`

- **Description:** Retrieves the 5 most recent parking logs.
- **Response:**
  ```json
  [
    {
      "log_idx": number,
      "ve_number": "string",
      "space_id": "string",
      "entry_at": "string" (ISO 8601),
      "exit_at": "string" (ISO 8601)
    }
  ]
  ```

## Violations

### 1. `GET /api/violations`

- **Description:** Retrieves a paginated list of violations, with optional search and date filtering.
- **Query Parameters:**
  - `page`: The page number (default: 1).
  - `limit`: The number of items per page (default: 10).
  - `search`: A search term to filter by vehicle number or parking location.
  - `date`: A date in `YYYY-MM-DD` format to filter by.
- **Response:**
  ```json
  {
    "data": [
      {
        "violation_idx": number,
        "violation_type": "string",
        "violation_date": "string" (ISO 8601),
        "ve_number": "string",
        "parking_loc": "string",
        "camera_loc": "string"
      }
    ],
    "pagination": {
      "totalItems": number,
      "totalPages": number,
      "currentPage": number
    }
  }
  ```

### 2. `GET /api/violations/:id`

- **Description:** Retrieves a single violation by its ID.
- **Response:**
  ```json
  {
    "violation_idx": number,
    "violation_type": "string",
    "violation_date": "string" (ISO 8601),
    "ve_number": "string",
    "parking_loc": "string",
    "camera_loc": "string",
    "video_url": "string"
  }
  ```

## Alerts

### 1. `GET /api/alerts`

- **Description:** Retrieves a list of alerts for a given admin user.
- **Query Parameters:**
  - `admin_id`: The ID of the admin user.
  - `status`: `unread` or `all` (default: `all`).
- **Response:**
  ```json
  [
    {
      "alert_idx": number,
      "violation_idx": number,
      "alert_type": "string",
      "alert_msg": "string",
      "sent_at": "string" (ISO 8601),
      "is_success": boolean,
      "admin_id": "string",
      "read_at": "string" (ISO 8601) or null,
      "admin_status": "string",
      "admin_content": "string",
      "processed_at": "string" (ISO 8601) or null
    }
  ]
  ```

### 2. `PATCH /api/alerts/:id`

- **Description:** Updates an alert.
- **Request Body:**
  ```json
  {
    "read": boolean (optional),
    "admin_status": "string" (optional),
    "admin_content": "string" (optional)
  }
  ```
- **Response:**
  - `200 OK`: { "message": "알림이 업데이트되었습니다." }
  - `400 Bad Request`: { "message": "업데이트할 항목이 없습니다." } or { "message": "잘못된 ID" }

## Statistics

### 1. `GET /api/stats/by-type`

- **Description:** Retrieves violation statistics grouped by type.
- **Response:**
  ```json
  [
    {
      "violation_type": "string",
      "count": number
    }
  ]
  ```

### 2. `GET /api/stats/by-date`

- **Description:** Retrieves violation statistics grouped by date.
- **Response:**
  ```json
  [
    {
      "date": "string" (YYYY-MM-DD),
      "count": number
    }
  ]
  ```

### 3. `GET /api/stats/by-location`

- **Description:** Retrieves violation statistics grouped by location.
- **Response:**
  ```json
  [
    {
      "parking_loc": "string",
      "count": number
    }
  ]
  ```

## Health Check

### 1. `GET /health/db`

- **Description:** Checks the database connection status.
- **Response:**
  - `200 OK`: { "ok": true, "latencyMs": number, "now": "string" (ISO 8601) }
  - `500 Internal Server Error`: { "ok": false, "message": "string" }
