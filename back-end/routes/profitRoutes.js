const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Location = require('../model/Location');
const Notification = require('../model/Notification');

// Route to calculate and store last day's profit
router.get('/daily-profit', async (req, res) => {
  try {
    // Get start and end of yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    // Aggregate profit from completed rentals that ended yesterday
    const profitData = await Location.aggregate([
      {
        $match: {
          statut: 'terminée',
          endDate: {
            $gte: startOfYesterday,
            $lte: endOfYesterday
          }
        }
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$prixTTC' }
        }
      }
    ]);

    const totalProfit = profitData.length > 0 ? profitData[0].totalProfit : 0;

    // Create notification with profit information
    const notification = new Notification({
message: `Bénéfice total des locations terminées hier : ${totalProfit} TTC`,
      TypeNotif: 'FINANCE'
    });

    await notification.save();

    res.status(200).json({
      success: true,
      totalProfit,
      notification: notification.message
    });
  } catch (error) {
    console.error('Error calculating daily profit:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating daily profit',
      error: error.message
    });
  }
});

module.exports = router;