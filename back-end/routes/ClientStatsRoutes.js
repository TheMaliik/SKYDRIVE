const express = require('express');
const router = express.Router();
const Client = require('../model/Client'); // Adjust the path to your Client model

// Route to fetch the most loyal client based on nombreLocations
router.get('/most-loyal-client', async (req, res) => {
  try {
    // Find the client with the highest nombreLocations, sort in descending order and limit to 1
    const mostLoyalClient = await Client.findOne()
      .sort({ nombreLocations: -1 }) // Sort by nombreLocations in descending order
      .select('nom prenom nombreLocations fidelityStatus'); // Select only relevant fields

    if (!mostLoyalClient) {
      return res.status(404).json({ message: 'No clients found' });
    }

    res.status(200).json({
      message: 'Most loyal client retrieved successfully',
      client: mostLoyalClient
    });
  } catch (error) {
    console.error('Error fetching most loyal client:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;