import { useAppSettingHelper } from '@affine/core/components/hooks/affine/use-app-setting-helper';
import { RootAppSidebar } from '@affine/core/components/root-app-sidebar';
import { AppSidebarService } from '@affine/core/modules/app-sidebar';
import {
  AppSidebarFallback,
  SidebarSwitch,
} from '@affine/core/modules/app-sidebar/views';
import { AppTabsHeader } from '@affine/core/modules/app-tabs-header';
import { NavigationButtons } from '@affine/core/modules/navigation';
import { WorkspaceService } from '@affine/core/modules/workspace';
import {
  useLiveData,
  useService,
  useServiceOptional,
} from '@toeverything/infra';
import clsx from 'clsx';
import {
  forwardRef,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import * as styles from './styles.css';

const isHaloDocsEmbedded =
  (
    globalThis as typeof globalThis & {
      __HALO_DOCS_COMPILED_PACKAGE__?: boolean;
    }
  ).__HALO_DOCS_COMPILED_PACKAGE__ === true;
const hasHaloDocsNav = () =>
  !!(globalThis as typeof globalThis & { __HALO_DOCS_NAV__?: HTMLElement })
    .__HALO_DOCS_NAV__;

export const AppContainer = ({
  children,
  className,
  fallback = false,
  ...rest
}: PropsWithChildren<{
  className?: string;
  fallback?: boolean;
}>) => {
  const { appSettings } = useAppSettingHelper();

  const noisyBackground =
    BUILD_CONFIG.isElectron && appSettings.enableNoisyBackground;
  const blurBackground =
    BUILD_CONFIG.isElectron &&
    environment.isMacOs &&
    appSettings.enableBlurBackground;
  return (
    <div
      {...rest}
      className={clsx(styles.appStyle, className, {
        'noisy-background': noisyBackground,
        'blur-background': blurBackground,
      })}
      data-halo-docs-embedded={isHaloDocsEmbedded}
      data-noise-background={noisyBackground}
      data-translucent={blurBackground}
    >
      <LayoutComponent fallback={fallback}>{children}</LayoutComponent>
    </div>
  );
};

const DesktopLayout = ({
  children,
  fallback = false,
}: PropsWithChildren<{ fallback?: boolean }>) => {
  const workspaceService = useServiceOptional(WorkspaceService);
  const isInWorkspace = !!workspaceService;
  return (
    <div className={styles.desktopAppViewContainer}>
      <div className={styles.desktopTabsHeader}>
        <AppTabsHeader
          left={
            <>
              {isInWorkspace && <SidebarSwitch show />}
              {isInWorkspace && <NavigationButtons />}
            </>
          }
        />
      </div>
      <div className={styles.desktopAppViewMain}>
        {fallback ? (
          <AppSidebarFallback />
        ) : (
          isInWorkspace && <RootAppSidebar />
        )}
        <MainContainer>{children}</MainContainer>
      </div>
    </div>
  );
};

const BrowserLayout = ({
  children,
  fallback = false,
}: PropsWithChildren<{ fallback?: boolean }>) => {
  const workspaceService = useServiceOptional(WorkspaceService);
  const isInWorkspace = !!workspaceService;

  return (
    <div className={styles.browserAppViewContainer}>
      {/* Embedded in HALO, the sidebar is drawn only when HALO hands over its own side nav: RootAppSidebar portals
          itself there. Without one (a phone, a collapsed side nav) the embed keeps no sidebar, as before. */}
      {isHaloDocsEmbedded ? (
        hasHaloDocsNav() && !fallback && isInWorkspace && <RootAppSidebar />
      ) : fallback ? (
        <AppSidebarFallback />
      ) : (
        isInWorkspace && <RootAppSidebar />
      )}
      <MainContainer>{children}</MainContainer>
    </div>
  );
};

const LayoutComponent = BUILD_CONFIG.isElectron ? DesktopLayout : BrowserLayout;

const MainContainer = forwardRef<
  HTMLDivElement,
  PropsWithChildren<HTMLAttributes<HTMLDivElement>>
>(function MainContainer({ className, children, ...props }, ref): ReactElement {
  const workspaceService = useServiceOptional(WorkspaceService);
  const isInWorkspace = !!workspaceService;
  const { appSettings } = useAppSettingHelper();
  const appSidebarService = useService(AppSidebarService).sidebar;
  const open = useLiveData(appSidebarService.open$);

  return (
    <div
      {...props}
      className={clsx(styles.mainContainerStyle, className)}
      data-is-desktop={BUILD_CONFIG.isElectron}
      data-transparent={false}
      data-client-border={appSettings.clientBorder}
      data-side-bar-open={!isHaloDocsEmbedded && open && isInWorkspace}
      data-testid="main-container"
      ref={ref}
    >
      {children}
    </div>
  );
});

MainContainer.displayName = 'MainContainer';
