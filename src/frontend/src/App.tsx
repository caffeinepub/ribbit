import { useEffect } from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PondPage from './pages/PondPage';
import PondAboutPage from './pages/PondAboutPage';
import LilyPage from './pages/LilyPage';
import AllPondsPage from './pages/AllPondsPage';
import CreatePondPage from './pages/CreatePondPage';
import CreateLilyPage from './pages/CreateLilyPage';
import UserSettingsPage from './pages/UserSettingsPage';
import AboutPage from './pages/AboutPage';
import TagPage from './pages/TagPage';
import SavedLiliesPage from './pages/SavedLiliesPage';
import TagHubPage from './pages/TagHubPage';
import FrogProfilePage from './pages/FrogProfilePage';
import { ensureDefaultFroggyPhrase } from './lib/user';
import { useInitializeFroggyPhraseAccessControl } from './hooks/useInitializeFroggyPhraseAccessControl';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const pondRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pond/$name',
  component: PondPage,
});

const pondAboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pond/$name/about',
  component: PondAboutPage,
});

const lilyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lily/$id',
  component: LilyPage,
});

const allPondsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ponds',
  component: AllPondsPage,
});

const createPondRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/start-pond',
  component: CreatePondPage,
});

const createLilyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create-lily',
  component: CreateLilyPage,
});

const userSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: UserSettingsPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
});

const tagRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tag/$tag',
  component: TagPage,
});

const savedLiliesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/saved',
  component: SavedLiliesPage,
});

const tagHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tags',
  component: TagHubPage,
});

const frogProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/f/$username',
  component: FrogProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  pondRoute,
  pondAboutRoute,
  lilyRoute,
  allPondsRoute,
  createPondRoute,
  createLilyRoute,
  userSettingsRoute,
  aboutRoute,
  tagRoute,
  savedLiliesRoute,
  tagHubRoute,
  frogProfileRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  // Ensure Froggy Phrase is auto-generated on app mount
  useEffect(() => {
    ensureDefaultFroggyPhrase();
  }, []);

  // Initialize Froggy Phrase access control once actor is available
  useInitializeFroggyPhraseAccessControl();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
