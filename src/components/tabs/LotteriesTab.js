// src/components/tabs/LotteriesTab.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getAgentLotteries, 
  cancelLottery, 
  deleteLottery
} from '../../services/lotteryService';
import { getLotteryTickets } from '../../services/ticketService';
import LotteryCard from '../lottery/LotteryCard';
import CreateLotteryForm from '../lottery/CreateLotteryForm';
import EditLotteryForm from '../lottery/EditLotteryForm';
import DrawLottery from '../lottery/DrawLottery';
import Button from '../common/Button';
import Loading from '../common/Loading';
import Card from '../common/Card';
import ConfirmDialog from '../common/ConfirmDialog';

const LotteriesTab = () => {
  const { currentUser } = useAuth();
  const [activeLotteries, setActiveLotteries] = useState([]);
  const [completedLotteries, setCompletedLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedLottery, setSelectedLottery] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [_showTicketsForLottery, setShowTicketsForLottery] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [expandedLottery, setExpandedLottery] = useState(null);

  const fetchLotteries = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const allLotteries = await getAgentLotteries(currentUser.uid);
      
      // Separate active, drawing, and completed lotteries
      const active = allLotteries.filter(lottery => 
        lottery.status === 'active' || lottery.status === 'upcoming'
      );
      
      const drawing = allLotteries.filter(lottery => 
        lottery.status === 'drawing'
      );
      
      const completed = allLotteries.filter(lottery => 
        lottery.status === 'completed' || lottery.status === 'cancelled' || lottery.status === 'deleted'
      );
      
      // Include drawing lotteries in the active section
      setActiveLotteries([...active, ...drawing]);
      setCompletedLotteries(completed);
    } catch (error) {
      console.error('Error fetching lotteries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotteries();
  }, [currentUser]);

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    setShowEditForm(false);
    setSelectedLottery(null);
    setExpandedLottery(null);
  };

  const handleLotteryCreated = () => {
    fetchLotteries();
    setShowCreateForm(false);
  };
  
  const handleLotteryClick = (lottery) => {
    // If it's a completed lottery, show details
    if (lottery.status === 'completed' || lottery.status === 'cancelled' || lottery.status === 'deleted') {
      if (expandedLottery === lottery.id) {
        setExpandedLottery(null);
      } else {
        setExpandedLottery(lottery.id);
        // If it's a deleted lottery, load tickets
        if (lottery.status === 'deleted') {
          handleShowTickets(lottery);
        }
      }
    } else {
      // If it's an active or drawing lottery, select it for actions
      setSelectedLottery(lottery);
      setExpandedLottery(null);
    }
  };
  
  const handleEditLottery = (lottery) => {
    // Only allow editing active lotteries
    if (lottery.status !== 'active') {
      return;
    }
    
    setSelectedLottery(lottery);
    setShowEditForm(true);
    setShowCreateForm(false);
    setExpandedLottery(null);
  };
  
  const handleLotteryUpdated = () => {
    fetchLotteries();
    setShowEditForm(false);
    setSelectedLottery(null);
  };
  
  const cancelEdit = () => {
    setShowEditForm(false);
    setSelectedLottery(null);
  };

  const handleDrawLottery = (lottery) => {
    // Only allow drawing active lotteries
    if (lottery.status !== 'active') {
      return;
    }
    
    setSelectedLottery(lottery);
    setShowDrawModal(true);
  };

  const handleDrawComplete = () => {
    setShowDrawModal(false);
    fetchLotteries();
  };
  
  const handleCancelLottery = (lottery) => {
    // Allow canceling both active and drawing lotteries
    if (lottery.status !== 'active' && lottery.status !== 'drawing') {
      return;
    }
    
    setSelectedLottery(lottery);
    setShowCancelModal(true);
    setCancelError(null);
    setCancelSuccess(false);
  };
  
  const confirmCancelLottery = async () => {
    if (!selectedLottery || !currentUser) return;
    
    try {
      await cancelLottery(selectedLottery.id, currentUser.uid);
      setCancelSuccess(true);
      setTimeout(() => {
        setShowCancelModal(false);
        fetchLotteries();
      }, 2000);
    } catch (error) {
      console.error('Error cancelling lottery:', error);
      setCancelError(error.message);
    }
  };
  
  const handleDeleteLottery = (lottery) => {
    // Only allow deleting active lotteries with no booked tickets
    if (lottery.status !== 'active' || lottery.ticketsBooked > 0) {
      return;
    }
    
    setSelectedLottery(lottery);
    setShowDeleteModal(true);
    setDeleteError(null);
    setDeleteSuccess(false);
  };
  
  const confirmDeleteLottery = async () => {
    if (!selectedLottery || !currentUser) return;
    
    try {
      // Actually delete the lottery
      await deleteLottery(selectedLottery.id, currentUser.uid);
      
      setDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteModal(false);
        fetchLotteries();
      }, 2000);
    } catch (error) {
      console.error('Error deleting lottery:', error);
      setDeleteError(error.message);
    }
  };
  
  const handleShowTickets = async (lottery) => {
    setLoadingTickets(true);
    setShowTicketsForLottery(lottery.id);
    
    try {
      const tickets = await getLotteryTickets(lottery.id);
      setSelectedTickets(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };
  
  const toggleCompletedSection = () => {
    setShowCompletedSection(!showCompletedSection);
    // Reset any expanded lottery when toggling section
    setExpandedLottery(null);
    setShowTicketsForLottery(null);
  };

  if (loading) {
    return <Loading message="Loading lotteries..." />;
  }

  return (
    <div className="lotteries-tab">
      {/* Header */}
      <Card className="tab-header">
        <h1>Lotteries</h1>
        <div className="header-actions">
          {showEditForm ? (
            <Button onClick={cancelEdit} variant="outline">
              Cancel Edit
            </Button>
          ) : (
            <Button onClick={toggleCreateForm} variant="primary">
              {showCreateForm ? 'Cancel' : 'Create Lottery'}
            </Button>
          )}
        </div>
      </Card>

      {/* Create Form */}
      {showCreateForm && !showEditForm && (
        <Card className="create-lottery-form-container">
          <CreateLotteryForm onSuccess={handleLotteryCreated} />
        </Card>
      )}
      
      {/* Edit Form */}
      {showEditForm && selectedLottery && (
        <Card className="edit-lottery-form-container">
          <EditLotteryForm 
            lotteryId={selectedLottery.id} 
            onSuccess={handleLotteryUpdated} 
            onCancel={cancelEdit} 
          />
        </Card>
      )}

      {/* Active Lotteries Section */}
      {!showCreateForm && !showEditForm && (
        <div className="lotteries-section">
          <div className="section-header">
            <h2>Active Lotteries</h2>
            <div className="section-actions">
              {selectedLottery && (
                <div className="lottery-action-buttons">
                  {selectedLottery.status === 'active' && (
                    <>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDrawLottery(selectedLottery);
                        }} 
                        variant="primary"
                      >
                        Draw Lottery
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLottery(selectedLottery);
                        }} 
                        variant="primary"
                      >
                        Edit Lottery
                      </Button>
                    </>
                  )}
                  
                  {(selectedLottery.status === 'active' || selectedLottery.status === 'drawing') && (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelLottery(selectedLottery);
                      }} 
                      variant="danger"
                    >
                      Cancel Lottery
                    </Button>
                  )}
                  
                  {selectedLottery.status === 'active' && selectedLottery.ticketsBooked === 0 && (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLottery(selectedLottery);
                      }} 
                      variant="danger"
                    >
                      Delete Lottery
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {activeLotteries.length > 0 ? (
            <div className="lotteries-grid">
              {activeLotteries.map(lottery => (
                <div 
                  key={lottery.id} 
                  className={`lottery-container ${selectedLottery?.id === lottery.id ? 'selected' : ''}`}
                  onClick={() => handleLotteryClick(lottery)}
                >
                  <LotteryCard 
                    lottery={lottery} 
                    isSelected={selectedLottery?.id === lottery.id}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="empty-state">
              <p>No active lotteries found. Create your first lottery to get started.</p>
              {!showCreateForm && (
                <Button onClick={toggleCreateForm} variant="primary">Create Lottery</Button>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Completed Lotteries Section */}
      {!showCreateForm && !showEditForm && (
        <div className="lotteries-section completed-section">
          <div 
            className="section-header collapsible" 
            onClick={toggleCompletedSection}
          >
            <h2>Completed & Deleted Lotteries</h2>
            <div className="collapse-icon">
              {showCompletedSection ? '▲' : '▼'}
            </div>
          </div>
          
          {showCompletedSection && (
            completedLotteries.length > 0 ? (
              <div className="completed-lotteries-container">
                <div className="lotteries-grid">
                  {completedLotteries.map(lottery => (
                    <div key={lottery.id} className="completed-lottery-wrapper">
                      <div 
                        className={`lottery-container ${expandedLottery === lottery.id ? 'expanded' : ''}`}
                        onClick={() => handleLotteryClick(lottery)}
                      >
                        <LotteryCard 
                          lottery={lottery}
                          isExpanded={expandedLottery === lottery.id}
                        />
                      </div>
                      
                      {/* Expanded lottery details */}
                      {expandedLottery === lottery.id && (
                        <div className="lottery-expanded-details">
                          {lottery.status === 'completed' && (
                            <div className="winner-details">
                              <h3>Winner Information</h3>
                              {lottery.winners && lottery.winners.length > 0 ? (
                                // Multiple winners (new format)
                                lottery.winners.map((winner, index) => (
                                  <div key={index} className="winner-item">
                                    <div className="detail-item">
                                      <span className="detail-label">Prize:</span>
                                      <span className="detail-value">{winner.prizeName}</span>
                                    </div>
                                    <div className="detail-item">
                                      <span className="detail-label">Winner Name:</span>
                                      <span className="detail-value">{winner.playerName}</span>
                                    </div>
                                    <div className="detail-item">
                                      <span className="detail-label">Phone Number:</span>
                                      <span className="detail-value">{winner.phoneNumber}</span>
                                    </div>
                                    {winner.gameId && (
                                      <div className="detail-item">
                                        <span className="detail-label">Game ID:</span>
                                        <span className="detail-value">{winner.gameId}</span>
                                      </div>
                                    )}
                                    <div className="detail-item">
                                      <span className="detail-label">Ticket ID:</span>
                                      <span className="detail-value">{winner.id}</span>
                                    </div>
                                    <div className="detail-item">
                                      <span className="detail-label">Ticket Number:</span>
                                      <span className="detail-value">#{winner.number}</span>
                                    </div>
                                  </div>
                                ))
                              ) : lottery.winner ? (
                                // Single winner (old format for backward compatibility)
                                <>
                                  <div className="detail-item">
                                    <span className="detail-label">Winner Name:</span>
                                    <span className="detail-value">{lottery.winner.playerName}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Phone Number:</span>
                                    <span className="detail-value">{lottery.winner.phoneNumber}</span>
                                  </div>
                                  {lottery.winner.gameId && (
                                    <div className="detail-item">
                                      <span className="detail-label">Game ID:</span>
                                      <span className="detail-value">{lottery.winner.gameId}</span>
                                    </div>
                                  )}
                                  <div className="detail-item">
                                    <span className="detail-label">Draw Date:</span>
                                    <span className="detail-value">
                                      {new Date(lottery.completedAt).toLocaleString()}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <p>No winner information available</p>
                              )}
                            </div>
                          )}
                          
                          {lottery.status === 'deleted' && (
                            <div className="deleted-lottery-details">
                              <h3>Deleted Lottery Tickets</h3>
                              {loadingTickets ? (
                                <Loading message="Loading tickets..." />
                              ) : selectedTickets.length > 0 ? (
                                <div className="tickets-list">
                                  <table className="tickets-table">
                                    <thead>
                                      <tr>
                                        <th>Ticket #</th>
                                        <th>Player Name</th>
                                        <th>Phone</th>
                                        {selectedTickets.some(t => t.gameId) && <th>Game ID</th>}
                                        <th>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedTickets.map(ticket => (
                                        <tr key={ticket.id}>
                                          <td>{ticket.number}</td>
                                          <td>{ticket.playerName}</td>
                                          <td>{ticket.phoneNumber}</td>
                                          {selectedTickets.some(t => t.gameId) && (
                                            <td>{ticket.gameId || '-'}</td>
                                          )}
                                          <td>
                                            <span className={`status-badge ${ticket.status}`}>
                                              {ticket.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p>No tickets found for this lottery.</p>
                              )}
                              <div className="deletion-info">
                                <div className="detail-item">
                                  <span className="detail-label">Deleted On:</span>
                                  <span className="detail-value">
                                    {new Date(lottery.deletedAt).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {lottery.status === 'cancelled' && (
                            <div className="cancelled-lottery-details">
                              <h3>Cancelled Lottery Information</h3>
                              <div className="detail-item">
                                <span className="detail-label">Cancelled On:</span>
                                <span className="detail-value">
                                  {new Date(lottery.cancelledAt).toLocaleString()}
                                </span>
                              </div>
                              <p>This lottery was cancelled and all ticket bookings were refunded.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="empty-state">
                <p>No completed or deleted lotteries found.</p>
              </Card>
            )
          )}
        </div>
      )}
      
      {/* Modals */}
      {showDrawModal && selectedLottery && (
        <DrawLottery 
          lottery={selectedLottery} 
          onClose={() => setShowDrawModal(false)}
          onDrawComplete={handleDrawComplete}
        />
      )}
      
      {showCancelModal && selectedLottery && (
        <ConfirmDialog
          title="Cancel Lottery"
          message={
            cancelSuccess 
              ? "Lottery cancelled successfully!" 
              : `Are you sure you want to cancel "${selectedLottery.name || `Lottery #${selectedLottery.id}`}"? This will cancel all booked tickets and refund the prize pool to your balance.`
          }
          confirmText="Cancel Lottery"
          cancelText="Keep Lottery"
          onConfirm={confirmCancelLottery}
          onCancel={() => setShowCancelModal(false)}
          error={cancelError}
          success={cancelSuccess}
          isConfirmDestructive={true}
        />
      )}
      
      {showDeleteModal && selectedLottery && (
        <ConfirmDialog
          title="Delete Lottery"
          message={
            deleteSuccess 
              ? "Lottery deleted successfully!" 
              : `Are you sure you want to delete "${selectedLottery.name || `Lottery #${selectedLottery.id}`}"?
                 ${selectedLottery.ticketsBooked > 0 ? 
                   `This lottery has ${selectedLottery.ticketsBooked} tickets booked. 
                    All tickets will be preserved for reference.` : 
                   ''}`
          }
          confirmText="Delete Lottery"
          cancelText="Keep Lottery"
          onConfirm={confirmDeleteLottery}
          onCancel={() => setShowDeleteModal(false)}
          error={deleteError}
          success={deleteSuccess}
          isConfirmDestructive={true}
        />
      )}
    </div>
  );
};

export default LotteriesTab;
