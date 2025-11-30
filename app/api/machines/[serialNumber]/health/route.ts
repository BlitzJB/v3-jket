import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WarrantyHelper } from '@/lib/warranty-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serialNumber: string }> }
) {
  try {
    const { serialNumber } = await params
    
    const machine = await prisma.machine.findFirst({
      where: { serialNumber },
      include: {
        sale: true,
        machineModel: true,
        serviceRequests: {
          include: {
            serviceVisit: true
          }
        }
      }
    })
    
    if (!machine) {
      return NextResponse.json(
        { error: 'Machine not found' },
        { status: 404 }
      )
    }
    
    const healthScore = WarrantyHelper.getHealthScore(machine)
    const riskLevel = WarrantyHelper.getRiskLevel(healthScore)
    const nextServiceDue = WarrantyHelper.getNextServiceDue(machine)
    const totalSavings = WarrantyHelper.getTotalSavings(machine)
    const warrantyActive = WarrantyHelper.isWarrantyActive(machine)
    const warrantyExpiry = WarrantyHelper.getWarrantyExpiryDate(machine)
    
    return NextResponse.json({
      healthScore,
      riskLevel,
      nextServiceDue,
      totalSavings,
      warrantyActive,
      warrantyExpiry
    })
  } catch (error) {
    console.error('Error calculating health score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    )
  }
}