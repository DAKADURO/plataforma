'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { logAudit } from '@/lib/audit'

export async function addDocumentVersion(data: {
  projectId: string;
  name: string;
  type: string;
  url: string;
  folder?: string;
  notes?: string;
  // [SEC-FIX] uploadedBy ya NO se acepta del cliente — se resuelve en el servidor
}) {
  try {
    // [SEC-FIX #1] Verificar que el usuario tiene un rol válido (Broken Access Control)
    await requireRole(['ADMIN', 'GERENTE', 'TECNICO'])

    // [SEC-FIX #3] Resolver la identidad del autor desde la sesión del servidor
    // Nunca confiar en datos de identidad provenientes del cliente
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return { success: false, error: 'No se pudo verificar la identidad del usuario.' }
    }
    const uploadedBy = user.email

    let document = await prisma.document.findFirst({
      where: {
        projectId: data.projectId,
        name: data.name
      },
      include: {
        versions: true
      }
    })

    let versionNum = 1
    if (!document) {
      document = await prisma.document.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          type: data.type,
          folder: data.folder || 'General',
          versions: {
            create: {
              version: 1,
              url: data.url,
              notes: data.notes,
              uploadedBy // identidad resuelta en servidor
            }
          }
        },
        include: { versions: true }
      })
    } else {
      const lastVersion = document.versions.reduce((max: number, v: { version: number }) => v.version > max ? v.version : max, 0)
      versionNum = lastVersion + 1
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          version: versionNum,
          url: data.url,
          notes: data.notes,
          uploadedBy // identidad resuelta en servidor
        }
      })
    }

    await logAudit({
      action: 'UPLOAD_DOCUMENT',
      entity: 'Project',
      entityId: data.projectId,
      details: JSON.stringify({ documentName: data.name, version: versionNum })
    })

    revalidatePath(`/proyectos/${data.projectId}`)
    return { success: true }
  } catch (error) {
    // [SEC-FIX #5] Sanitizar mensajes de error para no exponer detalles internos
    if (error instanceof Error && error.message.includes('permisos')) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'No se pudo completar la operación. Intente de nuevo.' }
  }
}

