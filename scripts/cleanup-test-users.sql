-- Clean up test users from database
DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email IN (
    'testowner@example.com',
    'testowner2@example.com',
    'testowner3@example.com',
    'testowner4@example.com',
    'testowner5@example.com',
    'testfinal@example.com',
    'testretry@example.com'
  )
);

DELETE FROM properties WHERE landlord_id IN (
  SELECT id FROM auth.users WHERE email IN (
    'testowner@example.com',
    'testowner2@example.com',
    'testowner3@example.com',
    'testowner4@example.com',
    'testowner5@example.com',
    'testfinal@example.com',
    'testretry@example.com'
  )
);

-- Also clean up auth.users
DELETE FROM auth.users WHERE email IN (
  'testowner@example.com',
  'testowner2@example.com',
  'testowner3@example.com',
  'testowner4@example.com',
  'testowner5@example.com',
  'testfinal@example.com',
  'testretry@example.com'
);