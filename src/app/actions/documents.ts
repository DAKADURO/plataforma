'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

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
      const lastVersion = document.versions.reduce((max, v) => v.version > max ? v.version : max, 0)
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          version: lastVersion + 1,
          url: data.url,
          notes: data.notes,
          uploadedBy // identidad resuelta en servidor
        }
      })
    }

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
