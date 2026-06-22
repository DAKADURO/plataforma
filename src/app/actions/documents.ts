'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addDocumentVersion(data: {
  projectId: string;
  name: string;
  type: string;
  url: string;
  notes?: string;
  uploadedBy: string;
}) {
  try {
    let document = await prisma.document.findFirst({
      where: {
        projectId: data.projectId,
        name: data.name
      },
      include: {
        versions: true
      }
    })

    if (!document) {
      document = await prisma.document.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          type: data.type,
          versions: {
            create: {
              version: 1,
              url: data.url,
              notes: data.notes,
              uploadedBy: data.uploadedBy
            }
          }
        },
        include: { versions: true }
      })
    } else {
      const lastVersion = document.versions.reduce((max, v) => v.version > max ? v.version : max, 0)
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          version: lastVersion + 1,
          url: data.url,
          notes: data.notes,
          uploadedBy: data.uploadedBy
        }
      })
    }

    revalidatePath(`/proyectos/${data.projectId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
