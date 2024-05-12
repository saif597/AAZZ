const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');


const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));

const port = process.env.PORT || 3001;


const serviceAccount = require('./hauto-1f444-firebase-adminsdk-dt6x9-ec28b4fa76.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(bodyParser.json());
app.use(cors());


// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Query Firestore for a doctor with matching email and password
      const doctorsRef = db.collection('doctors');
      const snapshot = await doctorsRef.where('email', '==', email).where('password', '==', password).get();
  
      // If a doctor with matching email and password is found, return the ID
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          res.status(200).json({ doctorId: doc.id });
        });
      } else {
        // If no matching doctor is found, return an error
        res.status(404).json({ message: 'Doctor not found' });
      }
    } catch (error) {
      // Handle any errors
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'An error occurred while logging in' });
    }
  });

  app.get('/api/arrivals/:doctorId', async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        // Query Firestore to retrieve arrivals with matching doctorId
        const querySnapshot = await db.collection('arrivals').where('doctorID', '==', doctorId).get();

        // Initialize an array to store the matching arrivals
        const matchingArrivals = [];

        // Iterate through the query snapshot and push matching arrivals to the array
        querySnapshot.forEach((doc) => {
            // Extract the document ID and data
            const arrivalData = doc.data();
            const arrivalId = doc.id;

            // Include the document ID along with the arrival data
            matchingArrivals.push({ id: arrivalId, ...arrivalData });
        });

        // Send the matching arrivals as a response
        return res.status(200).json({ arrivals: matchingArrivals });
    } catch (error) {
        console.error('Error retrieving arrivals:', error);
        return res.status(500).json({ message: 'Error retrieving arrivals' });
    }
});

// Define the route for retrieving doctor links
app.get('/api/doctors', async (req, res) => {
    try {
      // Retrieve doctors from the Firestore database
      const doctorsSnapshot = await db.collection('doctors').get();
  
      // Initialize an empty array to store doctor links
      const doctorLinks = [];
  
      // Iterate through the snapshot of doctors
      doctorsSnapshot.forEach((doc) => {
        // Extract doctor data and construct the link object
        const doctorId = doc.id;
        const doctorData = doc.data();
        const doctorLink = {
          id: doctorId,
          name: doctorData.name,
          email:doctorData.email,
          password:doctorData.password,
          professionalDomain:doctorData.professionalDomain
        };
  
        // Push the doctor link object to the array
        doctorLinks.push(doctorLink);
      });
  
      // Send the list of doctor links as the response
      res.status(200).json(doctorLinks);
    } catch (error) {
      // Handle any errors that occur during the process
      console.error('Error fetching doctor links:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// Define the route for inserting arrivals
app.post('/api/arrivals', async (req, res) => {
    try {
      // Extract arrival data from the request body
      const { arrivalTime, askedToWait, calledInTime, calledInside, dob, doctorID, name } = req.body;
  
      // Validate the incoming data (add your validation logic here)
  
      // Create a new arrival object
      const arrivalData = {
        arrivalTime: new Date(arrivalTime).toISOString(),
        askedToWait: !!askedToWait, // Convert to boolean
        calledInTime: calledInTime ? new Date(calledInTime).toISOString() : null,
        calledInside: !!calledInside, // Convert to boolean
        dob: new Date(dob).toISOString(),
        doctorID,
        name
      };
  
      // Add the arrival data to the arrivals collection in Firestore
      const docRef = await db.collection('arrivals').add(arrivalData);
  
      // Return the ID of the inserted document as the response
      res.status(201).json({ id: docRef.id });
    } catch (error) {
      // Handle any errors that occur during the process
      console.error('Error inserting arrival:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.put('/api/arrivals/:arrivalId/askedToWait', async (req, res) => {
    try {
        const arrivalId = req.params.arrivalId;

        // Update the askedToWait field of the arrival document to true
        await db.collection('arrivals').doc(arrivalId).update({
            askedToWait: true
        });

        // Send a success response
        return res.status(200).json({ message: 'Arrival updated successfully' });
    } catch (error) {
        console.error('Error updating arrival:', error);
        return res.status(500).json({ message: 'Error updating arrival' });
    }
});

app.put('/api/arrivals/:arrivalId/calledInside', async (req, res) => {
    try {
        const arrivalId = req.params.arrivalId;
        const callTime = req.body.calledInTime;

        // Update the askedToWait field of the arrival document to true
        await db.collection('arrivals').doc(arrivalId).update({
            calledInside: true,
            calledInTime:callTime
        });

        // Send a success response
        return res.status(200).json({ message: 'Arrival updated successfully' });
    } catch (error) {
        console.error('Error updating arrival:', error);
        return res.status(500).json({ message: 'Error updating arrival' });
    }
});
  
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
