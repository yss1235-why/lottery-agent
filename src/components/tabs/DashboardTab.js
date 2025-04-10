// src/components/tabs/DashboardTab.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAgentBalance } from '../../services/balanceService';
import { getActiveLotteries, cancelLottery, deleteLottery } from '../../services/lotteryService';
import { getRecentTransactions } from '../../services/balanceService';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';
import LotteryCard from '../lottery/LotteryCard';
import WhatsAppSetting from '../dashboard/WhatsAppSetting';
import PasswordUpdate from '../dashboard/PasswordUpdate';
import DrawLottery from '../lottery/DrawLottery';
import ConfirmDialog from '../common/ConfirmDialog';
import DepositModal from '../deposit/DepositModal';
import { formatCurrency } from '../../utils/currencyFormatter';

const DashboardTab = () => {
  const { currentUser, agentData, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [lotteries, setLotteries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State variables for section collapse/expand
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showActiveLotteries, setShowActiveLotteries] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  
  // State variables for handling actions
  const [selectedLottery, setSelectedLottery] = useState(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Fetch balance, active lotteries, and recent transactions
        const [balanceData, lotteriesData, transactionsData] = await Promise.all([
          getAgentBalance(currentUser.uid),
          getActiveLotteries(3), // Get top 3 active lotteries
          getRecentTransactions(currentUser.uid, 5) // Get last 5 transactions
        ]);
        
        setBalance(balanceData);
        setLotteries(lotteriesData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);

  // Handler for drawing a lottery
  const handleDrawLottery = (lottery) => {
    setSelectedLottery(lottery);
    setShowDrawModal(true);
  };
  
  // Handler for editing a lottery
  const handleEditLottery = (lottery) => {
    navigate(`/lotteries/edit/${lottery.id}`);
  };
  
  // Handler for cancelling a lottery
  const handleCancelLottery = (lottery) => {
    setSelectedLottery(lottery);
    setShowCancelModal(true);
    setCancelError(null);
    setCancelSuccess(false);
  };
  
  // Handler for deleting a lottery
  const handleDeleteLottery = (lottery) => {
    setSelectedLottery(lottery);
    setShowDeleteModal(true);
    setDeleteError(null);
    setDeleteSuccess(false);
  };
  
  // Handler for opening the deposit modal
  const handleOpenDepositModal = () => {
    setShowDepositModal(true);
  };
  
  // Handler for closing the deposit modal
  const handleCloseDepositModal = () => {
    setShowDepositModal(false);
    // Refresh balance after closing modal
    getAgentBalance(currentUser.uid).then(data => {
      setBalance(data);
    });
  };
  
  // Handler for draw completion
  const handleDrawComplete = () => {
    setShowDrawModal(false);
    // Refresh lotteries after draw
    getActiveLotteries(3).then(lotteriesData => {
      setLotteries(lotteriesData);
    });
  };
  
  // Handler for confirming lottery cancellation
  const confirmCancelLottery = async () => {
    if (!selectedLottery || !currentUser) return;
    
    try {
      await cancelLottery(selectedLottery.id, currentUser.uid);
      setCancelSuccess(true);
      setTimeout(() => {
        setShowCancelModal(false);
        // Refresh lotteries after cancellation
        getActiveLotteries(3).then(lotteriesData => {
          setLotteries(lotteriesData);
        });
      }, 2000);
    } catch (error) {
      console.error('Error cancelling lottery:', error);
      setCancelError(error.message);
    }
  };
  
  // Handler for confirming lottery deletion
  const confirmDeleteLottery = async () => {
    if (!selectedLottery || !currentUser) return;
    
    try {
      await deleteLottery(selectedLottery.id, currentUser.uid);
      setDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteModal(false);
        // Refresh lotteries after deletion
        getActiveLotteries(3).then(lotteriesData => {
          setLotteries(lotteriesData);
        });
      }, 2000);
    } catch (error) {
      console.error('Error deleting lottery:', error);
      setDeleteError(error.message);
    }
  };
  
  // Handler for logging out
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Toggle section visibility
  const toggleSection = (section) => {
    switch(section) {
      case 'accountSettings':
        setShowAccountSettings(!showAccountSettings);
        break;
      case 'activeLotteries':
        setShowActiveLotteries(!showActiveLotteries);
        break;
      case 'transactions':
        setShowTransactions(!showTransactions);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  // Get display name or email for the user
  const displayName = agentData?.name || currentUser?.displayName || currentUser?.email || 'Agent';

  return (
    <div className="dashboard-tab">
      {/* User info and logout section */}
      <div className="user-header">
        <div className="user-info">
          <div className="user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{displayName}</div>
            <div className="user-role">Agent Account</div>
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline" className="logout-button">
          Logout
        </Button>
      </div>
      
      <h1>Dashboard</h1>
      
      {/* Balance and Stats section - always expanded */}
      <div className="dashboard-grid">
        <Card className="balance-card">
          <h2>Balance</h2>
          <div className="balance-amount">{formatCurrency(balance?.amount || 0)}</div>
          <div className="balance-actions">
            <Button 
              onClick={handleOpenDepositModal} 
              variant="primary"
            >
              Deposit Balance
            </Button>
          </div>
        </Card>

        <Card className="stats-card">
          <h2>Stats</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Active Lotteries</span>
              <span className="stat-value">{lotteries.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Tickets Sold</span>
              <span className="stat-value">{lotteries.reduce((total, lottery) => total + lottery.ticketsBooked, 0)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Account Settings section - collapsible */}
      <div className="dashboard-section">
        <div 
          className="section-header collapsible" 
          onClick={() => toggleSection('accountSettings')}
        >
          <h2>Account Settings</h2>
          <div className="collapse-icon">
            {showAccountSettings ? '▲' : '▼'}
          </div>
        </div>
        
        {showAccountSettings && (
          <div className="settings-grid">
            <WhatsAppSetting />
            <PasswordUpdate />
          </div>
        )}
      </div>

      {/* Active Lotteries section - collapsible */}
      <div className="dashboard-section">
        <div 
          className="section-header collapsible" 
          onClick={() => toggleSection('activeLotteries')}
        >
          <h2>Active Lotteries</h2>
          <div className="collapse-icon">
            {showActiveLotteries ? '▲' : '▼'}
          </div>
        </div>
        
        {showActiveLotteries && (
          lotteries.length > 0 ? (
            <div className="active-lotteries">
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
            </div>
          ) : (
            <Card>
              <p>No active lotteries found.</p>
            </Card>
          )
        )}
      </div>

      {/* Recent Transactions section - collapsible */}
      <div className="dashboard-section">
        <div 
          className="section-header collapsible" 
          onClick={() => toggleSection('transactions')}
        >
          <h2>Recent Transactions</h2>
          <div className="collapse-icon">
            {showTransactions ? '▲' : '▼'}
          </div>
        </div>
        
        {showTransactions && (
          transactions.length > 0 ? (
            <Card>
              <ul className="transaction-list">
                {transactions.map(transaction => (
                  <li key={transaction.id} className="transaction-item">
                    <div className="transaction-details">
                      <span className="transaction-description">{transaction.description}</span>
                      <span className="transaction-amount">{formatCurrency(transaction.amount)}</span>
                    </div>
                    <div className="transaction-date">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card>
              <p>No recent transactions found.</p>
            </Card>
          )
        )}
      </div>
      
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
              : `Are you sure you want to delete "${selectedLottery.name || `Lottery #${selectedLottery.id}`}"? This action cannot be undone.`
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
      
      {/* Deposit Modal */}
      <DepositModal 
        isOpen={showDepositModal} 
        onClose={handleCloseDepositModal} 
      />
    </div>
  );
};

export default DashboardTab;