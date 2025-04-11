// src/components/tabs/DrawTab.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAgentLotteries } from '../../services/lotteryService';
import { getLotteryTickets } from '../../services/ticketService';
import { formatDateTime, formatTimeRemaining } from '../../utils/dateFormatter';
import { formatCurrency } from '../../utils/currencyFormatter';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';
import DrawLottery from '../lottery/DrawLottery';

const DrawTab = () => {
  const { currentUser } = useAuth();
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLottery, setSelectedLottery] = useState(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [ticketCounts, setTicketCounts] = useState({});

  const fetchLotteries = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Only get active lotteries that can be drawn
      const lotteriesData = await getAgentLotteries(currentUser.uid, 'active');
      
      // Filter out any lotteries that might be in drawing state already
      // This is to prevent multiple drawing attempts on the same lottery
      const drawableLotteries = lotteriesData.filter(lottery => lottery.status !== 'drawing');
      
      setLotteries(drawableLotteries);
      
      // Get ticket counts for each lottery
      const countsPromises = drawableLotteries.map(async lottery => {
        const tickets = await getLotteryTickets(lottery.id);
        const bookedTickets = tickets.filter(ticket => ticket.booked);
        return { lotteryId: lottery.id, count: bookedTickets.length };
      });
      
      const counts = await Promise.all(countsPromises);
      const countsMap = {};
      counts.forEach(item => {
        countsMap[item.lotteryId] = item.count;
      });
      
      setTicketCounts(countsMap);
    } catch (err) {
      console.error('Error fetching lotteries:', err);
      setError('Failed to load lotteries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotteries();
  }, [currentUser]);

  const handleDrawClick = (lottery) => {
    setSelectedLottery(lottery);
    setShowDrawModal(true);
  };

  const handleDrawComplete = () => {
    setShowDrawModal(false);
    fetchLotteries();
  };

  if (loading) {
    return <Loading message="Loading lotteries..." />;
  }

  if (error) {
    return (
      <Card className="error-card">
        <div className="error-message">{error}</div>
        <Button onClick={fetchLotteries}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="draw-tab">
      <h1>Draw Lotteries</h1>
      
      {lotteries.length === 0 ? (
        <Card className="empty-state">
          <h3>No Active Lotteries</h3>
          <p>You don't have any active lotteries to draw at this time. Create a lottery first.</p>
        </Card>
      ) : (
        <div className="draw-lotteries-grid">
          {lotteries.map(lottery => (
            <Card key={lottery.id} className="draw-lottery-card">
              <div className="draw-lottery-header">
                <h3>{lottery.name || `Lottery #${lottery.id}`}</h3>
                <span className="status-badge active">Active</span>
              </div>
              
              <div className="draw-lottery-details">
                <div className="detail-row">
                  <span className="detail-label">Prize Pool:</span>
                  <span className="detail-value">{formatCurrency(lottery.prizePool)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Tickets Booked:</span>
                  <span className="detail-value">
                    {ticketCounts[lottery.id] || 0} / {lottery.ticketCapacity}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Draw Time:</span>
                  <span className="detail-value">{formatDateTime(lottery.drawTime)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Remaining:</span>
                  <span className="detail-value">{formatTimeRemaining(lottery.drawTime)}</span>
                </div>
              </div>
              
              <div className="draw-lottery-actions">
                <Button 
                  onClick={() => handleDrawClick(lottery)}
                  variant="primary"
                  disabled={ticketCounts[lottery.id] === 0}
                >
                  Draw Winner
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {showDrawModal && selectedLottery && (
        <DrawLottery 
          lottery={selectedLottery} 
          onClose={() => setShowDrawModal(false)}
          onDrawComplete={handleDrawComplete}
        />
      )}
    </div>
  );
};

export default DrawTab;
