// src/components/dashboard/LotteryList.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getActiveLotteries } from '../../services/lotteryService';
import { useAuth } from '../../hooks/useAuth';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Loading from '../ui/Loading';
import ErrorMessage from '../ui/ErrorMessage';
import LotteryCard from '../lottery/LotteryCard';

const LotteryList = ({ limit = 5 }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLotteries = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const lotteriesData = await getActiveLotteries(limit);
        
        // Debug logging
        console.log("LotteryList - fetched lotteries:", lotteriesData);
        
        setLotteries(lotteriesData);
      } catch (err) {
        console.error('Error fetching lotteries:', err);
        setError('Failed to load lotteries. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLotteries();
  }, [limit]);
  
  // Handler functions
  const handleDrawLottery = (lottery) => {
    console.log("Draw lottery clicked:", lottery.id);
    navigate(`/lotteries/draw/${lottery.id}`);
  };
  
  const handleEditLottery = (lottery) => {
    console.log("Edit lottery clicked:", lottery.id);
    navigate(`/lotteries/edit/${lottery.id}`);
  };
  
  const handleCancelLottery = (lottery) => {
    console.log("Cancel lottery clicked:", lottery.id);
    navigate(`/lotteries/cancel/${lottery.id}`);
  };
  
  const handleDeleteLottery = (lottery) => {
    console.log("Delete lottery clicked:", lottery.id);
    navigate(`/lotteries/delete/${lottery.id}`);
  };

  if (loading) {
    return <Loading text="Loading lotteries..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (lotteries.length === 0) {
    return (
      <Card className="lottery-list-empty">
        <div className="empty-state">
          <p>No active lotteries available at this time.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="lottery-list">
      {/* Debug marker */}
      <div style={{background: '#f8d7da', padding: '5px', margin: '5px', borderRadius: '4px', fontSize: '12px'}}>
        LotteryList Component
      </div>
      
      {lotteries.map(lottery => (
        <LotteryCard 
          key={lottery.id} 
          lottery={lottery}
          onDraw={handleDrawLottery}
          onEdit={handleEditLottery}
          onCancel={handleCancelLottery}
          onDelete={handleDeleteLottery}
        />
      ))}
      
      <div className="view-all">
        <Link to="/lotteries" className="btn btn-outline">
          View All Lotteries
        </Link>
      </div>
    </div>
  );
};

export default LotteryList;