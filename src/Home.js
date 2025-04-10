// src/Home.js
import React from 'react';
import TabView from './components/tabs/TabView';
import DashboardTab from './components/tabs/DashboardTab';
import LotteriesTab from './components/tabs/LotteriesTab';
import TicketsTab from './components/tabs/TicketsTab';
import DrawTab from './components/tabs/DrawTab';

const Home = () => {
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: '📊', 
      component: <DashboardTab /> 
    },
    { 
      id: 'lotteries', 
      label: 'Lotteries', 
      icon: '🎯', 
      component: <LotteriesTab /> 
    },
    { 
      id: 'tickets', 
      label: 'Tickets', 
      icon: '🎫', 
      component: <TicketsTab /> 
    },
    { 
      id: 'draw', 
      label: 'Draw', 
      icon: '🏆', 
      component: <DrawTab /> 
    }
  ];

  return (
    <div className="home-container">
      <TabView tabs={tabs} />
    </div>
  );
};

export default Home;