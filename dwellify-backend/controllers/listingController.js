const admin = require('../config/firebase');
const fs = require('fs');
const path = require('path');

// Controller function to handle listing creation
exports.createListing = async (req, res) => {
  const { title, location, price } = req.body;
  const localFilePath = req.file ? req.file.path : null;

  if (!title || !location || !price || !localFilePath) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Upload image to Firebase Storage
    const bucket = admin.storage().bucket();
    const storageFileName = `listings/${Date.now()}_${path.basename(localFilePath)}`;
    await bucket.upload(localFilePath, {
      destination: storageFileName,
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    // Make the file public and get its URL
    const file = bucket.file(storageFileName);
    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${storageFileName}`;

    // Save listing data to Firestore
    const db = admin.firestore();
    const listingRef = await db.collection('listings').add({
      title,
      location,
      price,
      imageUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Optionally delete local file after upload
    fs.unlinkSync(localFilePath);

    res.status(201).json({
      message: 'Property listing added successfully',
      data: {
        id: listingRef.id,
        title,
        location,
        price,
        imageUrl,
      },
    });

  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ message: 'Error creating listing', error: error.message });
  }
};

// Controller function to fetch all listings
exports.getListings = async (req, res) => {
  try {
    const db = admin.firestore();
    const listingsSnapshot = await db.collection('listings').orderBy('createdAt', 'desc').get();

    const listings = [];
    listingsSnapshot.forEach(doc => {
      listings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json({
      message: 'Listings fetched successfully',
      data: listings,
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
};
