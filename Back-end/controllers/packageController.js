const Package = require('../models/Package');

// Get all active packages (Public/User)
const getPublicPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ priceINR: 1 });
    res.json({ success: true, packages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch packages: ' + err.message });
  }
};

// Admin: Get all packages (including inactive)
const getAdminPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json({ success: true, packages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch packages: ' + err.message });
  }
};

// Admin: Create package
const createPackage = async (req, res) => {
  try {
    const { name, description, priceINR, priceUSD, duration, features, isPopular } = req.body;
    if (!name || priceINR === undefined || priceUSD === undefined) {
      return res.status(400).json({ error: 'Package name, priceINR, and priceUSD are required.' });
    }

    const newPackage = new Package({
      name,
      description: description || '',
      priceINR: Number(priceINR),
      priceUSD: Number(priceUSD),
      duration: duration || 'monthly',
      features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : []),
      isPopular: !!isPopular,
      isActive: true
    });

    await newPackage.save();
    res.status(201).json({ success: true, package: newPackage, message: 'Package created successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create package: ' + err.message });
  }
};

// Admin: Update package
const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, priceINR, priceUSD, duration, features, isPopular, isActive } = req.body;

    const pkg = await Package.findById(id);
    if (!pkg) return res.status(404).json({ error: 'Package not found.' });

    if (name !== undefined) pkg.name = name;
    if (description !== undefined) pkg.description = description;
    if (priceINR !== undefined) pkg.priceINR = Number(priceINR);
    if (priceUSD !== undefined) pkg.priceUSD = Number(priceUSD);
    if (duration !== undefined) pkg.duration = duration;
    if (features !== undefined) pkg.features = Array.isArray(features) ? features : features.split(',').map(f => f.trim());
    if (isPopular !== undefined) pkg.isPopular = isPopular;
    if (isActive !== undefined) pkg.isActive = isActive;

    await pkg.save();
    res.json({ success: true, package: pkg, message: 'Package updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update package: ' + err.message });
  }
};

// Admin: Delete package
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    await Package.findByIdAndDelete(id);
    res.json({ success: true, message: 'Package deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete package: ' + err.message });
  }
};

module.exports = {
  getPublicPackages,
  getAdminPackages,
  createPackage,
  updatePackage,
  deletePackage
};
