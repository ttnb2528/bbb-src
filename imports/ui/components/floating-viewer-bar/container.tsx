import React from "react";
import FloatingViewerBarComponent from "./component";
import useUsersBasicInfo from "/imports/ui/core/hooks/useUsersBasicInfo";
import { UserBasicInfo } from "/imports/ui/Types/user";
import { layoutSelectInput } from "/imports/ui/components/layout/context";

const FloatingViewerBarContainer: React.FC = () => {
  const { data: usersData } = useUsersBasicInfo(
    (user: Partial<UserBasicInfo>) => user,
  );

  // Fallback to empty array if no data yet or if hook loading
  const users =
    usersData && Array.isArray(usersData) ? (usersData as UserBasicInfo[]) : [];

  const isSidebarContentOpen = layoutSelectInput(
    (i: any) => i.sidebarContent?.isOpen,
  );
  const sidebarContentWidth = layoutSelectInput(
    (i: any) => i.sidebarContent?.width,
  );
  const isSidebarNavOpen = layoutSelectInput(
    (i: any) => i.sidebarNavigation?.isOpen,
  );
  const sidebarNavWidth = layoutSelectInput(
    (i: any) => i.sidebarNavigation?.width,
  );
  const isSidebarOpen = isSidebarContentOpen || isSidebarNavOpen;
  let sidebarWidth = 0;
  if (isSidebarContentOpen)
    sidebarWidth = Math.min(Math.max(sidebarContentWidth || 300, 250), 340);
  else if (isSidebarNavOpen)
    sidebarWidth = Math.min(Math.max(sidebarNavWidth || 300, 250), 340);

  return (
    <FloatingViewerBarComponent
      users={users}
      isSidebarOpen={isSidebarOpen}
      sidebarWidth={sidebarWidth}
    />
  );
};

export default FloatingViewerBarContainer;
