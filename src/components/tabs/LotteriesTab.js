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
  }, [currentUser, fetchLotteries]);

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
              {showCreate
