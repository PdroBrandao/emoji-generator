'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createOrGetUser } from '../../lib/auth';

export default function UserInitializer() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      createOrGetUser(user.id);
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
