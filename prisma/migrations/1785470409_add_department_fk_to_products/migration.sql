-- Step 1: Add departmentId column to Product
ALTER TABLE "Product" ADD COLUMN "departmentId" TEXT;

-- Step 2: Create index on departmentId
CREATE INDEX "Product_departmentId_idx" ON "Product"("departmentId");

-- Step 3: Map existing department strings to Department IDs
-- First, ensure all department names that exist in Product have corresponding Department entries
INSERT INTO "Department" (id, name, icon, color, "parentId", "createdAt")
SELECT
  gen_random_uuid()::text,
  p.department,
  'Folder',
  '#3b82f6',
  NULL,
  NOW()
FROM (
  SELECT DISTINCT department FROM "Product"
  WHERE department IS NOT NULL AND department != ''
) p
WHERE NOT EXISTS (
  SELECT 1 FROM "Department" d WHERE d.name = p.department
)
ON CONFLICT DO NOTHING;

-- Step 4: Update Product.departmentId to match Department.id
UPDATE "Product" p
SET "departmentId" = d.id
FROM "Department" d
WHERE d.name = p.department
  AND p."departmentId" IS NULL
  AND p.department IS NOT NULL
  AND p.department != '';

-- Step 5: Add foreign key constraint
ALTER TABLE "Product" ADD CONSTRAINT "Product_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL;
