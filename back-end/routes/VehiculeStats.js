const express = require('express');
const router = express.Router();
const Vehicule = require('../model/Vehicule'); // Adjust path to your Vehicule model
const Location = require('../model/Location');
const Maintenance = require('../model/maintenance');



// Get vehicle count by fuel type
router.get('/fuel', async (req, res) => {
  try {
    const stats = await Vehicule.aggregate([
      { $group: { _id: '$carburant', count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get average price per day by brand
router.get('/price-by-brand', async (req, res) => {
  try {
    const stats = await Vehicule.aggregate([
      { $group: { _id: '$marque', avgPrice: { $avg: '$prixParJour' } } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vehicle age distribution
router.get('/age', async (req, res) => {
  try {
    const stats = await Vehicule.aggregate([
      { $group: { _id: '$annee', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total revenue from rentals
router.get('/revenue', async (req, res) => {
  try {
    const stats = await Vehicule.aggregate([
      { $unwind: '$locationHistory' },
      { $group: { _id: null, totalRevenue: { $sum: '$locationHistory.prixTotal' } } }
    ]);
    res.json(stats[0]?.totalRevenue || 0);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rental frequency by vehicle
router.get('/rental-frequency', async (req, res) => {
  try {
    const stats = await Vehicule.aggregate([
      {
        $project: {
          immatriculation: 1,
          marque: 1,
          modele: 1,
          rentalCount: { $size: '$locationHistory' }
        }
      },
      { $sort: { rentalCount: -1 } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vehicles with expiring insurance (within 30 days)
router.get('/insurance-alerts', async (req, res) => {
  try {
    const stats = await Vehicule.find({
      assurance: {
        $lte: new Date(new Date().setDate(new Date().getDate() + 30))
      }
    }).select('immatriculation marque modele assurance');
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get average kilometrage by fuel type
router.get('/kilometrage-by-fuel', async (req, res) => {
  try {
    const stats = await Vehicule.aggregate([
      { $group: { _id: '$carburant', avgKilometrage: { $avg: '$kilometrage' } } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// From Location Table Stats 

router.get('/overall', async (req, res) => {
  try {
    const stats = await Location.aggregate([
      {
        $facet: {
          totalLocations: [{ $count: 'count' }],
          activeLocations: [
            { $match: { statut: 'active' } },
            { $count: 'count' }
          ],
          completedLocations: [
            { $match: { statut: 'terminée' } },
            { $count: 'count' }
          ],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: '$prixTTC' } } }
          ],
          averageRentalDuration: [
            {
              $group: {
                _id: null,
                avgDuration: {
                  $avg: {
                    $divide: [
                      { $subtract: ['$endDate', '$startDate'] },
                      1000 * 60 * 60 * 24 // Convert to days
                    ]
                  }
                }
              }
            }
          ],
          averageDistance: [
            { $match: { distanceParcourue: { $exists: true, $ne: null } } },
            { $group: { _id: null, avgDistance: { $avg: '$distanceParcourue' } } }
          ]
        }
      }
    ]);

    const response = {
      totalLocations: stats[0].totalLocations[0]?.count || 0,
      activeLocations: stats[0].activeLocations[0]?.count || 0,
      completedLocations: stats[0].completedLocations[0]?.count || 0,
      totalRevenue: stats[0].totalRevenue[0]?.total || 0,
      averageRentalDurationDays: stats[0].averageRentalDuration[0]?.avgDuration || 0,
      averageDistanceKm: stats[0].averageDistance[0]?.avgDistance || 0
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overall stats', error: error.message });
  }
});

// Get stats by vehicle
router.get('/by-vehicle/:vehiculeId', async (req, res) => {
  try {
    const vehiculeId = req.params.vehiculeId;
    
    const stats = await Location.aggregate([
      { $match: { vehiculeId: new mongoose.Types.ObjectId(vehiculeId) } },
      {
        $facet: {
          totalLocations: [{ $count: 'count' }],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: '$prixTTC' } } }
          ],
          totalDistance: [
            { $match: { distanceParcourue: { $exists: true, $ne: null } } },
            { $group: { _id: null, total: { $sum: '$distanceParcourue' } } }
          ]
        }
      }
    ]);

    const response = {
      totalLocations: stats[0].totalLocations[0]?.count || 0,
      totalRevenue: stats[0].totalRevenue[0]?.total || 0,
      totalDistanceKm: stats[0].totalDistance[0]?.total || 0
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle stats', error: error.message });
  }
});




router.get('/all-vehicles', async (req, res) => {
  try {
    const stats = await Location.aggregate([
      {
        $facet: {
          totalLocations: [{ $count: 'count' }],
          activeLocations: [
            { $match: { statut: 'active' } },
            { $count: 'count' }
          ],
          completedLocations: [
            { $match: { statut: 'terminée' } },
            { $count: 'count' }
          ],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: '$prixTTC' } } }
          ],
          totalDistance: [
            { $match: { distanceParcourue: { $exists: true, $ne: null } } },
            { $group: { _id: null, total: { $sum: '$distanceParcourue' } } }
          ],
          averageRentalDuration: [
            {
              $group: {
                _id: null,
                avgDuration: {
                  $avg: {
                    $divide: [
                      { $subtract: ['$endDate', '$startDate'] },
                      1000 * 60 * 60 * 24 // Convert to days
                    ]
                  }
                }
              }
            }
          ],
          vehicleStats: [
            {
              $group: {
                _id: '$vehiculeId',
                totalLocations: { $sum: 1 },
                totalRevenue: { $sum: '$prixTTC' },
                totalDistance: { $sum: '$distanceParcourue' }
              }
            },
            {
              $lookup: {
                from: 'vehicules', // Adjust collection name as needed
                localField: '_id',
                foreignField: '_id',
                as: 'vehicleInfo'
              }
            },
            { $unwind: { path: '$vehicleInfo', preserveNullAndEmptyArrays: true } }
          ]
        }
      }
    ]);

    const response = {
      totalLocations: stats[0].totalLocations[0]?.count || 0,
      activeLocations: stats[0].activeLocations[0]?.count || 0,
      completedLocations: stats[0].completedLocations[0]?.count || 0,
      totalRevenue: stats[0].totalRevenue[0]?.total || 0,
      totalDistanceKm: stats[0].totalDistance[0]?.total || 0,
      averageRentalDurationDays: stats[0].averageRentalDuration[0]?.avgDuration || 0,
      vehicleBreakdown: stats[0].vehicleStats.map(v => ({
        vehicleId: v._id,
        vehicleInfo: v.vehicleInfo || null,
        totalLocations: v.totalLocations,
        totalRevenue: v.totalRevenue,
        totalDistanceKm: v.totalDistance || 0
      }))
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle stats', error: error.message });
  }
});

// Get monthly revenue stats for all vehicles
router.get('/monthly-revenue', async (req, res) => {
  try {
    const stats = await Location.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' }
          },
          totalRevenue: { $sum: '$prixTTC' },
          locationCount: { $sum: 1 },
          totalDistance: { $sum: '$distanceParcourue' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 } // Last 12 months
    ]);

    res.json(stats.map(stat => ({
      year: stat._id.year,
      month: stat._id.month,
      totalRevenue: stat.totalRevenue,
      locationCount: stat.locationCount,
      totalDistanceKm: stat.totalDistance || 0
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly stats', error: error.message });
  }
});



router.get('/locations-per-month', async (req, res) => {
  try {
    const locationsPerMonth = await Location.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          count: 1
        }
      }
    ]);

    res.json(locationsPerMonth);
  } catch (error) {
    console.error('Erreur lors du comptage des locations par mois:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});





// Route pour calculer le coût total de maintenance par mois
router.get('/maintenance/cout-par-mois', async (req, res) => {
    try {
        const coutParMois = await Maintenance.aggregate([
            {
                // Grouper par année et mois
                $group: {
                    _id: {
                        annee: { $year: "$date" },
                        mois: { $month: "$date" }
                    },
                    totalCout: { $sum: "$cout" },
                    nombreEntretiens: { $count: {} }
                }
            },
            {
                // Trier par année et mois
                $sort: {
                    "_id.annee": -1,
                    "_id.mois": -1
                }
            },
            {
                // Formater la sortie
                $project: {
                    _id: 0,
                    periode: {
                        $concat: [
                            { $toString: "$_id.annee" },
                            "-",
                            { $cond: [
                                { $lt: ["$_id.mois", 10] },
                                { $concat: ["0", { $toString: "$_id.mois" }] },
                                { $toString: "$_id.mois" }
                            ]}
                        ]
                    },
                    totalCout: 1,
                    nombreEntretiens: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: coutParMois
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erreur lors du calcul des coûts",
            error: error.message
        });
    }
});





// Route to get financial summary per vehicle
router.get('/vehicle-financials', async (req, res) => {
  try {
    // Aggregate location revenue
    const locationRevenue = await Location.aggregate([
      {
        $group: {
          _id: '$vehiculeId',
          totalRevenue: { $sum: '$prixTTC' }
        }
      }
    ]);

    // Aggregate maintenance costs
    const maintenanceCosts = await Maintenance.aggregate([
      {
        $group: {
          _id: '$vehicule',
          totalMaintenanceCost: { $sum: '$cout' }
        }
      }
    ]);

    // Combine results and fetch vehicle names using findById
    const financialSummary = await Promise.all(
      locationRevenue.map(async (vehicle) => {
        const maintenance = maintenanceCosts.find(
          (m) => m._id.toString() === vehicle._id.toString()
        );

        // Fetch vehicle details using findById
        const vehicleDoc = await Vehicule.findById(vehicle._id).select('marque modele');

        return {
          vehicleId: vehicle._id,
          vehicleName: vehicleDoc ? `${vehicleDoc.marque} ${vehicleDoc.modele}` : 'Unknown',
          totalRevenue: vehicle.totalRevenue || 0,
          totalMaintenanceCost: maintenance ? maintenance.totalMaintenanceCost : 0,
          netProfit: (vehicle.totalRevenue || 0) - (maintenance ? maintenance.totalMaintenanceCost : 0)
        };
      })
    );

    res.json(financialSummary);
  } catch (error) {
    console.error('Error calculating vehicle financials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/vehicles/count-by-status', async (req, res) => {
    try {
        const statusCounts = await Vehicule.aggregate([
            {
                $group: {
                    _id: '$statut',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 } // Sort by status alphabetically
            }
        ]);

        // Transform the result into a more readable format
        const result = {
            Disponible: 0,
            Loué: 0,
            'En maintenance': 0,
            'En panne': 0,
            Accidenté: 0
        };

        statusCounts.forEach(item => {
            result[item._id] = item.count;
        });

        res.status(200).json({
            success: true,
            data: result,
            total: statusCounts.reduce((sum, item) => sum + item.count, 0)
        });
    } catch (error) {
        console.error('Error counting vehicles by status:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du comptage des véhicules par statut',
            error: error.message
        });
    }
});





router.get('/vehicles/count-by-carburant', async (req, res) => {
  try {
    // Aggregate vehicles by carburant and count occurrences
    const result = await Vehicule.aggregate([
      {
        $group: {
          _id: '$carburant',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          carburant: '$_id',
          count: 1
        }
      }
    ]);

    // Transform the result into a key-value object for the response
    const fuelCounts = {
      Essence: 0,
      Diesel: 0,
      Hybride: 0,
      Electrique: 0
    };

    result.forEach(item => {
      fuelCounts[item.carburant] = item.count;
    });

    // Calculate total vehicles
    const total = Object.values(fuelCounts).reduce((sum, count) => sum + count, 0);

    // Send response
    res.json({
      success: true,
      data: fuelCounts,
      total
    });
  } catch (error) {
    console.error('Error fetching vehicle counts by carburant:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicle statistics'
    });
  }
});

// Route to count vehicles by year
router.get('/vehicles/count-by-year', async (req, res) => {
  try {
    // Aggregate vehicles by annee and count occurrences
    const result = await Vehicule.aggregate([
      {
        $group: {
          _id: '$annee',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          annee: '$_id',
          count: 1
        }
      }
    ]);

    // Initialize counts for all possible years (2010 to current year)
    const currentYear = new Date().getFullYear();
    const yearCounts = {};
    for (let year = 2010; year <= currentYear; year++) {
      yearCounts[year] = 0;
    }

    // Populate counts from aggregation result
    result.forEach(item => {
      yearCounts[item.annee] = item.count;
    });

    // Calculate total vehicles
    const total = Object.values(yearCounts).reduce((sum, count) => sum + count, 0);

    // Send response
    res.json({
      success: true,
      data: yearCounts,
      total
    });
  } catch (error) {
    console.error('Error fetching vehicle counts by year:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicle statistics'
    });
  }
});






// Route GET pour calculer le revenu par type de carburant
router.get('/revenu-par-carburant', async (req, res) => {
  try {
    // Agrégation MongoDB
    const revenus = await Location.aggregate([
      // Étape 1 : Joindre la collection Vehicule via vehiculeId
      {
        $lookup: {
          from: 'vehicules', // Nom de la collection dans MongoDB (en minuscule et pluriel)
          localField: 'vehiculeId',
          foreignField: '_id',
          as: 'vehicule'
        }
      },
      // Étape 2 : Décomposer le tableau vehicule (résultat de $lookup)
      {
        $unwind: '$vehicule'
      },
      // Étape 3 : Grouper par type de carburant et sommer prixTTC
      {
        $group: {
          _id: '$vehicule.carburant',
          revenuTotal: { $sum: '$prixTTC' }
        }
      },
      // Étape 4 : Formater le résultat
      {
        $project: {
          carburant: '$_id',
          revenuTotal: 1,
          _id: 0
        }
      },
      // Étape 5 : Trier par carburant (facultatif, pour une présentation cohérente)
      {
        $sort: { carburant: 1 }
      }
    ]);

    // Réponse avec les résultats
    res.status(200).json({
      message: 'Revenu par type de carburant calculé avec succès',
      data: revenus
    });
  } catch (error) {
    console.error('Erreur lors du calcul du revenu par carburant :', error);
    res.status(500).json({
      message: 'Erreur serveur lors du calcul du revenu',
      error: error.message
    });
  }
});






module.exports = router;