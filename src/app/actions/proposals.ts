'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

const ACTIVE_ROLES = ['ADMIN', 'GERENTE', 'TECNICO']

type ProposalInput = {
  clientId: string
  title: string
  description?: string
  amount?: number
  status?: string
}

type MaterialInput = {
  name: string
  category?: string
  quantity?: number
  unitPrice?: number
}

export async function getProposals() {
  await requireRole(ACTIVE_ROLES)
  return await prisma.proposal.findMany({
    include: {
      client: { select: { id: true, name: true } },
      photos: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      materials: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createProposal(data: ProposalInput) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.proposal.create({ data })
    revalidatePath('/propuestas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo crear la propuesta.' }
  }
}

export async function updateProposal(id: string, data: Partial<ProposalInput>) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.proposal.update({ where: { id }, data })
    revalidatePath('/propuestas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo actualizar la propuesta.' }
  }
}

export async function deleteProposal(id: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.proposal.delete({ where: { id } })
    revalidatePath('/propuestas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo eliminar la propuesta.' }
  }
}

export async function addProposalPhoto(proposalId: string, url: string, caption?: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const photo = await prisma.proposalPhoto.create({ data: { proposalId, url, caption } })
    revalidatePath('/propuestas')
    return { success: true, photo }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo guardar la foto.' }
  }
}

export async function deleteProposalPhoto(photoId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.proposalPhoto.delete({ where: { id: photoId } })
    revalidatePath('/propuestas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo eliminar la foto.' }
  }
}

export async function addProposalDocument(proposalId: string, name: string, type: string, url: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const doc = await prisma.proposalDocument.create({ data: { proposalId, name, type, url } })
    revalidatePath('/propuestas')
    return { success: true, doc }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo guardar el documento.' }
  }
}

export async function deleteProposalDocument(docId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.proposalDocument.delete({ where: { id: docId } })
    revalidatePath('/propuestas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo eliminar el documento.' }
  }
}

export async function addProposalMaterial(proposalId: string, data: MaterialInput) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const mat = await prisma.proposalMaterial.create({
      data: {
        proposalId,
        name: data.name,
        category: data.category ?? 'General',
        quantity: data.quantity ?? 1,
        unitPrice: data.unitPrice ?? 0,
      }
    })
    revalidatePath('/propuestas')
    return { success: true, mat }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo agregar el material.' }
  }
}

export async function deleteProposalMaterial(materialId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    await prisma.proposalMaterial.delete({ where: { id: materialId } })
    revalidatePath('/propuestas')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo eliminar el material.' }
  }
}

export async function convertToProject(proposalId: string) {
  try {
    await requireRole(['ADMIN', 'GERENTE'])
    const proposal = await prisma.proposal.findUniqueOrThrow({ where: { id: proposalId } })
    await prisma.$transaction([
      prisma.project.create({
        data: {
          name: proposal.title,
          clientId: proposal.clientId,
        }
      }),
      prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'PROYECTO' }
      }),
    ])
    revalidatePath('/propuestas')
    revalidatePath('/proyectos')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.includes('permisos'))
      return { success: false, error: error.message }
    return { success: false, error: 'No se pudo convertir la propuesta en proyecto.' }
  }
}
