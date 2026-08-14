-- Replace placeholder module_type values with the confirmed set.
DELETE FROM "enum" WHERE category = 'module_type';

INSERT INTO "enum" (category, value, sort_order) VALUES
('module_type', 'Research Paper', 1),
('module_type', 'Grant Submission', 2),
('module_type', 'Presentation', 3),
('module_type', 'Development', 4)
ON CONFLICT (category, value) DO NOTHING;
