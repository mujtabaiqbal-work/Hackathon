import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// --- 1. MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_system';
let isMongoConnected = false;

// --- 2. SCHEMAS & MODELS ---
const CapacitySubSchema = {
  total: { type: Number, required: true },
  occupied: { type: Number, required: true },
  available: { type: Number, required: true }
};

// Explicit _id: String overrides default ObjectId validation
const HospitalSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  contact: { type: String, required: true },
  verificationStatus: { type: String, default: 'VERIFIED' },
  emergencyAvailable: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now },
  capacity: {
    icuBeds: CapacitySubSchema,
    ventilators: CapacitySubSchema,
    generalBeds: CapacitySubSchema,
    nicuBeds: CapacitySubSchema,
    dialysis: CapacitySubSchema,
    isolationBeds: CapacitySubSchema
  }
});

const RequestSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  condition: { type: String, required: true },
  urgency: { type: String, enum: ['LOW', 'MODERATE', 'URGENT', 'CRITICAL'], default: 'CRITICAL' },
  requiredResource: { type: String, default: 'icuBeds' },
  hospitalId: { type: String, required: true },
  status: {
    type: String,
    enum: [
      'Need Identified',
      'Request Sent',
      'Hospital Reviewing',
      'Accepted',
      'Patient Transferred',
      'Admitted',
      'Rejected',
      'Cancelled',
      'Expired'
    ],
    default: 'Request Sent'
  },
  heldBed: { type: Boolean, default: false },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date }
});

const AuditLogSchema = new mongoose.Schema({
  hospitalId: String,
  hospitalName: String,
  action: String,
  timestamp: { type: Date, default: Date.now }
});

const HospitalModel = mongoose.model('Hospital', HospitalSchema);
const RequestModel = mongoose.model('Request', RequestSchema);
const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);

