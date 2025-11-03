import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, ETHIOPIAN_REGIONS } from '../types';

const prisma = new PrismaClient();

// Get Regional Dashboard Statistics
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    if (!region) {
      return res.status(403).json({ success: false, error: 'Region not found' });
    }

    // Get counts for the region - enhanced to match superadmin stats
    const [
      totalFacilities, 
      activeFacilities, 
      totalDoctors, 
      totalLabTechs,
      totalPharmacists, 
      totalPatients, 
      totalAppointments, 
      totalAdmins,
      recentActivity
    ] = await Promise.all([
      prisma.hospital.count({ where: { region } }),
      prisma.hospital.count({ where: { region, status: "active" } }),
      prisma.doctor.count({ where: { hospital: { region } } }),
      prisma.labTech.count({ where: { hospital: { region } } }),
      prisma.pharmacist.count({ where: { pharmacy: { region } } }),
      prisma.patient.count({ where: { region } }),
      prisma.appointment.count({
        where: {
          hospital: { region },
          scheduledTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.adminUser.count({
        where: {
          hospital: { region }
        }
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { timestamp: "desc" },
        select: {
          action: true,
          entityType: true,
          timestamp: true,
          metadata: true,
        },
      }),
    ]);

    const totalMedicalStaff = totalDoctors + totalLabTechs + totalPharmacists;

    return res.json({
      success: true,
      data: {
        facilities: {
          total: totalFacilities,
          active: activeFacilities,
          inactive: totalFacilities - activeFacilities,
        },
        staff: {
          doctors: totalDoctors,
          labTechnicians: totalLabTechs,
          pharmacists: totalPharmacists,
          total: totalMedicalStaff,
        },
        patients: {
          total: totalPatients,
        },
        appointments: {
          today: totalAppointments,
        },
        totalAdmins: totalAdmins,
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get all facilities (hospitals) in the region
export const getFacilities = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    if (!region) {
      return res.status(403).json({ success: false, error: 'Region not found' });
    }

    const facilities = await prisma.hospital.findMany({
      where: { region },
      include: {
        doctors: { select: { id: true } },
        labTechs: { select: { id: true } },
        adminUsers: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        _count: {
          select: {
            doctors: true,
            adminUsers: true,
            appointments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    const facilitiesWithCounts = facilities.map(facility => ({
      ...facility,
      doctorCount: facility.doctors.length,
      labTechCount: facility.labTechs.length,
      adminCount: facility.adminUsers.length
    }));

    return res.json({ success: true, data: facilitiesWithCounts });
  } catch (error: any) {
    console.error('Error fetching facilities:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new facility (hospital/clinic)
export const createFacility = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    const regionAdminId = req.user?.regionAdminId;
    
    if (!region || !regionAdminId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { name, code, address, phone, email, type, operatingHours, status } = req.body;

    // Validate required fields
    if (!name || !code || !address || !phone || !email || !type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, code, address, phone, email, type' 
      });
    }

    // Check if code already exists
    const existing = await prisma.hospital.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Hospital code already exists' });
    }

    // Create facility
    const facility = await prisma.hospital.create({
      data: {
        name,
        code,
        address,
        phone,
        email,
        region, // Use region admin's region
        type,
        operatingHours: operatingHours || {},
        status: status || 'active',
        regionAdminId,
        createdBy: req.user?.id
      }
    });

    return res.status(201).json({ success: true, data: facility });
  } catch (error: any) {
    console.error('Error creating facility:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update a facility
export const updateFacility = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const region = req.user?.region;
    
    // Verify the facility belongs to this region
    const facility = await prisma.hospital.findUnique({ where: { id } });
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }
    
    if (facility.region !== region) {
      return res.status(403).json({ success: false, error: 'Unauthorized to update this facility' });
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: {
        ...req.body,
        region, // Ensure region doesn't change
        updatedBy: req.user?.id
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating facility:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a facility
export const deleteFacility = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const region = req.user?.region;
    
    const facility = await prisma.hospital.findUnique({ where: { id } });
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }
    
    if (facility.region !== region) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await prisma.hospital.delete({ where: { id } });
    return res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting facility:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get all pharmacies in the region
export const getPharmacies = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    if (!region) {
      return res.status(403).json({ success: false, error: 'Region not found' });
    }

    const pharmacies = await prisma.pharmacy.findMany({
      where: { region },
      include: {
        pharmacists: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const pharmaciesWithCounts = pharmacies.map(pharmacy => ({
      ...pharmacy,
      pharmacistCount: pharmacy.pharmacists.length
    }));

    return res.json({ success: true, data: pharmaciesWithCounts });
  } catch (error: any) {
    console.error('Error fetching pharmacies:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new pharmacy
export const createPharmacy = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    const regionAdminId = req.user?.regionAdminId;
    
    if (!region || !regionAdminId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { name, code, address, phone, email, licenseNumber, type, status } = req.body;

    if (!name || !code || !address || !phone || !email || !licenseNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, code, address, phone, email, licenseNumber' 
      });
    }

    // Check for duplicates
    const existingCode = await prisma.pharmacy.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ success: false, error: 'Pharmacy code already exists' });
    }

    const existingLicense = await prisma.pharmacy.findUnique({ where: { licenseNumber } });
    if (existingLicense) {
      return res.status(400).json({ success: false, error: 'License number already exists' });
    }

    const pharmacy = await prisma.pharmacy.create({
      data: {
        name,
        code,
        address,
        phone,
        email,
        region,
        licenseNumber,
        type: type || 'public',
        status: status || 'active',
        regionAdminId,
        createdBy: req.user?.id
      }
    });

    return res.status(201).json({ success: true, data: pharmacy });
  } catch (error: any) {
    console.error('Error creating pharmacy:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update a pharmacy
export const updatePharmacy = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const region = req.user?.region;
    
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) {
      return res.status(404).json({ success: false, error: 'Pharmacy not found' });
    }
    
    if (pharmacy.region !== region) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const updated = await prisma.pharmacy.update({
      where: { id },
      data: {
        ...req.body,
        region, // Ensure region doesn't change
        updatedBy: req.user?.id
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating pharmacy:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a pharmacy
export const deletePharmacy = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const region = req.user?.region;
    
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) {
      return res.status(404).json({ success: false, error: 'Pharmacy not found' });
    }
    
    if (pharmacy.region !== region) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await prisma.pharmacy.delete({ where: { id } });
    return res.json({ success: true, message: 'Pharmacy deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting pharmacy:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get hospital admins in the region
export const getHospitalAdmins = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    if (!region) {
      return res.status(403).json({ success: false, error: 'Region not found' });
    }

    const admins = await prisma.adminUser.findMany({
      where: {
        hospital: { region }
      },
      include: {
        user: {
          select: {
            nationalId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            lastLogin: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: admins });
  } catch (error: any) {
    console.error('Error fetching hospital admins:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Update a hospital admin
export const updateHospitalAdmin = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const region = req.user?.region;
    
    if (!region) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { firstName, lastName, email, phone, isActive, permissions } = req.body;

    // Find the admin and verify it belongs to this region
    const admin = await prisma.adminUser.findUnique({
      where: { id },
      include: {
        hospital: { select: { region: true } },
        user: { select: { id: true, email: true, phone: true } }
      }
    });

    if (!admin || admin.hospital?.region !== region) {
      return res.status(404).json({ success: false, error: 'Admin not found in your region' });
    }

    // Check for email/phone conflicts (excluding current user)
    if (email || phone) {
      const existing = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: admin.user.id } },
            {
              OR: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : [])
              ]
            }
          ]
        }
      });

      if (existing) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email or phone already exists for another user' 
        });
      }
    }

    // Update user and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user details
      const updatedUser = await tx.user.update({
        where: { id: admin.user.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(typeof isActive === 'boolean' && { isActive })
        }
      });

      // Update admin permissions
      const updatedAdmin = await tx.adminUser.update({
        where: { id },
        data: {
          ...(permissions && { permissions })
        },
        include: {
          user: {
            select: {
              nationalId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
              createdAt: true,
              lastLogin: true
            }
          },
          hospital: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      return updatedAdmin;
    });

    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error updating hospital admin:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Create a hospital admin
export const createHospitalAdmin = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    const regionAdminId = req.user?.regionAdminId;
    
    if (!region || !regionAdminId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { 
      nationalId, firstName, lastName, email, phone, password, 
      hospitalId, role, permissions 
    } = req.body;

    // Validate required fields
    if (!nationalId || !firstName || !lastName || !email || !phone || !password || !hospitalId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Verify hospital belongs to this region
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital || hospital.region !== region) {
      return res.status(403).json({ 
        success: false, 
        error: 'Hospital not found in your region' 
      });
    }

    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { nationalId },
          { email },
          { phone }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this national ID, email, or phone already exists' 
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nationalId,
          firstName,
          lastName,
          email,
          phone,
          password: hashedPassword,
          role: 'hospital_admin',
          isActive: true
        }
      });

      const admin = await tx.adminUser.create({
        data: {
          userId: user.id,
          hospitalId,
          regionAdminId,
          role: role || 'hospital_admin',
          permissions: permissions || []
        },
        include: {
          user: {
            select: {
              nationalId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
              createdAt: true,
              lastLogin: true
            }
          },
          hospital: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      return admin;
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating hospital admin:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get activity logs for the region
export const getActivityLogs = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    if (!region) {
      return res.status(403).json({ success: false, error: 'Region not found' });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get all activity logs related to the region
    // Note: This is a simplified version. In production, you'd want to add region field to AuditLog
    const logs = await prisma.auditLog.findMany({
      take: Number(limit),
      skip,
      orderBy: { timestamp: 'desc' }
    });

    const total = await prisma.auditLog.count();

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Generate regional report (aggregated, no individual patient data)
export const generateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const region = req.user?.region;
    if (!region) {
      return res.status(403).json({ success: false, error: 'Region not found' });
    }

    const { reportType = 'monthly' } = req.query;

    // Calculate date range based on report type
    const now = new Date();
    let startDate: Date = new Date(now.getFullYear(), now.getMonth(), 1); // Default to monthly
    
    switch (reportType) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'annual':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // 1. Patient Statistics (aggregated only - NO individual data)
    const totalPatients = await prisma.patient.count({ where: { region } });
    const newPatients = await prisma.patient.count({
      where: { region, createdAt: { gte: startDate } }
    });

    // 2. Demographics (aggregated)
    const patients = await prisma.patient.findMany({
      where: { region },
      select: { gender: true, dateOfBirth: true, city: true }
    });

    const genderDistribution = patients.reduce((acc, p) => {
      acc[p.gender] = (acc[p.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ageDistribution = patients.reduce((acc, p) => {
      const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
      let range = '65+';
      if (age < 19) range = '0-18';
      else if (age < 36) range = '19-35';
      else if (age < 51) range = '36-50';
      else if (age < 66) range = '51-65';
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationDistribution = patients.reduce((acc, p) => {
      const existing = acc.find(item => item.city === p.city);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ city: p.city, count: 1 });
      }
      return acc;
    }, [] as Array<{ city: string; count: number }>);

    // 3. Facility Performance
    const facilities = await prisma.hospital.findMany({
      where: { region },
      include: {
        appointments: {
          where: { scheduledTime: { gte: startDate } },
          select: { status: true }
        }
      }
    });

    const facilityPerformance = facilities.map(facility => ({
      facilityName: facility.name,
      totalAppointments: facility.appointments.length,
      completedAppointments: facility.appointments.filter(a => a.status === 'completed').length,
      canceledAppointments: facility.appointments.filter(a => a.status === 'cancelled').length,
      averageWaitTime: 0 // TODO: Calculate from appointment data
    }));

    // 4. Service Utilization
    const totalAppointments = await prisma.appointment.count({
      where: { hospital: { region }, scheduledTime: { gte: startDate } }
    });

    const appointmentsByType = await prisma.appointment.groupBy({
      by: ['type'],
      where: { hospital: { region }, scheduledTime: { gte: startDate } },
      _count: true
    });

    const labTestsOrdered = await prisma.labRequest.count({
      where: { patient: { region }, requestedAt: { gte: startDate } }
    });

    const prescriptionsIssued = await prisma.prescription.count({
      where: { patient: { region }, issuedAt: { gte: startDate } }
    });

    // 5. Pharmacy Statistics
    const totalPharmacies = await prisma.pharmacy.count({ where: { region } });
    const activePharmacies = await prisma.pharmacy.count({ 
      where: { region, status: 'active' } 
    });

    // 6. Staff Productivity
    const totalDoctors = await prisma.doctor.count({
      where: { hospital: { region } }
    });
    const totalLabTechs = await prisma.labTech.count({
      where: { hospital: { region } }
    });
    const totalPharmacists = await prisma.pharmacist.count({
      where: { pharmacy: { region } }
    });

    const report = {
      metadata: {
        region,
        generatedAt: new Date(),
        reportType,
        generatedBy: req.user?.id
      },
      patientStats: {
        totalPatients,
        newPatientsThisMonth: newPatients,
        activePatients: totalPatients, // TODO: Define active criteria
        patientGrowthRate: newPatients > 0 ? ((newPatients / totalPatients) * 100).toFixed(2) : 0,
        averageVisitsPerPatient: 0, // TODO: Calculate
        patientsByFacility: [] // TODO: Group by facility
      },
      demographics: {
        ageDistribution,
        genderDistribution,
        locationDistribution,
        averageAge: patients.reduce((sum, p) => {
          return sum + (new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear());
        }, 0) / patients.length || 0
      },
      facilityPerformance,
      serviceUtilization: {
        totalAppointments,
        appointmentsByType: appointmentsByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        labTestsOrdered,
        prescriptionsIssued
      },
      pharmacyStats: {
        totalPharmacies,
        activePharmacies,
        totalPrescriptionsDispensed: prescriptionsIssued,
        topMedicationsDispensed: [] // TODO: Calculate from prescription data
      },
      staffProductivity: {
        totalDoctors,
        totalLabTechs,
        totalPharmacists,
        averagePatientsPerDoctor: totalDoctors > 0 ? Math.round(totalPatients / totalDoctors) : 0
      }
    };

    return res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get all pharmacists in the region
export const getPharmacists = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    if (!region) {
      return res.status(403).json({ success: false, error: 'Region not found' });
    }

    // Get all pharmacies in the region
    const pharmacies = await prisma.pharmacy.findMany({
      where: { region },
      select: { id: true }
    });

    const pharmacyIds = pharmacies.map(pharmacy => pharmacy.id);

    // Get all pharmacists in those pharmacies
    const pharmacists = await prisma.pharmacist.findMany({
      where: {
        pharmacyId: {
          in: pharmacyIds
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true
          }
        },
        pharmacy: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: pharmacists });
  } catch (error: any) {
    console.error('Error fetching pharmacists:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Add pharmacist to pharmacy (Note: This should be done by pharmacy, but we'll include it for completeness)
export const addPharmacist = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const region = req.user?.region;
    const regionAdminId = req.user?.regionAdminId;
    
    if (!region || !regionAdminId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { 
      nationalId, firstName, lastName, email, phone, password, 
      pharmacyId, licenseNumber
    } = req.body;

    // Validate required fields
    if (!nationalId || !firstName || !lastName || !email || !phone || !password || !pharmacyId || !licenseNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Verify pharmacy belongs to this region
    const pharmacy = await prisma.pharmacy.findUnique({ 
      where: { id: pharmacyId } 
    });
    
    if (!pharmacy || pharmacy.region !== region) {
      return res.status(403).json({ 
        success: false, 
        error: 'Pharmacy not found in your region' 
      });
    }

    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { nationalId },
          { email },
          { phone }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this national ID, email or phone already exists' 
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and pharmacist in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nationalId,
          firstName,
          lastName,
          email,
          phone,
          password: hashedPassword,
          role: 'pharmacist',
          isActive: true
        }
      });

      const pharmacist = await tx.pharmacist.create({
        data: {
          userId: user.id,
          pharmacyId,
          licenseNumber
        }
      });

      return { user, pharmacist };
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating pharmacist:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};