// src/hooks/useLotteries.js
import { useState, useEffect } from 'react';
import { ref, get, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { database } from '../firebase/config';

// Hook to fetch active lotteries
export const useActiveLotteries = (limit = 50) => {
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLotteries = async () => {
      setLoading(true);
      try {
        // Query for active and upcoming lotteries
        const lotteriesRef = ref(database, 'lotteries');
        const activeQuery = query(
          lotteriesRef,
          orderByChild('status'),
          equalTo('active')
        );
        const upcomingQuery = query(
          lotteriesRef,
          orderByChild('status'),
          equalTo('upcoming')
        );
        
        // Fetch both active and upcoming lotteries
        const [activeSnapshot, upcomingSnapshot] = await Promise.all([
          get(activeQuery),
          get(upcomingQuery)
        ]);
        
        const activeLotteries = [];
        
        // Process active lotteries
        if (activeSnapshot.exists()) {
          const activeData = activeSnapshot.val();
          Object.keys(activeData).forEach(key => {
            activeLotteries.push({
              id: key,
              ...activeData[key]
            });
          });
        }
        
        // Process upcoming lotteries
        if (upcomingSnapshot.exists()) {
          const upcomingData = upcomingSnapshot.val();
          Object.keys(upcomingData).forEach(key => {
            activeLotteries.push({
              id: key,
              ...upcomingData[key]
            });
          });
        }
        
        // Sort by draw time (ascending)
        activeLotteries.sort((a, b) => {
          return new Date(a.drawTime) - new Date(b.drawTime);
        });
        
        // Limit the number of results
        setLotteries(activeLotteries.slice(0, limit));
      } catch (err) {
        console.error('Error fetching lotteries:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLotteries();
  }, [limit]);

  return { lotteries, loading, error };
};

// Hook to fetch a specific lottery by ID
export const useLottery = (lotteryId) => {
  const [lottery, setLottery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLottery = async () => {
      if (!lotteryId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const lotteryRef = ref(database, `lotteries/${lotteryId}`);
        const snapshot = await get(lotteryRef);

        if (snapshot.exists()) {
          setLottery({
            id: lotteryId,
            ...snapshot.val()
          });
        } else {
          setError('Lottery not found');
        }
      } catch (err) {
        console.error('Error fetching lottery:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLottery();
  }, [lotteryId]);

  return { lottery, loading, error };
};

// Hook to fetch lotteries by type
export const useLotteriesByType = (type, limit = 50) => {
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLotteries = async () => {
      if (!type) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const lotteriesRef = ref(database, 'lotteries');
        const typeQuery = query(
          lotteriesRef,
          orderByChild('type'),
          equalTo(type),
          limitToLast(limit)
        );
        
        const snapshot = await get(typeQuery);
        
        if (snapshot.exists()) {
          const lotteriesData = snapshot.val();
          const lotteriesArray = Object.keys(lotteriesData).map(key => ({
            id: key,
            ...lotteriesData[key]
          }));
          
          // Sort by draw time (ascending)
          lotteriesArray.sort((a, b) => {
            return new Date(a.drawTime) - new Date(b.drawTime);
          });
          
          setLotteries(lotteriesArray);
        } else {
          setLotteries([]);
        }
      } catch (err) {
        console.error('Error fetching lotteries by type:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLotteries();
  }, [type, limit]);

  return { lotteries, loading, error };
};