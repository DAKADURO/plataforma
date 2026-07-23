'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

// Shared by getInventoryStats/getDepartmentStats/getReorderingMetrics so the reports
// page doesn't scan the whole Product+Inventory table three times per load.
function getProductsForReports() {
  return prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      department: true,
      stock: true,
      cost: true,
      minStock: true,
      inventory: { select: { type: true, quantity: true, date: true } },
      alerts: { where: { status: { in: ['ACTIVE', 'ACKNOWLEDGED'] } }, select: { id: true, status: true } }
    }
  })
}

export async function getInventoryStats() {
  try {
    await requireRole(ACTIVE_ROLES)

    const products = await getProductsForReports()

    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0)
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length
    const activeAlerts = await prisma.reorderAlert.count({ where: { status: 'ACTIVE' } })

    const movementCount = await prisma.inventory.count()

    return {
      success: true,
      stats: {
        totalProducts: products.length,
        totalInventoryValue: totalValue,
        lowStockCount,
        activeAlerts,
        totalMovements: movementCount,
        avgStockValue: products.length > 0 ? totalValue / products.length : 0
      }
    }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener estadísticas.', stats: {} }
  }
}

export async function getMovementReport(dateRange?: { from: Date; to: Date }) {
  try {
    await requireRole(ACTIVE_ROLES)

    const query: any = {}
    if (dateRange) {
      query.date = {
        gte: dateRange.from,
        lte: dateRange.to
      }
    }

    const movements = await prisma.inventory.findMany({
      where: query,
      include: { product: true, project: true },
      orderBy: { date: 'desc' }
    })

    const byType = { ENTRADA: 0, SALIDA: 0 }
    const byDepartment: Record<string, number> = {}
    const topItems: Record<string, number> = {}

    movements.forEach(m => {
      byType[m.type as keyof typeof byType]++
      const dept = m.product.department
      byDepartment[dept] = (byDepartment[dept] || 0) + 1

      const key = m.product.name
      topItems[key] = (topItems[key] || 0) + m.quantity
    })

    const sortedTopItems = Object.entries(topItems)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, qty]) => ({ name, quantity: qty }))

    return {
      success: true,
      report: {
        totalMovements: movements.length,
        byType,
        byDepartment,
        topItems: sortedTopItems,
        dateRange
      }
    }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener reporte.', report: {} }
  }
}

export async function getStockHistory(productId: string, days: number = 30) {
  try {
    await requireRole(ACTIVE_ROLES)

    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Producto no encontrado')

    // Reconstruct stock levels over time
    let currentStock = product.stock
    const history = []

    // Get all movements (needed to compute the accurate starting stock for the period)
    const allMovements = await prisma.inventory.findMany({
      where: { productId },
      orderBy: { date: 'asc' }
    })

    // Calculate stock at beginning of period
    let startStock = product.stock
    const periodMovements = allMovements.filter(m => m.date >= fromDate)
    periodMovements.forEach(m => {
      const change = m.type === 'ENTRADA' ? m.quantity : -m.quantity
      startStock -= change
    })

    currentStock = startStock
    let lastDate = null

    for (const movement of periodMovements) {
      if (lastDate && lastDate.toDateString() !== movement.date.toDateString()) {
        history.push({
          date: lastDate,
          stock: currentStock
        })
      }

      const change = movement.type === 'ENTRADA' ? movement.quantity : -movement.quantity
      currentStock += change
      lastDate = movement.date
    }

    if (lastDate) {
      history.push({
        date: lastDate,
        stock: currentStock
      })
    }

    return {
      success: true,
      history: {
        productId,
        productName: product.name,
        currentStock: product.stock,
        minStock: product.minStock,
        history
      }
    }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener historial.', history: {} }
  }
}

export async function getDepartmentStats() {
  try {
    await requireRole(ACTIVE_ROLES)

    const products = await getProductsForReports()

    const departmentStats: Record<string, {
      itemCount: number;
      totalValue: number;
      movementCount: number;
      lowStockCount: number;
    }> = {}

    const DEPARTMENTS = ['General', 'HVAC', 'Eléctrico', 'Plomería', 'Civil', 'Sistemas']

    DEPARTMENTS.forEach(dept => {
      departmentStats[dept] = {
        itemCount: 0,
        totalValue: 0,
        movementCount: 0,
        lowStockCount: 0
      }
    })

    products.forEach(p => {
      const dept = p.department || 'General'
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          itemCount: 0,
          totalValue: 0,
          movementCount: 0,
          lowStockCount: 0
        }
      }

      departmentStats[dept].itemCount++
      departmentStats[dept].totalValue += p.stock * p.cost
      departmentStats[dept].movementCount += p.inventory.length
      if (p.stock <= p.minStock) {
        departmentStats[dept].lowStockCount++
      }
    })

    return {
      success: true,
      stats: departmentStats
    }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener estadísticas.', stats: {} }
  }
}

export async function getReorderingMetrics() {
  try {
    await requireRole(ACTIVE_ROLES)

    const products = await getProductsForReports()

    const frequentlyReordered = products
      .filter(p => p.inventory.some(m => m.type === 'ENTRADA'))
      .map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        reorderCount: p.inventory.filter(m => m.type === 'ENTRADA').length,
        lastReorder: p.inventory.filter(m => m.type === 'ENTRADA').sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.date,
        currentStock: p.stock,
        minStock: p.minStock,
        hasAlert: p.alerts.length > 0
      }))
      .sort((a, b) => b.reorderCount - a.reorderCount)
      .slice(0, 10)

    const deadStock = products
      .filter(p => p.inventory.length === 0 && p.stock > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        value: p.stock * p.cost
      }))

    const neverReordered = products
      .filter(p => !p.inventory.some(m => m.type === 'ENTRADA') && p.stock > 0)
      .length

    return {
      success: true,
      metrics: {
        frequentlyReordered,
        deadStockCount: deadStock.length,
        deadStockValue: deadStock.reduce((sum, p) => sum + p.value, 0),
        deadStock,
        neverReorderedCount: neverReordered
      }
    }
  } catch (error) {
    return { success: false, error: 'No se pudo obtener métricas.', metrics: {} }
  }
}
