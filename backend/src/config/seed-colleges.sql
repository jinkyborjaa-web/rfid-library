-- Seed the managed college and course catalog
INSERT INTO colleges (name) VALUES
    ('College of Engineering'),
    ('College of Computer Studies'),
    ('College of Technology'),
    ('College of Hospitality Management'),
    ('College of Tourism'),
    ('Business / Management'),
    ('Arts & Communication'),
    ('Criminology'),
    ('College of Education')
ON CONFLICT (name) DO NOTHING;

INSERT INTO courses (college_id, name)
SELECT c.college_id, course.name
FROM colleges c
JOIN (VALUES
    ('College of Engineering', 'BSCE'),
    ('College of Computer Studies', 'BSIT (Information Technology)'),
    ('College of Technology', 'BSIT (Industrial Technology - Civil)'),
    ('College of Technology', 'BSIT (Industrial Technology - Food)'),
    ('College of Technology', 'BSIT (Industrial Technology - Automotive)'),
    ('College of Technology', 'BSIT (Industrial Technology - Cosmetology)'),
    ('College of Technology', 'BSIT (Industrial Technology - Electronics)'),
    ('College of Technology', 'BSIT (Industrial Technology - Drafting)'),
    ('College of Technology', 'BSIT (Industrial Technology - Electrical)'),
    ('College of Technology', 'BSIT (Industrial Technology - Garments)'),
    ('College of Technology', 'BOT (Civil Engineering Technology)'),
    ('College of Technology', 'BOT (Electronics Engineering Technology)'),
    ('College of Technology', 'BOT (Computer Engineering Technology)'),
    ('College of Hospitality Management', 'BSHM'),
    ('College of Tourism', 'BSTM'),
    ('Business / Management', 'BSE'),
    ('Business / Management', 'BSBA (Financial Management)'),
    ('Business / Management', 'BSAIS'),
    ('Arts & Communication', 'BAC'),
    ('Criminology', 'BSC'),
    ('College of Education', 'BSEd - English'),
    ('College of Education', 'BSEd - Social Studies'),
    ('College of Education', 'BSEd - Filipino'),
    ('College of Education', 'BEED'),
    ('College of Education', 'BTVTED - Welding & Fabrication Technology'),
    ('College of Education', 'BTVTED - Civil & Construction Technology'),
    ('College of Education', 'BTVTED - Electrical Technology'),
    ('College of Education', 'BTVTED - Electronics Technology'),
    ('College of Education', 'BTVTED - Food & Service Management'),
    ('College of Education', 'BTVTED - Drafting Technology')
) AS course(college_name, name) ON course.college_name = c.name
ON CONFLICT (college_id, name) DO NOTHING;