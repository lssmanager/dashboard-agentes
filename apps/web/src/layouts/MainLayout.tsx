import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { NavRail } from '../components/NavRail';
import { ContextPanel } from '../components/ContextPanel';
import { Header } from '../components/Header';
import { useHierarchy } from '../lib/HierarchyContext';
import { SCOPE_VIEW_REGISTRY } from '../lib/ScopeViewRegistry';
import { buildStudioHref, parseBuilderTab, parseNodeQuery, surfaceFromPath } from '../lib/studioRouting';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : true,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setSurface, setBuilderTab, selectByKey, tree, selectedKey, selectedBuilderTab, selectedLevel } = useHierarchy();

  const isDesktop = useMediaQuery('(min-width: 1120px)');
  const isMobile = !useMediaQuery('(min-width: 769px)');
  const isAdministration = ['/administration', '/agency-builder'].some((route) => location.pathname.startsWith(route));
  const isStudioEnvironment = location.pathname.startsWith('/workspace-studio');
  const canOpenStudio = SCOPE_VIEW_REGISTRY[selectedLevel].canEnterStudio;
  const showContext = isDesktop && (isAdministration || isStudioEnvironment || location.pathname.startsWith('/entity-editor'));
  const isStudioSurface = ['/workspace-studio', '/administration', '/agency-builder', '/entity-editor', '/runs', '/sessions', '/settings', '/profiles'].some((route) =>
    location.pathname.startsWith(route),
  );

  const contentColumn = isMobile ? '1' : showContext ? '3' : '2';
  const mainPadding = isStudioSurface ? '14px 14px 18px' : '20px 22px 28px';

  useEffect(() => {
    setSurface(surfaceFromPath(location.pathname));
  }, [location.pathname, setSurface]);

  useEffect(() => {
    if (!location.pathname.startsWith('/agency-builder') && !location.pathname.startsWith('/administration')) return;
    const tab = parseBuilderTab(location.search);
    if (tab) setBuilderTab(tab);
  }, [location.pathname, location.search, setBuilderTab]);

  useEffect(() => {
    const nodeKey = parseNodeQuery(location.search);
    if (!nodeKey) return;
    if (!tree.nodes[nodeKey]) return;
    selectByKey(nodeKey);
  }, [location.search, selectByKey, tree.nodes]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : showContext ? '88px 280px 1fr' : '88px 1fr',
        gridTemplateRows: '72px 1fr',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
      }}
    >
      {!isMobile && (
        <div style={{ gridColumn: '1', gridRow: '1 / -1', zIndex: 30 }}>
          <NavRail />
        </div>
      )}

      {showContext && (
        <div style={{ gridColumn: '2', gridRow: '1 / -1', overflow: 'hidden' }}>
          <ContextPanel />
        </div>
      )}

      <header
        style={{
          gridColumn: contentColumn,
          gridRow: '1',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          background: 'var(--shell-topbar-bg)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--shell-panel-border)',
        }}
      >
        <Header onToggleSidebar={() => setMobileOpen((open) => !open)} showHamburger={isMobile} />
      </header>

      <main
        style={{
          gridColumn: contentColumn,
          gridRow: '2',
          overflow: 'auto',
          padding: mainPadding,
          background: 'var(--shell-content-bg)',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <div style={{ display: 'inline-flex', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() =>
                navigate(
                  buildStudioHref({
                    surface: 'agency-builder',
                    tab: selectedBuilderTab,
                    nodeKey: selectedKey,
                  }),
                )
              }
              style={{
                border: 'none',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                background: isAdministration ? 'var(--color-primary-soft)' : 'var(--bg-secondary)',
                color: isAdministration ? 'var(--color-primary)' : 'var(--text-muted)',
              }}
            >
              Administration
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  buildStudioHref({
                    surface: 'workspace-studio',
                    nodeKey: selectedKey,
                  }),
                )
              }
              disabled={!canOpenStudio}
              style={{
                border: 'none',
                borderLeft: '1px solid var(--border-primary)',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: canOpenStudio ? 'pointer' : 'not-allowed',
                background: isStudioEnvironment ? 'var(--color-primary-soft)' : 'var(--bg-secondary)',
                color: isStudioEnvironment ? 'var(--color-primary)' : 'var(--text-muted)',
                opacity: canOpenStudio ? 1 : 0.65,
              }}
            >
              Studio
            </button>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Active scope level: {selectedLevel}
          </span>
        </div>
        <Outlet />
      </main>

      {isMobile && mobileOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,23,0.55)', zIndex: 49 }}
            onClick={() => setMobileOpen(false)}
          />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50 }}>
            <NavRail onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