// --- 3. SEED HOSPITALS (All 13 Hyderabad Medical Centers) ---
const SEED_HOSPITALS = [
  {
    _id: 'hosp-1',
    name: 'Civil Hospital Hyderabad (LUMHS City Branch)',
    location: 'Station Road, Saddar, Hyderabad',
    lat: 25.3920,
    lng: 68.3735,
    contact: '+92-22-9210207',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 4 * 60 * 1000),
    capacity: {
      icuBeds: { total: 28, occupied: 25, available: 3 },
      ventilators: { total: 16, occupied: 12, available: 4 },
      generalBeds: { total: 150, occupied: 125, available: 25 },
      nicuBeds: { total: 12, occupied: 9, available: 3 },
      dialysis: { total: 14, occupied: 11, available: 3 },
      isolationBeds: { total: 8, occupied: 6, available: 2 }
    }
  },
  {
    _id: 'hosp-2',
    name: 'Liaquat University Medical Complex (LUMHS Jamshoro)',
    location: 'Indus Highway, Jamshoro / Hyderabad Outskirts',
    lat: 25.4285,
    lng: 68.2615,
    contact: '+92-22-9213305',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 10 * 60 * 1000),
    capacity: {
      icuBeds: { total: 35, occupied: 29, available: 6 },
      ventilators: { total: 22, occupied: 16, available: 6 },
      generalBeds: { total: 260, occupied: 215, available: 45 },
      nicuBeds: { total: 18, occupied: 13, available: 5 },
      dialysis: { total: 20, occupied: 15, available: 5 },
      isolationBeds: { total: 15, occupied: 11, available: 4 }
    }
  },
  {
    _id: 'hosp-3',
    name: 'Isra University Hospital',
    location: 'Hala Road, Hyderabad',
    lat: 25.4350,
    lng: 68.3980,
    contact: '+92-22-2030161',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 7 * 60 * 1000),
    capacity: {
      icuBeds: { total: 18, occupied: 14, available: 4 },
      ventilators: { total: 10, occupied: 7, available: 3 },
      generalBeds: { total: 110, occupied: 92, available: 18 },
      nicuBeds: { total: 8, occupied: 6, available: 2 },
      dialysis: { total: 10, occupied: 8, available: 2 },
      isolationBeds: { total: 6, occupied: 4, available: 2 }
    }
  },
  {
    _id: 'hosp-4',
    name: 'Bhitai Hospital Latifabad',
    location: 'Latifabad Unit 5, Hyderabad',
    lat: 25.3650,
    lng: 68.3610,
    contact: '+92-22-3860124',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 12 * 60 * 1000),
    capacity: {
      icuBeds: { total: 15, occupied: 13, available: 2 },
      ventilators: { total: 6, occupied: 5, available: 1 },
      generalBeds: { total: 80, occupied: 68, available: 12 },
      nicuBeds: { total: 6, occupied: 5, available: 1 },
      dialysis: { total: 8, occupied: 6, available: 2 },
      isolationBeds: { total: 4, occupied: 3, available: 1 }
    }
  },
  {
    _id: 'hosp-5',
    name: 'Red Crescent Cardiac Hospital',
    location: 'Latifabad Unit 6, Hyderabad',
    lat: 25.3712,
    lng: 68.3582,
    contact: '+92-22-3862211',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 2 * 60 * 1000),
    capacity: {
      icuBeds: { total: 16, occupied: 11, available: 5 },
      ventilators: { total: 8, occupied: 6, available: 2 },
      generalBeds: { total: 50, occupied: 38, available: 12 },
      nicuBeds: { total: 0, occupied: 0, available: 0 },
      dialysis: { total: 6, occupied: 4, available: 2 },
      isolationBeds: { total: 4, occupied: 2, available: 2 }
    }
  },
  {
    _id: 'hosp-6',
    name: 'Aga Khan Maternal & Child Care Center',
    location: 'Jamshoro Road, Hyderabad',
    lat: 25.4055,
    lng: 68.3412,
    contact: '+92-22-3668000',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 48 * 60 * 1000),
    capacity: {
      icuBeds: { total: 12, occupied: 11, available: 1 },
      ventilators: { total: 6, occupied: 5, available: 1 },
      generalBeds: { total: 60, occupied: 52, available: 8 },
      nicuBeds: { total: 14, occupied: 11, available: 3 },
      dialysis: { total: 4, occupied: 4, available: 0 },
      isolationBeds: { total: 6, occupied: 5, available: 1 }
    }
  },
  {
    _id: 'hosp-7',
    name: 'City Care Hospital',
    location: 'Main Autobahn Road, Latifabad, Hyderabad',
    lat: 25.3754,
    lng: 68.3490,
    contact: '+92-22-3814400',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000),
    capacity: {
      icuBeds: { total: 14, occupied: 10, available: 4 },
      ventilators: { total: 7, occupied: 4, available: 3 },
      generalBeds: { total: 75, occupied: 60, available: 15 },
      nicuBeds: { total: 6, occupied: 4, available: 2 },
      dialysis: { total: 8, occupied: 6, available: 2 },
      isolationBeds: { total: 5, occupied: 3, available: 2 }
    }
  },
  {
    _id: 'hosp-8',
    name: 'Hashim Hospital',
    location: 'Defence Plaza, Thandi Sarak, Hyderabad',
    lat: 25.4010,
    lng: 68.3630,
    contact: '+92-22-2782100',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 15 * 60 * 1000),
    capacity: {
      icuBeds: { total: 10, occupied: 8, available: 2 },
      ventilators: { total: 4, occupied: 3, available: 1 },
      generalBeds: { total: 55, occupied: 45, available: 10 },
      nicuBeds: { total: 4, occupied: 3, available: 1 },
      dialysis: { total: 5, occupied: 4, available: 1 },
      isolationBeds: { total: 3, occupied: 2, available: 1 }
    }
  },
  {
    _id: 'hosp-9',
    name: 'American Hospital Hyderabad',
    location: 'Autobahn Road, Hyderabad',
    lat: 25.3780,
    lng: 68.3470,
    contact: '+92-22-3817788',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 6 * 60 * 1000),
    capacity: {
      icuBeds: { total: 12, occupied: 9, available: 3 },
      ventilators: { total: 5, occupied: 3, available: 2 },
      generalBeds: { total: 65, occupied: 50, available: 15 },
      nicuBeds: { total: 5, occupied: 3, available: 2 },
      dialysis: { total: 6, occupied: 4, available: 2 },
      isolationBeds: { total: 4, occupied: 2, available: 2 }
    }
  },
  {
    _id: 'hosp-10',
    name: 'Majee Hospital',
    location: 'Near Old Campus, Sindh University, Hyderabad',
    lat: 25.3955,
    lng: 68.3685,
    contact: '+92-22-2612500',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 20 * 60 * 1000),
    capacity: {
      icuBeds: { total: 8, occupied: 7, available: 1 },
      ventilators: { total: 3, occupied: 2, available: 1 },
      generalBeds: { total: 40, occupied: 34, available: 6 },
      nicuBeds: { total: 4, occupied: 3, available: 1 },
      dialysis: { total: 4, occupied: 3, available: 1 },
      isolationBeds: { total: 2, occupied: 1, available: 1 }
    }
  },
  {
    _id: 'hosp-11',
    name: 'Jijal Maau Hospital',
    location: 'Near Naseem Nagar, Qasimabad, Hyderabad',
    lat: 25.4080,
    lng: 68.3300,
    contact: '+92-22-2651122',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 11 * 60 * 1000),
    capacity: {
      icuBeds: { total: 14, occupied: 11, available: 3 },
      ventilators: { total: 6, occupied: 4, available: 2 },
      generalBeds: { total: 70, occupied: 56, available: 14 },
      nicuBeds: { total: 8, occupied: 6, available: 2 },
      dialysis: { total: 6, occupied: 4, available: 2 },
      isolationBeds: { total: 4, occupied: 3, available: 1 }
    }
  },
  {
    _id: 'hosp-12',
    name: 'Shafay Hospital',
    location: 'Qasim Chowk, Qasimabad, Hyderabad',
    lat: 25.4015,
    lng: 68.3395,
    contact: '+92-22-2654321',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 3 * 60 * 1000),
    capacity: {
      icuBeds: { total: 11, occupied: 8, available: 3 },
      ventilators: { total: 4, occupied: 3, available: 1 },
      generalBeds: { total: 48, occupied: 38, available: 10 },
      nicuBeds: { total: 5, occupied: 3, available: 2 },
      dialysis: { total: 5, occupied: 3, available: 2 },
      isolationBeds: { total: 3, occupied: 2, available: 1 }
    }
  },
  {
    _id: 'hosp-13',
    name: 'Ahmed Khan Hospital',
    location: 'Prince Ali Road, Market Area, Hyderabad',
    lat: 25.3900,
    lng: 68.3705,
    contact: '+92-22-2784567',
    verificationStatus: 'VERIFIED',
    emergencyAvailable: true,
    lastUpdated: new Date(Date.now() - 18 * 60 * 1000),
    capacity: {
      icuBeds: { total: 9, occupied: 7, available: 2 },
      ventilators: { total: 3, occupied: 2, available: 1 },
      generalBeds: { total: 45, occupied: 36, available: 9 },
      nicuBeds: { total: 4, occupied: 3, available: 1 },
      dialysis: { total: 4, occupied: 3, available: 1 },
      isolationBeds: { total: 3, occupied: 2, available: 1 }
    }
  }
];

