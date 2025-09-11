import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { machineId, actionType, channel, metadata } = await request.json()

    // Validate required fields
    if (!machineId || !actionType || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: machineId, actionType, channel' },
        { status: 400 }
      )
    }

    // Validate actionType
    const validActionTypes = ['REMINDER_SENT', 'SERVICE_SCHEDULED', 'WARRANTY_VIEWED', 'EMAIL_OPENED', 'LINK_CLICKED']
    if (!validActionTypes.includes(actionType)) {
      return NextResponse.json(
        { error: `Invalid actionType. Must be one of: ${validActionTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate channel
    const validChannels = ['EMAIL', 'WHATSAPP', 'WEB', 'SMS', 'SYSTEM']
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Must be one of: ${validChannels.join(', ')}` },
        { status: 400 }
      )
    }

    // Create action log entry
    const actionLog = await prisma.actionLog.create({
      data: {
        machineId,
        actionType,
        channel,
        metadata: metadata || {}
      }
    })

    return NextResponse.json({
      success: true,
      actionLog: {
        id: actionLog.id,
        machineId: actionLog.machineId,
        actionType: actionLog.actionType,
        channel: actionLog.channel,
        createdAt: actionLog.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating action log:', error)
    return NextResponse.json(
      { error: 'Failed to create action log' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const machineId = searchParams.get('machineId')
    const actionType = searchParams.get('actionType')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (machineId) where.machineId = machineId
    if (actionType) where.actionType = actionType

    const actionLogs = await prisma.actionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100) // Max 100 entries
    })

    return NextResponse.json({
      success: true,
      actionLogs,
      count: actionLogs.length
    })

  } catch (error) {
    console.error('Error fetching action logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action logs' },
      { status: 500 }
    )
  }
}