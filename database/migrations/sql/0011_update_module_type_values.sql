-- Replace only the original placeholder values so this remains safe when
-- confirmed module types are already referenced by application records.
DELETE FROM "enum"
WHERE category = 'module_type'
  AND value IN ('Research_paper', 'PPT', 'App');

INSERT INTO "enum" (category, value, sort_order) VALUES
('module_type', 'Research Paper', 1),
('module_type', 'Grant Submission', 2),
('module_type', 'Presentation', 3),
('module_type', 'Development', 4)
ON CONFLICT (category, value) DO NOTHING;