let inMemoryHospitals = JSON.parse(JSON.stringify(SEED_HOSPITALS));
let inMemoryRequests = [];
let inMemoryAuditLogs = [];

async function seedDatabase() {
  try {
    const collections = await mongoose.connection.db.listCollections({ name: 'hospitals' }).toArray();
    if (collections.length > 0) {
      await mongoose.connection.db.dropCollection('hospitals');
    }
    await HospitalModel.insertMany(SEED_HOSPITALS);
    console.log('✓ Successfully seeded 13 Hyderabad Hospitals into MongoDB');
  } catch (err) {
    console.log('MongoDB Seed note:', err.message);
  }
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    isMongoConnected = true;
    seedDatabase();
  })
  .catch(() => {
    console.log('⚠ Operating in In-Memory Mode with Auto-Sync.');
  });

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// 15-MINUTE AUTOMATED EXPIRATION ENGINE
setInterval(async () => {
  const now = new Date();
  if (isMongoConnected) {
    const expiredList = await RequestModel.find({
      status: 'Accepted',
      heldBed: true,
      expiresAt: { $lt: now }
    });

    for (let req of expiredList) {
      req.status = 'Expired';
      req.heldBed = false;
      await req.save();

      const hosp = await HospitalModel.findById(req.hospitalId);
      if (hosp && hosp.capacity[req.requiredResource]) {
        hosp.capacity[req.requiredResource].available += 1;
        hosp.capacity[req.requiredResource].occupied -= 1;
        await hosp.save();
        await AuditLogModel.create({
          hospitalId: hosp._id,
          hospitalName: hosp.name,
          action: `Automated 15m Expiration: Restored 1 ${req.requiredResource}`
        });
      }
    }
  } else {
    inMemoryRequests.forEach(req => {
      if (req.status === 'Accepted' && req.heldBed && new Date(req.expiresAt) < now) {
        req.status = 'Expired';
        req.heldBed = false;
        const hosp = inMemoryHospitals.find(h => h._id === req.hospitalId);
        if (hosp && hosp.capacity[req.requiredResource]) {
          hosp.capacity[req.requiredResource].available += 1;
          hosp.capacity[req.requiredResource].occupied -= 1;
          inMemoryAuditLogs.unshift({
            hospitalId: hosp._id,
            hospitalName: hosp.name,
            action: `Automated 15m Expiration: Restored 1 ${req.requiredResource}`,
            timestamp: new Date()
          });
        }
      }
    });
  }
}, 15000);

