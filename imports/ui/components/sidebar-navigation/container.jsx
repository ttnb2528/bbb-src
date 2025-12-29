import React from 'react';
import { layoutDispatch, layoutSelectOutput, layoutSelectInput } from '../layout/context';
import SidebarNavigation from './component';

const SidebarNavigationContainer = () => {
  const sidebarNavigation = layoutSelectOutput((i) => i.sidebarNavigation);
  const sidebarNavigationInput = layoutSelectInput((i) => i.sidebarNavigation);
  const layoutContextDispatch = layoutDispatch();

  // Luôn render component, dùng transform để ẩn/hiện thay vì display
  return (
    <SidebarNavigation
      {...sidebarNavigation}
      isOpen={sidebarNavigationInput.isOpen}
      contextDispatch={layoutContextDispatch}
    />
  );
};

export default SidebarNavigationContainer;
