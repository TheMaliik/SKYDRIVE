import React from 'react';
import '../styles/StatCard.css';

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="stat-card">
      <span className="icon">{icon}</span>
      <div className="details">
        <h4>{title}</h4>
        <p>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