// API 1: PATIENT SEARCH & RANKING
app.get('/api/hospitals', async (req, res) => {
  const { resourceType = 'icuBeds', userLat = 25.3960, userLng = 68.3578 } = req.query;
  const lat = parseFloat(userLat);
  const lng = parseFloat(userLng);

  let hospitals = isMongoConnected
    ? await HospitalModel.find().lean()
    : inMemoryHospitals;

  const now = Date.now();
  const ranked = hospitals.map(h => {
    const dist = calculateDistance(lat, lng, h.lat, h.lng);
    const travelTime = Math.max(3, Math.round(dist * 2.4));
    const avail = h.capacity[resourceType]?.available || 0;
    const isSuitable = avail > 0 && h.emergencyAvailable;

    let score = 50;
    score += Math.max(0, 30 - dist * 2);
    score += Math.min(20, avail * 4);
    if (!isSuitable) score = 0;

    const diffMinutes = Math.round((now - new Date(h.lastUpdated).getTime()) / (60 * 1000));
    const isStale = diffMinutes > 30;

    return {
      ...h,
      distanceKm: dist,
      travelTimeMins: travelTime,
      isSuitable,
      matchScore: Math.min(99, Math.round(score)),
      isStale,
      lastUpdatedMinutesAgo: diffMinutes
    };
  });

  ranked.sort((a, b) => b.isSuitable - a.isSuitable || b.matchScore - a.matchScore);
  res.json(ranked);
});

