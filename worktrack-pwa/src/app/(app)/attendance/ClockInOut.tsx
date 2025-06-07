// src/app/(app)/attendance/ClockInOut.tsx
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React, { useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord } from './types'; // Import type

interface ClockInOutProps {
  initialTodaysAttendance: AttendanceRecord | null;
}

export function ClockInOut({ initialTodaysAttendance }: ClockInOutProps) {
  const supabase = createSupabaseBrowserClient();
  const [todaysAttendance, setTodaysAttendance] = useState<AttendanceRecord | null>(initialTodaysAttendance);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userTime, setUserTime] = useState(new Date());

  // Real-time clock effect
  useEffect(() => {
    const timer = setInterval(() => setUserTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state with prop if it changes (e.g., after server action revalidation elsewhere)
  useEffect(() => {
    setTodaysAttendance(initialTodaysAttendance);
  }, [initialTodaysAttendance]);

  const getCurrentLocation = useCallback((): Promise<{ latitude: number; longitude: number } | null> => {
    setLocationError(null); // Clear previous location error
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser.');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (geoError) => {
          // Improved error messages for common geolocation issues
          let message = `Geolocation error: ${geoError.message}`;
          if (geoError.code === geoError.PERMISSION_DENIED) {
            message = "Geolocation permission denied. Please enable location services for this site.";
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            message = "Location information is unavailable. Please check your device's location settings.";
          } else if (geoError.code === geoError.TIMEOUT) {
            message = "Geolocation request timed out. Please try again.";
          }
          setLocationError(message);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true } // Options: 10s timeout, try high accuracy
      );
    });
  }, []); // useCallback as it doesn't depend on other state variables directly

  const handleClockIn = async () => {
    setIsLoading(true);
    setError(null);
    const location = await getCurrentLocation(); // Await location first

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('User not authenticated. Please login again.');
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const newAttendance: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at' | 'clock_out_time' | 'clock_out_latitude' | 'clock_out_longitude' | 'notes'> = {
      user_id: user.id,
      clock_in_time: now.toISOString(),
      date: now.toISOString().split('T')[0],
      clock_in_latitude: location?.latitude || null,
      clock_in_longitude: location?.longitude || null,
    };

    const { data: insertedRecord, error: insertError } = await supabase
      .from('attendance')
      .insert(newAttendance)
      .select()
      .single();

    if (insertError) {
      setError(`Clock-in failed: ${insertError.message}`);
    } else if (insertedRecord) {
      setTodaysAttendance(insertedRecord as AttendanceRecord);
      setError(null); // Clear any previous error
    }
    setIsLoading(false);
  };

  const handleClockOut = async () => {
    if (!todaysAttendance || !todaysAttendance.id) {
      setError('No active clock-in found to clock out from.');
      return;
    }
    setIsLoading(true);
    setError(null);
    const location = await getCurrentLocation(); // Await location first

    const updates: Partial<AttendanceRecord> = {
      clock_out_time: new Date().toISOString(),
      clock_out_latitude: location?.latitude || null,
      clock_out_longitude: location?.longitude || null,
      // notes: 'Optional notes for clock out' // Add a textarea if notes are needed
    };

    const { data: updatedRecord, error: updateError } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', todaysAttendance.id)
      .select()
      .single();

    if (updateError) {
      setError(`Clock-out failed: ${updateError.message}`);
    } else if (updatedRecord) {
      setTodaysAttendance(updatedRecord as AttendanceRecord);
      setError(null); // Clear any previous error
    }
    setIsLoading(false);
  };

  const isClockedIn = todaysAttendance && !todaysAttendance.clock_out_time;
  const hasClockedOutToday = todaysAttendance && !!todaysAttendance.clock_out_time;

  return (
    <div className="p-4 sm:p-6 border rounded-xl shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-2 text-center text-gray-700">
        {userTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </h2>
      <p className="text-sm text-gray-500 text-center mb-4">
        {userTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {error && <p className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-md mb-4">{error}</p>}
      {locationError && <p className="bg-yellow-100 border border-yellow-300 text-yellow-700 text-sm p-3 rounded-md mb-4">{locationError}</p>}

      <div className="flex flex-col space-y-4">
        {!isClockedIn ? ( // This covers both "not clocked in at all" and "already clocked out"
          <button
            onClick={handleClockIn}
            disabled={isLoading || isClockedIn} // Disable if already clocked in (shouldn't happen if logic is right)
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Clock In'}
          </button>
        ) : (
          <button
            onClick={handleClockOut}
            disabled={isLoading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 disabled:opacity-60"
          >
            {isLoading ? 'Processing...' : 'Clock Out'}
          </button>
        )}
      </div>

      {todaysAttendance && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-700 space-y-1">
          <h3 className="font-semibold text-md mb-2 text-gray-800">Today's Status:</h3>
          <p>
            <strong>Clocked In:</strong>{' '}
            {new Date(todaysAttendance.clock_in_time).toLocaleTimeString()}
            {todaysAttendance.clock_in_latitude && todaysAttendance.clock_in_longitude &&
             ` (Location captured)`}
             {/* Removed precise lat/lon for privacy in UI, can be added if needed */}
          </p>
          {todaysAttendance.clock_out_time ? (
            <p>
              <strong>Clocked Out:</strong>{' '}
              {new Date(todaysAttendance.clock_out_time).toLocaleTimeString()}
              {todaysAttendance.clock_out_latitude && todaysAttendance.clock_out_longitude &&
               ` (Location captured)`}
            </p>
          ) : (
            <p className="text-blue-600 font-medium">Status: Currently clocked in.</p>
          )}
        </div>
      )}
      {!todaysAttendance && !isLoading && ( // Show if no attendance and not currently loading
         <p className="mt-6 text-sm text-center text-gray-500">You have not clocked in today.</p>
      )}
    </div>
  );
}
