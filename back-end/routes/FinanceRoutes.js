const express = require('express');
const router = express.Router();
const Maintenance = require('../model/maintenance');

// Get total maintenance cost per vehicle
router.get('/stats/total-cost-per-vehicle', async (req, res) => {
    try {
        const stats = await Maintenance.aggregate([
            {
                $group: {
                    _id: '$vehicule',
                    totalCost: { $sum: '$cout' },
                    maintenanceCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'vehicules',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'vehicleDetails'
                }
            },
            {
                $unwind: '$vehicleDetails'
            },
            {
                $project: {
                    vehicleId: '$_id',
                    vehicleName: '$vehicleDetails.name',
                    totalCost: 1,
                    maintenanceCount: 1
                }
            }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get maintenance frequency by type
router.get('/stats/maintenance-by-type', async (req, res) => {
    try {
        const stats = await Maintenance.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    averageCost: { $avg: '$cout' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get maintenance costs over time
router.get('/stats/costs-over-time', async (req, res) => {
    try {
        const stats = await Maintenance.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    totalCost: { $sum: '$cout' },
                    maintenanceCount: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            },
            {
                $project: {
                    period: {
                        $concat: [
                            { $toString: '$_id.year' },
                            '-',
                            { $toString: '$_id.month' }
                        ]
                    },
                    totalCost: 1,
                    maintenanceCount: 1
                }
            }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get average maintenance cost by garage
router.get('/stats/average-cost-by-garage', async (req, res) => {
    try {
        const stats = await Maintenance.aggregate([
            {
                $match: { garage: { $ne: null } }
            },
            {
                $group: {
                    _id: '$garage',
                    averageCost: { $avg: '$cout' },
                    maintenanceCount: { $sum: 1 }
                }
            },
            {
                $sort: { averageCost: -1 }
            }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;