// API 2: CREATE REFERRAL
app.post('/api/requests', async (req, res) => {
  const { patientName, condition, urgency, requiredResource = 'icuBeds', hospitalId } = req.body;
  if (!patientName || !hospitalId) {
    return res.status(400).json({ error: 'Missing required patient name or hospital' });
  }

  const newReq = {
    patientName,
    condition: condition || 'Critical referral',
    urgency: urgency || 'CRITICAL',
    requiredResource,
    hospitalId,
    status: 'Request Sent',
    heldBed: false,
    createdAt: new Date()
  };

  if (isMongoConnected) {
    const doc = await RequestModel.create(newReq);
    res.status(201).json(doc);
  } else {
    newReq._id = 'REQ-' + Math.floor(100 + Math.random() * 900);
    inMemoryRequests.unshift(newReq);
    res.status(201).json(newReq);
  }
});

// API: GET REQUESTS
app.get('/api/requests', async (req, res) => {
  const list = isMongoConnected
    ? await RequestModel.find().sort({ createdAt: -1 })
    : inMemoryRequests;
  res.json(list);
});

// API: ACCEPT & 15-MIN BED HOLD
app.post('/api/requests/:id/accept', async (req, res) => {
  const reqId = req.params.id;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  let targetReq, hosp;

  if (isMongoConnected) {
    targetReq = await RequestModel.findById(reqId);
    if (!targetReq) return res.status(404).json({ error: 'Request not found' });
    hosp = await HospitalModel.findById(targetReq.hospitalId);

    if (hosp.capacity[targetReq.requiredResource].available <= 0) {
      return res.status(400).json({ error: 'No beds currently available for this resource' });
    }

    hosp.capacity[targetReq.requiredResource].available -= 1;
    hosp.capacity[targetReq.requiredResource].occupied += 1;
    hosp.lastUpdated = new Date();
    await hosp.save();

    targetReq.status = 'Accepted';
    targetReq.heldBed = true;
    targetReq.expiresAt = expiresAt;
    targetReq.acceptedAt = new Date();
    await targetReq.save();

    await AuditLogModel.create({
      hospitalId: hosp._id,
      hospitalName: hosp.name,
      action: `Bed Reserved (15m hold) for patient: ${targetReq.patientName}`
    });
  } else {
    targetReq = inMemoryRequests.find(r => r._id === reqId);
    if (!targetReq) return res.status(404).json({ error: 'Request not found' });
    hosp = inMemoryHospitals.find(h => h._id === targetReq.hospitalId);

    if (hosp.capacity[targetReq.requiredResource].available <= 0) {
      return res.status(400).json({ error: 'No beds currently available' });
    }

    hosp.capacity[targetReq.requiredResource].available -= 1;
    hosp.capacity[targetReq.requiredResource].occupied += 1;
    hosp.lastUpdated = new Date();

    targetReq.status = 'Accepted';
    targetReq.heldBed = true;
    targetReq.expiresAt = expiresAt;
    targetReq.acceptedAt = new Date();

    inMemoryAuditLogs.unshift({
      hospitalId: hosp._id,
      hospitalName: hosp.name,
      action: `Bed Reserved (15m hold) for patient: ${targetReq.patientName}`,
      timestamp: new Date()
    });
  }

  res.json({
    success: true,
    message: '1 Bed held for 15 minutes',
    status: 'Accepted',
    expiresAt
  });
});

// API: TRANSFER CONFIRMATION
app.post('/api/requests/:id/transfer', async (req, res) => {
  const reqId = req.params.id;
  if (isMongoConnected) {
    await RequestModel.findByIdAndUpdate(reqId, { status: 'Patient Transferred' });
  } else {
    const item = inMemoryRequests.find(r => r._id === reqId);
    if (item) item.status = 'Patient Transferred';
  }
  res.json({ success: true, status: 'Patient Transferred' });
});

