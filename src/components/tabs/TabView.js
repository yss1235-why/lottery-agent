// src/components/tabs/TabView.js
import React, { useState } from 'react';
import { FiHome, FiTarget, FiTag, FiPlus } from 'react-icons/fi';

const TabView = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Map tab icons to React Icons
  const getTabIcon = (iconName) => {
    switch(iconName) {
      case '📊': return <FiHome />;
      case '🎯': return <FiTarget />;
      case '🎫': return <FiTag />; // Changed from FiTicket to FiTag
      case '➕': return <FiPlus />;
      default: return <FiHome />;
    }
  };

  // Find the active tab component to render
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="tab-view">
      <div className="tab-content">
        {activeTabContent}
      </div>
      
      <nav className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{getTabIcon(tab.icon)}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabView;