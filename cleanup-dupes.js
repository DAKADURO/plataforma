// Script para eliminar propuestas duplicadas del DB
// Conserva la más antigua de cada grupo duplicado (mismo título + clientId)
// y elimina las copias más nuevas.

const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    // Ver los duplicados primero
    const dupsRes = await client.query(`
      SELECT title, "clientId", COUNT(*) as count, ARRAY_AGG(id ORDER BY "createdAt" ASC) as ids
      FROM "Proposal"
      GROUP BY title, "clientId"
      HAVING COUNT(*) > 1
    `);

    if (dupsRes.rows.length === 0) {
      console.log('✅ No hay propuestas duplicadas.');
      return;
    }

    console.log(`⚠️  Encontrados ${dupsRes.rows.length} grupos con duplicados:\n`);

    for (const row of dupsRes.rows) {
      console.log(`  - "${row.title}" (${row.count} copias) → IDs: ${row.ids.join(', ')}`);
    }

    // Confirmar eliminación
    console.log('\n🗑️  Eliminando duplicados (conservando el más antiguo de cada grupo)...\n');

    let totalDeleted = 0;
    for (const row of dupsRes.rows) {
      // El primer ID es el más antiguo (conservar), el resto se eliminan
      const [keep, ...toDelete] = row.ids;

      for (const id of toDelete) {
        // Borrar en cascada: fotos, documentos, materiales, luego la propuesta
        await client.query(`DELETE FROM "ProposalPhoto" WHERE "proposalId" = $1`, [id]);
        await client.query(`DELETE FROM "ProposalDocument" WHERE "proposalId" = $1`, [id]);
        await client.query(`DELETE FROM "ProposalMaterial" WHERE "proposalId" = $1`, [id]);
        await client.query(`DELETE FROM "Proposal" WHERE id = $1`, [id]);
        console.log(`  ✓ Eliminada propuesta duplicada ID: ${id} (conservando: ${keep})`);
        totalDeleted++;
      }
    }

    console.log(`\n✅ Listo. ${totalDeleted} propuestas duplicadas eliminadas.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