// API: ADMISSION CONFIRMATION
app.post('/api/requests/:id/admit', async (req, res) => {
  const reqId = req.params.id;
  if (isMongoConnected) {
    const r = await RequestModel.findById(reqId);
    if (r) {
      r.status = 'Admitted';
      r.heldBed = false;
      await r.save();
    }
  } else {
    const item = inMemoryRequests.find(r => r._id === reqId);
    if (item) {
      item.status = 'Admitted';
      item.heldBed = false;
    }
  }
  res.json({ success: true, status: 'Admitted' });
});

// API 3: CAPACITY +/- CONTROLS
app.post('/api/hospitals/:id/capacity', async (req, res) => {
  const { id } = req.params;
  const { resourceType = 'icuBeds', delta } = req.body;

  let hosp;
  if (isMongoConnected) {
    hosp = await HospitalModel.findById(id);
    if (!hosp) return res.status(404).json({ error: 'Hospital not found' });

    const target = hosp.capacity[resourceType];
    const newAvail = target.available + delta;
    if (newAvail < 0 || newAvail > target.total) {
      return res.status(400).json({ error: 'Capacity boundaries exceeded' });
    }

    target.available = newAvail;
    target.occupied = target.total - newAvail;
    hosp.lastUpdated = new Date();
    await hosp.save();

    await AuditLogModel.create({
      hospitalId: hosp._id,
      hospitalName: hosp.name,
      action: `Manual Adjustment: ${resourceType} ${delta > 0 ? '+1' : '-1'} (Now ${newAvail})`
    });
  } else {
    hosp = inMemoryHospitals.find(h => h._id === id);
    if (!hosp) return res.status(404).json({ error: 'Hospital not found' });

    const target = hosp.capacity[resourceType];
    const newAvail = target.available + delta;
    if (newAvail < 0 || newAvail > target.total) {
      return res.status(400).json({ error: 'Capacity boundaries exceeded' });
    }

    target.available = newAvail;
    target.occupied = target.total - newAvail;
    hosp.lastUpdated = new Date();

    inMemoryAuditLogs.unshift({
      hospitalId: hosp._id,
      hospitalName: hosp.name,
      action: `Manual Adjustment: ${resourceType} ${delta > 0 ? '+1' : '-1'} (Now ${newAvail})`,
      timestamp: new Date()
    });
  }

  res.json({
    success: true,
    hospitalId: id,
    resourceType,
    updatedAvailable: hosp.capacity[resourceType].available,
    lastUpdated: hosp.lastUpdated
  });
});

// API 4: DASHBOARD ANALYTICS
app.get('/api/dashboard/analytics', async (req, res) => {
  const hospitals = isMongoConnected
    ? await HospitalModel.find().lean()
    : inMemoryHospitals;

  const logs = isMongoConnected
    ? await AuditLogModel.find().sort({ timestamp: -1 }).limit(10).lean()
    : inMemoryAuditLogs.slice(0, 10);

  const totalICUBeds = hospitals.reduce((acc, h) => acc + (h.capacity.icuBeds?.total || 0), 0);
  const availICUBeds = hospitals.reduce((acc, h) => acc + (h.capacity.icuBeds?.available || 0), 0);
  const totalVents = hospitals.reduce((acc, h) => acc + (h.capacity.ventilators?.total || 0), 0);
  const availVents = hospitals.reduce((acc, h) => acc + (h.capacity.ventilators?.available || 0), 0);

  const occupancyRate = totalICUBeds > 0
    ? (((totalICUBeds - availICUBeds) / totalICUBeds) * 100).toFixed(1) + '%'
    : '0%';

  res.json({
    totalFacilities: hospitals.length,
    verifiedFacilities: hospitals.filter(h => h.verificationStatus === 'VERIFIED').length,
    cityTotalICUBeds: totalICUBeds,
    cityAvailableICUBeds: availICUBeds,
    cityTotalVentilators: totalVents,
    cityAvailableVentilators: availVents,
    overallICUOccupancyRate: occupancyRate,
    recentAuditLogs: logs
  });
});

export default app;
